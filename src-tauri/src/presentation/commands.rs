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
    let task_id = facade.run_task(topic, pdf_paths).await.map_err(|e| e.to_string())?;

    // Emit TaskStarted event
    let event = serde_json::json!({
        "type": "TaskStarted",
        "payload": { "task_id": &task_id }
    });
    if let Err(e) = app_handle.emit("task-event", event) {
        tracing::error!("failed to emit task event: {}", e);
    }

    Ok(TaskResponse {
        task_id,
        status: "Pending".to_string(),
    })
}

#[tauri::command]
pub async fn resume_task(
    task_id: String,
    container: State<'_, Arc<AppContainer>>,
) -> Result<TaskResponse, String> {
    let facade = crate::application::AppFacade::new(container.inner().clone());
    let task_id = facade.resume_task(&task_id).await.map_err(|e| e.to_string())?;
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

#[tauri::command]
pub async fn get_agent_context() -> Result<String, String> {
    let config_dir = crate::agent::AgentContext::default_config_dir();
    let context = crate::agent::AgentContext::load_from_path(&config_dir)
        .await
        .map_err(|e| e.to_string())?;
    Ok(serde_json::to_string(&context).map_err(|e| e.to_string())?)
}

#[tauri::command]
pub async fn get_agent_personalities() -> Result<String, String> {
    let personalities = vec![
        crate::agent::personality::AgentPersonality::strict_scholar(),
        crate::agent::personality::AgentPersonality::motivational_mentor(),
        crate::agent::personality::AgentPersonality::critical_thinker(),
    ];
    Ok(serde_json::to_string(&personalities).map_err(|e| e.to_string())?)
}

#[tauri::command]
pub async fn get_current_theme() -> Result<String, String> {
    Ok("midnight_scholar".to_string())
}

#[tauri::command]
pub async fn set_theme(theme_id: String) -> Result<(), String> {
    // TODO: Save to config
    Ok(())
}

#[tauri::command]
pub async fn list_plugins() -> Result<String, String> {
    Ok("[]".to_string())
}