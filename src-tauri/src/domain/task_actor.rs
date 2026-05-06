use std::sync::Arc;
use tokio::sync::broadcast;
use citeforge_core::entity::{Task, TaskState};
use citeforge_core::event::{TaskEvent, AgentType};
use crate::domain::execution_context::TaskExecutionContext;
use crate::domain::agent::Agent;
use crate::workspace::Database;
use crate::application::AppContainer;
use metrics::counter;

pub struct TaskActor {
    task_id: String,
    topic: String,
    pdf_paths: Vec<String>,
    container: Arc<AppContainer>,
    db: Arc<Database>,
    event_sender: broadcast::Sender<TaskEvent>,
}

fn agent_type_for_state(state: &TaskState) -> Option<AgentType> {
    match state {
        TaskState::Researching => Some(AgentType::Researcher),
        TaskState::Analyzing => Some(AgentType::Analyst),
        TaskState::Writing => Some(AgentType::Writer),
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
    ) -> broadcast::Receiver<TaskEvent> {
        let (tx, rx) = broadcast::channel(1000);
        let mut actor = Self { task_id, topic, pdf_paths, container, db, event_sender: tx };

        tokio::spawn(async move {
            actor.run().await;
        });

        rx
    }

    async fn run(&mut self) {
        counter!("citeforge.task.started", 1, "task_id" => self.task_id.clone());

        let ctx = TaskExecutionContext::new(
            self.task_id.clone(),
            std::time::Duration::from_secs(3600),
        );

        let mut task = match self.db.get_task(&self.task_id).await {
            Ok(t) => t,
            Err(e) => {
                tracing::error!("failed to get task: {}", e);
                return;
            }
        };

        let event = TaskEvent::TaskStarted { task_id: self.task_id.clone() };
        self.publish_event(event).await;

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
        use crate::agents::researcher::ResearcherInput;
        use crate::agents::analyst::AnalystInput;
        use crate::agents::writer::WriterInput;

        // Phase 1: Researching
        task.transition(TaskState::Researching).map_err(|e| e.to_string())?;
        self.save_and_publish(task).await;

        let researcher = crate::agents::ResearcherAgent::new(Arc::clone(&self.container));
        let researcher_output = researcher.run(ctx, ResearcherInput {
            task_id: self.task_id.clone(),
            topic: self.topic.clone(),
            pdf_paths: self.pdf_paths.clone(),
        }).await.map_err(|e| e.to_string())?;

        let lit_entries = researcher_output.literature_entries.clone();

        // Phase 2: Analyzing
        task.transition(TaskState::Analyzing).map_err(|e| e.to_string())?;
        self.save_and_publish(task).await;

        let analyst = crate::agents::AnalystAgent::new(Arc::clone(&self.container));
        let analyst_output = analyst.run(ctx, AnalystInput {
            task_id: self.task_id.clone(),
            literature_entries: lit_entries.clone(),
        }).await.map_err(|e| e.to_string())?;

        // Phase 3: Writing
        task.transition(TaskState::Writing).map_err(|e| e.to_string())?;
        self.save_and_publish(task).await;

        let writer = crate::agents::WriterAgent::new(Arc::clone(&self.container));
        let _writer_output = writer.run(ctx, WriterInput {
            task_id: self.task_id.clone(),
            topic: self.topic.clone(),
            literature_entries: lit_entries,
            themes: analyst_output.themes,
            trends: analyst_output.trends,
            gaps: analyst_output.gaps,
        }).await.map_err(|e| e.to_string())?;

        Ok(())
    }

    async fn complete_task(&self, task: &mut Task) {
        task.transition(TaskState::Completed).ok();
        self.save_and_publish(task).await;
        counter!("citeforge.task.success", 1);
    }

    async fn fail_task(&self, task: &mut Task, error: String) {
        task.transition(TaskState::Failed { error: error.clone(), retry_count: 0 }).ok();
        self.save_and_publish(task).await;
        counter!("citeforge.task.failed", 1, "error" => error);
    }

    async fn save_and_publish(&self, task: &Task) {
        if let Err(e) = self.db.save_task(task).await {
            tracing::error!("failed to save task: {}", e);
        }

        let event = match &task.state {
            TaskState::Completed => TaskEvent::TaskCompleted { task_id: task.id.clone() },
            TaskState::Failed { error, .. } => TaskEvent::TaskFailed { task_id: task.id.clone(), error: error.clone() },
            state => {
                if let Some(agent) = agent_type_for_state(state) {
                    TaskEvent::AgentCompleted { task_id: task.id.clone(), agent }
                } else {
                    return;
                }
            }
        };

        self.publish_event(event).await;
    }

    async fn publish_event(&self, event: TaskEvent) {
        if let Err(e) = self.event_sender.send(event.clone()) {
            tracing::error!("failed to publish event: {}", e);
        }

        if let Err(e) = self.db.append_event(&self.task_id, &event).await {
            tracing::error!("failed to persist event: {}", e);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use citeforge_core::event::AgentType;

    #[test]
    fn test_agent_type_for_state() {
        assert!(matches!(agent_type_for_state(&TaskState::Researching), Some(AgentType::Researcher)));
        assert!(matches!(agent_type_for_state(&TaskState::Analyzing), Some(AgentType::Analyst)));
        assert!(matches!(agent_type_for_state(&TaskState::Writing), Some(AgentType::Writer)));
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
            assert!(task.transition(state).is_ok(), "Failed to transition to {:?}", task.state);
        }
    }
}
