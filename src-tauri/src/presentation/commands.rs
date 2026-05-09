use std::sync::Arc;
use std::path::Path;
use tauri::{State, Emitter};
use crate::application::AppContainer;
use citeforge_core::event::AgentEvent;
use citeforge_pdf::parser::{TextIndexEntry, OutlineEntry};
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

fn validate_pdf_paths(paths: &[String], workspace_root: &Path) -> Result<(), String> {
    for path_str in paths {
        let path = Path::new(path_str);
        if path.is_relative() {
            return Err(format!("PDF path must be absolute: {}", path_str));
        }
        let canonical = path.canonicalize()
            .map_err(|e| format!("cannot read PDF path {}: {}", path_str, e))?;
        if !canonical.starts_with(workspace_root) {
            return Err(format!("PDF path outside workspace: {}", path_str));
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn run_task(
    topic: String,
    pdf_paths: Vec<String>,
    container: State<'_, Arc<AppContainer>>,
    app_handle: tauri::AppHandle,
) -> Result<TaskResponse, String> {
    if topic.trim().is_empty() {
        return Err("topic cannot be empty".to_string());
    }
    if topic.len() > 1000 {
        return Err("topic too long (max 1000 chars)".to_string());
    }

    validate_pdf_paths(&pdf_paths, &container.config.workspace.root)?;

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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmConfigDto {
    pub provider: String,
    pub base_url: String,
    pub api_key: Option<String>,
    pub model: String,
    pub timeout_secs: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChromaConfigDto {
    pub url: String,
    pub collection: String,
    pub embedding_dimension: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SettingsDto {
    pub llm: LlmConfigDto,
    pub chroma: ChromaConfigDto,
}

#[tauri::command]
pub async fn get_settings(
    container: State<'_, Arc<AppContainer>>,
) -> Result<SettingsDto, String> {
    Ok(SettingsDto {
        llm: LlmConfigDto {
            provider: format!("{:?}", container.config.llm.provider),
            base_url: container.config.llm.base_url.clone(),
            api_key: container.config.llm.api_key.clone(),
            model: container.config.llm.model.clone(),
            timeout_secs: container.config.llm.timeout_secs,
        },
        chroma: ChromaConfigDto {
            url: container.config.chroma.url.clone(),
            collection: container.config.chroma.collection.clone(),
            embedding_dimension: container.config.chroma.embedding_dimension,
        },
    })
}

#[tauri::command]
pub async fn save_settings(
    settings: SettingsDto,
    container: State<'_, Arc<AppContainer>>,
) -> Result<(), String> {
    use crate::config::{LlmProvider, AppConfig};

    // Validate provider
    let provider = match settings.llm.provider.to_lowercase().as_str() {
        "openai" => LlmProvider::OpenAI,
        "anthropic" => LlmProvider::Anthropic,
        "ollama" => LlmProvider::Ollama,
        _ => return Err(format!("invalid provider: {}", settings.llm.provider)),
    };

    // Build new config
    let new_config = AppConfig {
        workspace: container.config.workspace.clone(),
        llm: crate::config::LlmConfig {
            provider,
            base_url: settings.llm.base_url,
            api_key: settings.llm.api_key,
            model: settings.llm.model,
            timeout_secs: settings.llm.timeout_secs,
        },
        chroma: crate::config::ChromaConfig {
            url: settings.chroma.url,
            collection: settings.chroma.collection,
            embedding_dimension: settings.chroma.embedding_dimension,
        },
    };

    // Save to file
    let config_path = container.config.workspace.root.join("config.yaml");
    let yaml = serde_yaml::to_string(&new_config)
        .map_err(|e| format!("failed to serialize config: {}", e))?;
    std::fs::write(&config_path, yaml)
        .map_err(|e| format!("failed to write config: {}", e))?;

    tracing::info!("settings saved to {:?}", config_path);
    Ok(())
}

#[tauri::command]
pub async fn get_events(
    task_id: String,
    since: Option<String>,
    container: State<'_, Arc<AppContainer>>,
) -> Result<Vec<AgentEvent>, String> {
    let event_log = citeforge_workspace::EventLog::new(&container.config.workspace.root, &task_id);
    match since {
        Some(after_id) => event_log.load_since(&after_id).await.map_err(|e| e.to_string()),
        None => event_log.load_all().await.map_err(|e| e.to_string()),
    }
}

#[tauri::command]
pub async fn subscribe_events(
    task_id: String,
    app_handle: tauri::AppHandle,
    container: State<'_, Arc<AppContainer>>,
) -> Result<(), String> {
    let event_log = citeforge_workspace::EventLog::new(&container.config.workspace.root, &task_id);
    let mut last_id = event_log.last_event_id().await.map_err(|e| e.to_string())?;

    tokio::spawn(async move {
        loop {
            tokio::time::sleep(std::time::Duration::from_millis(500)).await;
            let events = match &last_id {
                Some(id) => event_log.load_since(id).await,
                None => event_log.load_all().await,
            };
            match events {
                Ok(events) if !events.is_empty() => {
                    for event in &events {
                        let _ = app_handle.emit("orchestrator-event", event);
                    }
                    last_id = events.last().map(|e| e.id.clone());
                }
                Err(e) => {
                    tracing::error!("failed to poll events: {}", e);
                }
                _ => {}
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn generate_text_index(
    file_path: String,
    container: State<'_, Arc<AppContainer>>,
) -> Result<Vec<TextIndexEntry>, String> {
    let path = std::path::Path::new(&file_path);
    if !path.exists() {
        return Err(format!("file not found: {}", file_path));
    }

    let bytes = std::fs::read(path)
        .map_err(|e| format!("failed to read file: {}", e))?;

    let parser = citeforge_pdf::PdfParser;
    let doc = lopdf::Document::load_mem(&bytes)
        .map_err(|e| format!("failed to parse PDF: {}", e))?;

    Ok(parser.generate_text_index(&doc))
}

#[tauri::command]
pub async fn generate_outline(
    file_path: String,
    container: State<'_, Arc<AppContainer>>,
) -> Result<Vec<OutlineEntry>, String> {
    let path = std::path::Path::new(&file_path);
    if !path.exists() {
        return Err(format!("file not found: {}", file_path));
    }

    let bytes = std::fs::read(path)
        .map_err(|e| format!("failed to read file: {}", e))?;

    let parser = citeforge_pdf::PdfParser;
    let doc = lopdf::Document::load_mem(&bytes)
        .map_err(|e| format!("failed to parse PDF: {}", e))?;

    Ok(parser.generate_outline(&doc))
}

#[tauri::command]
pub async fn search_text_index(
    text_index: Vec<TextIndexEntry>,
    query: String,
) -> Result<Vec<TextIndexEntry>, String> {
    let query_lower = query.to_lowercase();
    let results: Vec<TextIndexEntry> = text_index
        .into_iter()
        .filter(|entry| entry.text.to_lowercase().contains(&query_lower))
        .collect();
    Ok(results)
}

#[tauri::command]
pub async fn analyze_paper_structure(
    file_path: String,
    app_handle: tauri::AppHandle,
) -> Result<citeforge_pdf::structure::PaperStructure, String> {
    let path = std::path::Path::new(&file_path);
    if !path.exists() {
        return Err(format!("file not found: {}", file_path));
    }

    // Emit progress: starting
    let _ = app_handle.emit("decomposition-progress", serde_json::json!({
        "stage": "loading",
        "progress": 10,
        "message": "加载 PDF 文件..."
    }));

    let bytes = std::fs::read(path)
        .map_err(|e| format!("failed to read file: {}", e))?;

    // Emit progress: parsing
    let _ = app_handle.emit("decomposition-progress", serde_json::json!({
        "stage": "parsing",
        "progress": 30,
        "message": "解析 PDF 文本和字体信息..."
    }));

    // Emit progress: extracting structure
    let _ = app_handle.emit("decomposition-progress", serde_json::json!({
        "stage": "heading_detection",
        "progress": 60,
        "message": "检测章节标题和层级..."
    }));

    let structure = citeforge_pdf::structure::extract_structure_from_bytes(&bytes)?;

    // Emit progress: classifying sections
    let _ = app_handle.emit("decomposition-progress", serde_json::json!({
        "stage": "classification",
        "progress": 90,
        "message": "分类章节类型..."
    }));

    // Emit progress: complete
    let _ = app_handle.emit("decomposition-progress", serde_json::json!({
        "stage": "complete",
        "progress": 100,
        "message": format!("结构提取完成，发现 {} 个章节", structure.sections.len())
    }));

    Ok(structure)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TimeStatusDto {
    pub is_tracking: bool,
    pub today_minutes: u32,
    pub active_task: Option<String>,
    pub silent_mode: bool,
}

#[tauri::command]
pub async fn record_activity(
    container: State<'_, Arc<AppContainer>>,
) -> Result<(), String> {
    // Start tracking if not already
    let started = container.time_tracker.start_tracking().await;
    if started {
        tracing::debug!("activity recorded, tracking started/resumed");
    }
    Ok(())
}

#[tauri::command]
pub async fn get_time_status(
    container: State<'_, Arc<AppContainer>>,
) -> Result<TimeStatusDto, String> {
    let is_tracking = container.time_tracker.is_tracking().await;
    let today_minutes = container.time_tracker.get_today_minutes().await;

    Ok(TimeStatusDto {
        is_tracking,
        today_minutes,
        active_task: None, // Will be filled when task events are integrated
        silent_mode: !is_tracking,
    })
}

#[tauri::command]
pub async fn get_time_records(
    container: State<'_, Arc<AppContainer>>,
) -> Result<std::collections::HashMap<String, u32>, String> {
    Ok(container.time_tracker.get_all_records().await)
}