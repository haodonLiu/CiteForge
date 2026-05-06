use std::sync::Arc;
use crate::application::container::AppContainer;
use crate::domain::TaskActor;
use citeforge_core::entity::Task;

pub struct AppFacade {
    container: Arc<AppContainer>,
}

impl AppFacade {
    pub fn new(container: Arc<AppContainer>) -> Self {
        Self { container }
    }

    pub async fn run_task(&self, topic: String, pdf_paths: Vec<String>) -> anyhow::Result<String> {
        let task_id = format!("task-{}", uuid::Uuid::new_v4());
        let task = Task::new(task_id.clone(), topic.clone());

        self.container.db.save_task(&task).await?;

        let _rx = TaskActor::spawn(
            task_id.clone(),
            Arc::clone(&self.container),
            Arc::clone(&self.container.db),
            topic,
            pdf_paths,
        ).await;

        Ok(task_id)
    }

    pub async fn get_status(&self, task_id: &str) -> anyhow::Result<Task> {
        self.container.db.get_task(task_id).await.map_err(|e| e.into())
    }

    pub async fn resume_task(&self, task_id: &str) -> anyhow::Result<String> {
        let task = self.container.db.get_task(task_id).await
            .map_err(|e| anyhow::anyhow!("task not found: {}", e))?;

        match &task.state {
            citeforge_core::entity::TaskState::Completed
            | citeforge_core::entity::TaskState::Failed { .. } => {
                return Err(anyhow::anyhow!("task is in terminal state: {:?}", task.state));
            }
            _ => {}
        }

        let _rx = TaskActor::spawn(
            task.id.clone(),
            Arc::clone(&self.container),
            Arc::clone(&self.container.db),
            task.topic.clone(),
            Vec::new(),
        ).await;

        Ok(task.id)
    }
}
