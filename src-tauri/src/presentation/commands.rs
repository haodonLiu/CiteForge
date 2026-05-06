use std::sync::Arc;
use tauri::{State, Emitter};
use crate::application::AppContainer;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct RunTaskRequest {
    pub topic: String,
    pub pdf_paths: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskResponse {
    pub task_id: String,
    pub status: String,
}

#[tauri::command]
pub async fn run_task(
    topic: String,
    pdf_paths: Vec<String>,
    container: State<'_, Arc<AppContainer>>,
    app_handle: tauri::AppHandle,
) -> Result<TaskResponse, String> {
    let facade = crate::application::AppFacade::new(container.inner().clone());
    let task_id = facade.run_task(topic).await.map_err(|e| e.to_string())?;

    // Emit TaskStarted event
    let event = serde_json::json!({
        "type": "TaskStarted",
        "payload": { "task_id": &task_id }
    });
    let _ = app_handle.emit("task-event", event);

    Ok(TaskResponse {
        task_id,
        status: "Pending".to_string(),
    })
}

#[tauri::command]
pub async fn resume_task(
    workspace_path: String,
    container: State<'_, Arc<AppContainer>>,
) -> Result<TaskResponse, String> {
    let facade = crate::application::AppFacade::new(container.inner().clone());
    let task_id = facade.resume_task(&workspace_path).await.map_err(|e| e.to_string())?;
    Ok(TaskResponse {
        task_id,
        status: "Resuming".to_string(),
    })
}

#[tauri::command]
pub async fn get_task_status(
    task_id: String,
    container: State<'_, Arc<AppContainer>>,
) -> Result<TaskResponse, String> {
    let facade = crate::application::AppFacade::new(container.inner().clone());
    let task = facade.get_status(&task_id).await.map_err(|e| e.to_string())?;
    Ok(TaskResponse {
        task_id: task.id,
        status: format!("{:?}", task.state),
    })
}
