use crate::application::AppContainer;
use crate::domain::agent::Agent;
use crate::domain::execution_context::TaskExecutionContext;
use crate::workspace::Database;
use citeforge_core::entity::{Task, TaskState};
use citeforge_core::event::{AgentEvent, AgentType, EventSource, EventType, TaskEvent};
use citeforge_workspace::EventLog;
use futures::FutureExt;
use metrics::counter;
use std::panic::AssertUnwindSafe;
use std::sync::Arc;
use tokio::sync::{broadcast, mpsc};

pub struct TaskActor {
    task_id: String,
    topic: String,
    pdf_paths: Vec<String>,
    container: Arc<AppContainer>,
    db: Arc<Database>,
    event_sender: broadcast::Sender<TaskEvent>,
    agent_event_sender: broadcast::Sender<AgentEvent>,
    event_log: Arc<EventLog>,
}

fn agent_type_for_state(state: &TaskState) -> Option<AgentType> {
    match state {
        TaskState::Researching => Some(AgentType::Researcher),
        TaskState::Analyzing => Some(AgentType::Analyst),
        TaskState::Writing => Some(AgentType::Writer),
        TaskState::AnalyzingAndWriting => None,
        _ => None,
    }
}

impl TaskActor {
    pub async fn spawn(
        task_id: String,
        container: Arc<AppContainer>,
        db: Arc<Database>,
        topic: String,
        pdf_paths: Vec<String>,
        workspace_root: &std::path::Path,
    ) -> (
        broadcast::Receiver<TaskEvent>,
        broadcast::Receiver<AgentEvent>,
    ) {
        let (tx, rx) = broadcast::channel(1000);
        let (agent_tx, agent_rx) = broadcast::channel(10000);
        let event_log = Arc::new(EventLog::new(workspace_root, &task_id));

        let mut actor = Self {
            task_id,
            topic,
            pdf_paths,
            container,
            db,
            event_sender: tx,
            agent_event_sender: agent_tx,
            event_log,
        };

        let task_id_clone = actor.task_id.clone();
        tokio::spawn(
            AssertUnwindSafe(async move {
                actor.run().await;
            })
            .catch_unwind()
            .then(move |result| async move {
                if let Err(e) = result {
                    let msg = if let Some(s) = e.downcast_ref::<&str>() {
                        s.to_string()
                    } else if let Some(s) = e.downcast_ref::<String>() {
                        s.clone()
                    } else {
                        "unknown panic".to_string()
                    };
                    tracing::error!("task {} panicked: {}", task_id_clone, msg);
                    counter!("citeforge.task.panic", 1, "task_id" => task_id_clone);
                }
            }),
        );

        (rx, agent_rx)
    }

    async fn emit_agent_event(
        &self,
        source: EventSource,
        event_type: EventType,
        payload: serde_json::Value,
        requires_action: bool,
    ) {
        let event = AgentEvent::new(source, event_type, payload, requires_action);
        if let Err(e) = self.event_log.append(&event).await {
            tracing::error!("failed to log agent event: {}", e);
        }
        if let Err(e) = self.agent_event_sender.send(event) {
            tracing::warn!("failed to broadcast agent event: {}", e);
        }
    }

    async fn run(&mut self) {
        counter!("citeforge.task.started", 1, "task_id" => self.task_id.clone());

        let ctx =
            TaskExecutionContext::new(self.task_id.clone(), std::time::Duration::from_secs(3600));

        let mut task = match self.db.get_task(&self.task_id).await {
            Ok(t) => t,
            Err(e) => {
                tracing::error!("failed to get task: {}", e);
                return;
            }
        };

        let event = TaskEvent::TaskStarted {
            task_id: self.task_id.clone(),
        };
        if let Err(e) = self.publish_event(event).await {
            tracing::error!("failed to publish task started event: {}", e);
        }

        let result = self.execute_pipeline(&ctx, &mut task).await;

        if let Err(e) = result {
            self.fail_task(&mut task, e.to_string()).await;
        } else {
            self.complete_task(&mut task).await;
        }

        counter!("citeforge.task.completed", 1, "task_id" => self.task_id.clone());
    }

    async fn execute_pipeline(
        &self,
        ctx: &TaskExecutionContext,
        task: &mut Task,
    ) -> Result<(), String> {
        use crate::agents::analyst::{AnalystInput, AnalystOutput};
        use crate::agents::researcher::ResearcherInput;
        use crate::agents::writer::WriterInput;

        // Phase 1: Researching
        task.transition(TaskState::Researching)
            .map_err(|e| e.to_string())?;
        self.save_and_publish(task)
            .await
            .map_err(|e| e.to_string())?;
        self.emit_agent_event(
            EventSource::Orchestrator,
            EventType::StateTransition,
            serde_json::json!({ "from": "Pending", "to": "Researching" }),
            false,
        )
        .await;

        self.emit_agent_event(
            EventSource::Researcher,
            EventType::ResearchStarted,
            serde_json::json!({ "topic": self.topic }),
            false,
        )
        .await;

        let researcher = crate::agents::ResearcherAgent::new(Arc::clone(&self.container));
        let researcher_output = researcher
            .run(
                ctx,
                ResearcherInput {
                    task_id: self.task_id.clone(),
                    topic: self.topic.clone(),
                    pdf_paths: self.pdf_paths.clone(),
                },
            )
            .await
            .map_err(|e| e.to_string())?;

        let lit_entries = researcher_output.literature_entries.clone();
        self.emit_agent_event(
            EventSource::Researcher,
            EventType::ResearchCompleted,
            serde_json::json!({ "new_count": lit_entries.len(), "total_count": lit_entries.len() }),
            false,
        )
        .await;

        // Phase 2: Analyzing + Writing (concurrent)
        task.transition(TaskState::AnalyzingAndWriting)
            .map_err(|e| e.to_string())?;
        self.save_and_publish(task)
            .await
            .map_err(|e| e.to_string())?;
        self.emit_agent_event(
            EventSource::Orchestrator,
            EventType::StateTransition,
            serde_json::json!({ "from": "Researching", "to": "AnalyzingAndWriting" }),
            false,
        )
        .await;

        self.emit_agent_event(
            EventSource::Analyst,
            EventType::AnalysisStarted,
            serde_json::json!({ "segment": null }),
            false,
        )
        .await;

        self.emit_agent_event(
            EventSource::Writer,
            EventType::WritingStarted,
            serde_json::json!({ "segment": "full" }),
            false,
        )
        .await;

        // Channel for Analyst → Writer communication
        let (tx, mut rx) = mpsc::channel::<AnalystOutput>(1);

        // Clone context for concurrent tasks
        let analyst_ctx = ctx.clone();
        let writer_ctx = ctx.clone();

        // Spawn Analyst (sends output via channel)
        let analyst_container = Arc::clone(&self.container);
        let analyst_task_id = self.task_id.clone();
        let analyst_entries = lit_entries.clone();
        let analyst_handle = tokio::spawn(async move {
            let analyst = crate::agents::AnalystAgent::new(analyst_container);
            let output = analyst
                .run(
                    &analyst_ctx,
                    AnalystInput {
                        task_id: analyst_task_id,
                        literature_entries: analyst_entries,
                    },
                )
                .await
                .map_err(|e| e.to_string())?;
            let _ = tx.send(output.clone()).await;
            Ok::<AnalystOutput, String>(output)
        });

        // Spawn Writer (receives themes via channel)
        let writer_container = Arc::clone(&self.container);
        let writer_task_id = self.task_id.clone();
        let writer_topic = self.topic.clone();
        let writer_entries = lit_entries;
        let writer_handle = tokio::spawn(async move {
            // Wait for analyst output
            let analyst_output = rx
                .recv()
                .await
                .ok_or_else(|| "analyst channel closed without output".to_string())?;

            let writer = crate::agents::WriterAgent::new(writer_container);
            writer
                .run(
                    &writer_ctx,
                    WriterInput {
                        task_id: writer_task_id,
                        topic: writer_topic,
                        literature_entries: writer_entries,
                        themes: analyst_output.themes,
                        trends: analyst_output.trends,
                        gaps: analyst_output.gaps,
                    },
                )
                .await
                .map_err(|e| e.to_string())?;
            Ok::<(), String>(())
        });

        // Wait for both to complete
        let (analyst_result, writer_result) = tokio::join!(analyst_handle, writer_handle);

        let analyst_output = analyst_result
            .map_err(|e| format!("analyst task panicked: {}", e))?
            .map_err(|e| format!("analyst failed: {}", e))?;

        writer_result
            .map_err(|e| format!("writer task panicked: {}", e))?
            .map_err(|e| format!("writer failed: {}", e))?;

        let theme_names: Vec<String> = analyst_output
            .themes
            .iter()
            .map(|t| t.name.clone())
            .collect();
        self.emit_agent_event(
            EventSource::Analyst,
            EventType::AnalysisCompleted,
            serde_json::json!({ "themes": theme_names, "narrative_flow": [] }),
            false,
        )
        .await;

        Ok(())
    }

    async fn complete_task(&self, task: &mut Task) {
        if let Err(e) = task.transition(TaskState::Completed) {
            tracing::error!("failed to transition task to Completed: {}", e);
        }
        if let Err(e) = self.save_and_publish(task).await {
            tracing::error!("failed to save and publish task completion: {}", e);
        }
        counter!("citeforge.task.success", 1);
    }

    async fn fail_task(&self, task: &mut Task, error: String) {
        let new_state = TaskState::Failed {
            error: error.clone(),
            retry_count: 0,
        };
        if let Err(e) = task.transition(new_state) {
            tracing::error!("failed to transition task to Failed: {}", e);
        }
        if let Err(e) = self.save_and_publish(task).await {
            tracing::error!("failed to save and publish task failure: {}", e);
        }
        counter!("citeforge.task.failed", 1, "error" => error);
    }

    async fn save_and_publish(&self, task: &Task) -> Result<(), String> {
        self.db.save_task(task).await.map_err(|e| e.to_string())?;

        let event = match &task.state {
            TaskState::Completed => TaskEvent::TaskCompleted {
                task_id: task.id.clone(),
            },
            TaskState::Failed { error, .. } => TaskEvent::TaskFailed {
                task_id: task.id.clone(),
                error: error.clone(),
            },
            state => {
                if let Some(agent) = agent_type_for_state(state) {
                    TaskEvent::AgentCompleted {
                        task_id: task.id.clone(),
                        agent,
                    }
                } else {
                    return Ok(());
                }
            }
        };

        self.publish_event(event).await
    }

    async fn publish_event(&self, event: TaskEvent) -> Result<(), String> {
        self.event_sender
            .send(event.clone())
            .map_err(|e| format!("failed to publish event: {}", e))?;

        self.db
            .append_event(&self.task_id, &event)
            .await
            .map_err(|e| format!("failed to persist event: {}", e))?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use citeforge_core::event::AgentType;

    #[test]
    fn test_agent_type_for_state() {
        assert!(matches!(
            agent_type_for_state(&TaskState::Researching),
            Some(AgentType::Researcher)
        ));
        assert!(matches!(
            agent_type_for_state(&TaskState::Analyzing),
            Some(AgentType::Analyst)
        ));
        assert!(matches!(
            agent_type_for_state(&TaskState::Writing),
            Some(AgentType::Writer)
        ));
        assert!(agent_type_for_state(&TaskState::Pending).is_none());
        assert!(agent_type_for_state(&TaskState::Completed).is_none());
    }

    #[test]
    fn test_pipeline_produces_correct_state_sequence() {
        let mut task = Task::new("t1".into(), "topic".into());
        let states = vec![
            TaskState::Researching,
            TaskState::Analyzing,
            TaskState::Writing,
            TaskState::Completed,
        ];
        for state in states {
            assert!(
                task.transition(state).is_ok(),
                "Failed to transition to {:?}",
                task.state
            );
        }
    }
}
