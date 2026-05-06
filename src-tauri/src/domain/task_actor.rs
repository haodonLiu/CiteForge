use std::sync::Arc;
use tokio::sync::{mpsc, broadcast};
use dashmap::DashMap;
use citeforge_core::entity::{Task, TaskState};
use citeforge_core::event::TaskEvent;
use crate::domain::execution_context::TaskExecutionContext;
use crate::workspace::Database;
use crate::application::AppContainer;
use metrics::{counter, gauge};

pub struct TaskActor {
    task_id: String,
    container: Arc<AppContainer>,
    db: Arc<Database>,
    event_sender: broadcast::Sender<TaskEvent>,
}

impl TaskActor {
    pub async fn spawn(
        task_id: String,
        container: Arc<AppContainer>,
        db: Arc<Database>,
    ) -> broadcast::Receiver<TaskEvent> {
        let (tx, rx) = broadcast::channel(1000);
        let actor = Self { task_id, container, db, event_sender: tx };

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

        if let Err(e) = task.transition(TaskState::Researching) {
            self.fail_task(&mut task, e.to_string()).await;
            return;
        }
        self.save_and_publish(&task).await;

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
        task.transition(TaskState::Researching).map_err(|e| e.to_string())?;
        self.save_and_publish(task).await;

        task.transition(TaskState::Analyzing).map_err(|e| e.to_string())?;
        self.save_and_publish(task).await;

        task.transition(TaskState::Writing).map_err(|e| e.to_string())?;
        self.save_and_publish(task).await;

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
            _ => TaskEvent::AgentCompleted { task_id: task.id.clone(), agent: citeforge_core::event::AgentType::Researcher },
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
