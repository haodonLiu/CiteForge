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
        let topic = topic.trim().to_string();
        if topic.is_empty() {
            return Err(anyhow::anyhow!("topic cannot be empty"));
        }
        if topic.len() > 1000 {
            return Err(anyhow::anyhow!("topic too long (max 1000 chars)"));
        }

        let task_id = format!("task-{}", uuid::Uuid::new_v4());
        let task = Task::new(task_id.clone(), topic.clone());

        self.container.db.save_task(&task).await?;

        let (_rx, _agent_rx) = TaskActor::spawn(
            task_id.clone(),
            Arc::clone(&self.container),
            Arc::clone(&self.container.db),
            topic,
            pdf_paths,
            &self.container.config.workspace.root,
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

        let (_rx, _agent_rx) = TaskActor::spawn(
            task.id.clone(),
            Arc::clone(&self.container),
            Arc::clone(&self.container.db),
            task.topic.clone(),
            Vec::new(),
            &self.container.config.workspace.root,
        ).await;

        Ok(task.id)
    }
}
