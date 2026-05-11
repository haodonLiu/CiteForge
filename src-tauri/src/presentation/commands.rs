use crate::application::AppContainer;
use citeforge_core::entity::LiteratureEntry;
use citeforge_core::event::AgentEvent;
use citeforge_core::ports::SearchEngine;
use citeforge_pdf::parser::{OutlineEntry, TextIndexEntry};
use citeforge_workspace::LiteratureDto;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Arc;
use tauri::{Emitter, State};

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
        let canonical = path
            .canonicalize()
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
    let task_id = facade
        .run_task(topic, pdf_paths, app_handle.clone())
        .await
        .map_err(|e| e.to_string())?;

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
    let task_id = facade
        .resume_task(&task_id)
        .await
        .map_err(|e| e.to_string())?;
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
    let task = facade
        .get_status(&task_id)
        .await
        .map_err(|e| e.to_string())?;
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
    serde_json::to_string(&context).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_agent_personalities() -> Result<String, String> {
    let personalities = vec![
        crate::agent::personality::AgentPersonality::strict_scholar(),
        crate::agent::personality::AgentPersonality::motivational_mentor(),
        crate::agent::personality::AgentPersonality::critical_thinker(),
    ];
    serde_json::to_string(&personalities).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_current_theme() -> Result<String, String> {
    Ok("midnight_scholar".to_string())
}

#[tauri::command]
pub async fn set_theme(_theme_id: String) -> Result<(), String> {
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
pub async fn get_settings(container: State<'_, Arc<AppContainer>>) -> Result<SettingsDto, String> {
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
    use crate::config::{AppConfig, LlmProvider};

    // Validate provider
    let provider = match settings.llm.provider.to_lowercase().as_str() {
        "openai" => LlmProvider::OpenAI,
        "anthropic" => LlmProvider::Anthropic,
        "ollama" => LlmProvider::Ollama,
        "modelscope" => LlmProvider::ModelScope,
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
        silent_threshold_minutes: container.config.silent_threshold_minutes,
        theme: container.config.theme.clone(),
        font: container.config.font.clone(),
    };

    // Save to file
    let config_path = container.config.workspace.root.join("config.yaml");
    let yaml = serde_yaml::to_string(&new_config)
        .map_err(|e| format!("failed to serialize config: {}", e))?;
    std::fs::write(&config_path, yaml).map_err(|e| format!("failed to write config: {}", e))?;

    tracing::info!("settings saved to {:?}", config_path);
    Ok(())
}

#[tauri::command]
pub async fn set_setting(
    key: String,
    value: String,
    container: State<'_, Arc<AppContainer>>,
) -> Result<(), String> {
    match key.as_str() {
        "theme" | "font" => {
            // Update in-memory config
            let mut config = container.config.clone();
            match key.as_str() {
                "theme" => config.theme = Some(value),
                "font" => config.font = Some(value),
                _ => return Err("invalid key".to_string()),
            }

            // Save to file
            let config_path = container.config.workspace.root.join("config.yaml");
            let yaml = serde_yaml::to_string(&config)
                .map_err(|e| format!("failed to serialize config: {}", e))?;
            std::fs::write(&config_path, yaml)
                .map_err(|e| format!("failed to write config: {}", e))?;

            tracing::info!("setting {} saved", key);
            Ok(())
        }
        _ => Err(format!("unknown setting key: {}", key)),
    }
}

#[tauri::command]
pub async fn get_events(
    task_id: String,
    since: Option<String>,
    container: State<'_, Arc<AppContainer>>,
) -> Result<Vec<AgentEvent>, String> {
    let event_log = citeforge_workspace::EventLog::new(&container.config.workspace.root, &task_id);
    match since {
        Some(after_id) => event_log
            .load_since(&after_id)
            .await
            .map_err(|e| e.to_string()),
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
    _container: State<'_, Arc<AppContainer>>,
) -> Result<Vec<TextIndexEntry>, String> {
    let path = std::path::Path::new(&file_path);
    if !path.exists() {
        return Err(format!("file not found: {}", file_path));
    }

    let bytes = std::fs::read(path).map_err(|e| format!("failed to read file: {}", e))?;

    let parser = citeforge_pdf::PdfParser;
    let doc =
        lopdf::Document::load_mem(&bytes).map_err(|e| format!("failed to parse PDF: {}", e))?;

    Ok(parser.generate_text_index(&doc))
}

#[tauri::command]
pub async fn generate_outline(
    file_path: String,
    _container: State<'_, Arc<AppContainer>>,
) -> Result<Vec<OutlineEntry>, String> {
    let path = std::path::Path::new(&file_path);
    if !path.exists() {
        return Err(format!("file not found: {}", file_path));
    }

    let bytes = std::fs::read(path).map_err(|e| format!("failed to read file: {}", e))?;

    let parser = citeforge_pdf::PdfParser;
    let doc =
        lopdf::Document::load_mem(&bytes).map_err(|e| format!("failed to parse PDF: {}", e))?;

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
    let _ = app_handle.emit(
        "decomposition-progress",
        serde_json::json!({
            "stage": "loading",
            "progress": 10,
            "message": "加载 PDF 文件..."
        }),
    );

    let bytes = std::fs::read(path).map_err(|e| format!("failed to read file: {}", e))?;

    // Emit progress: parsing
    let _ = app_handle.emit(
        "decomposition-progress",
        serde_json::json!({
            "stage": "parsing",
            "progress": 30,
            "message": "解析 PDF 文本和字体信息..."
        }),
    );

    // Emit progress: extracting structure
    let _ = app_handle.emit(
        "decomposition-progress",
        serde_json::json!({
            "stage": "heading_detection",
            "progress": 60,
            "message": "检测章节标题和层级..."
        }),
    );

    let structure = citeforge_pdf::structure::extract_structure_from_bytes(&bytes)?;

    // Emit progress: classifying sections
    let _ = app_handle.emit(
        "decomposition-progress",
        serde_json::json!({
            "stage": "classification",
            "progress": 90,
            "message": "分类章节类型..."
        }),
    );

    // Emit progress: complete
    let _ = app_handle.emit(
        "decomposition-progress",
        serde_json::json!({
            "stage": "complete",
            "progress": 100,
            "message": format!("结构提取完成，发现 {} 个章节", structure.sections.len())
        }),
    );

    Ok(structure)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TimeStatusDto {
    pub is_tracking: bool,
    pub today_minutes: u32,
    pub active_task: Option<String>,
    pub silent_mode: bool,
    pub silent_threshold_minutes: u32,
}

#[tauri::command]
pub async fn record_activity(container: State<'_, Arc<AppContainer>>) -> Result<(), String> {
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
        silent_threshold_minutes: container.config.silent_threshold_minutes,
    })
}

#[tauri::command]
pub async fn get_time_records(
    container: State<'_, Arc<AppContainer>>,
) -> Result<std::collections::HashMap<String, u32>, String> {
    Ok(container.time_tracker.get_all_records().await)
}

#[tauri::command]
pub async fn get_literature(
    task_id: Option<String>,
    container: State<'_, Arc<AppContainer>>,
) -> Result<Vec<LiteratureDto>, String> {
    match task_id {
        Some(tid) => container
            .db
            .get_literature_by_task(&tid)
            .await
            .map_err(|e| e.to_string()),
        None => container
            .db
            .get_global_literature()
            .await
            .map_err(|e| e.to_string()),
    }
}

#[tauri::command]
pub async fn import_pdfs(
    task_id: Option<String>,
    pdf_paths: Vec<String>,
    container: State<'_, Arc<AppContainer>>,
) -> Result<Vec<LiteratureDto>, String> {
    use citeforge_pdf::PdfParser;

    let parser = PdfParser;
    let mut imported: Vec<LiteratureDto> = Vec::new();

    for path_str in &pdf_paths {
        let path = Path::new(path_str);
        if !path.exists() {
            tracing::warn!("PDF not found: {}", path_str);
            continue;
        }

        // Parse PDF to extract metadata
        let bytes = std::fs::read(path).map_err(|e| format!("failed to read {}: {}", path_str, e))?;
        let doc = lopdf::Document::load_mem(&bytes)
            .map_err(|e| format!("failed to parse {}: {}", path_str, e))?;

        // Extract title from trailer or filename
        let title = parser
            .extract_metadata(&doc)
            .and_then(|m| m.title)
            .unwrap_or_else(|| {
                path.file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("Unknown")
                    .to_string()
            });

        // Authors from metadata or use Unknown
        let authors: Vec<String> = parser
            .extract_metadata(&doc)
            .map(|m| {
                if m.authors.is_empty() {
                    vec!["Unknown".to_string()]
                } else {
                    m.authors
                }
            })
            .unwrap_or_else(|| vec!["Unknown".to_string()]);

        let lit = LiteratureDto {
            id: uuid::Uuid::new_v4().to_string(),
            task_id: task_id.clone().unwrap_or_default(),
            title,
            authors,
            abstract_text: None,
            doi: None,
            year: None,
            venue: None,
            citation_count: None,
            file_path: Some(path_str.clone()),
            source: "pdf".to_string(),
            verified: false,
            created_at: chrono::Utc::now().to_rfc3339(),
        };

        container
            .db
            .save_literature(&lit)
            .await
            .map_err(|e| format!("failed to save literature: {}", e))?;

        imported.push(lit);
    }

    Ok(imported)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResultDto {
    pub paper_id: String,
    pub title: String,
    pub authors: Vec<String>,
    pub abstract_text: Option<String>,
    pub year: Option<i32>,
    pub venue: Option<String>,
    pub citation_count: Option<i32>,
    pub doi: Option<String>,
}

#[tauri::command]
pub async fn search_semantic_scholar(
    query: String,
    limit: Option<usize>,
    container: State<'_, Arc<AppContainer>>,
) -> Result<Vec<SearchResultDto>, String> {
    use citeforge_search::SemanticScholarClient;

    let limit = limit.unwrap_or(10).min(100);
    let api_key = container.config.llm.api_key.clone();

    let client = SemanticScholarClient::new(api_key);
    let results: Vec<LiteratureEntry> = client
        .search(&query, limit)
        .await
        .map_err(|e| e.to_string())?;

    let results: Vec<SearchResultDto> = results
        .into_iter()
        .map(|entry| SearchResultDto {
            paper_id: entry.id,
            title: entry.title,
            authors: entry.authors,
            abstract_text: entry.abstract_text,
            year: entry.year,
            venue: entry.venue,
            citation_count: entry.citation_count,
            doi: entry.doi,
        })
        .collect();

    Ok(results)
}

#[tauri::command]
pub async fn enrich_literature_metadata(
    literature_id: String,
    container: State<'_, Arc<AppContainer>>,
) -> Result<citeforge_workspace::LiteratureDto, String> {
    use citeforge_search::SemanticScholarClient;

    // Load existing literature
    let all = container
        .db
        .get_literature_by_task("*")
        .await
        .map_err(|e| e.to_string())?;

    let mut lit = all
        .into_iter()
        .find(|l| l.id == literature_id)
        .ok_or_else(|| "literature not found".to_string())?;

    let query = lit.title.clone();
    let api_key = container.config.llm.api_key.clone();
    let client = SemanticScholarClient::new(api_key);

    let results = client
        .search(&query, 3)
        .await
        .map_err(|e| e.to_string())?;

    if let Some(best) = results.into_iter().next() {
        lit.abstract_text = lit.abstract_text.or(best.abstract_text);
        lit.doi = lit.doi.or(best.doi);
        lit.year = lit.year.or(best.year);
        lit.venue = lit.venue.or(best.venue);
        lit.citation_count = lit.citation_count.or(best.citation_count);
        if lit.authors.is_empty() || lit.authors == vec!["Unknown".to_string()] {
            lit.authors = best.authors;
        }
    }

    container
        .db
        .save_literature(&lit)
        .await
        .map_err(|e| format!("failed to save enriched literature: {}", e))?;

    Ok(lit)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InsertCitationDto {
    pub paper_id: String,
    pub title: String,
    pub authors: Vec<String>,
    pub abstract_text: Option<String>,
    pub year: Option<i32>,
    pub venue: Option<String>,
    pub citation_count: Option<i32>,
    pub doi: Option<String>,
}

#[tauri::command]
pub async fn insert_citation(
    task_id: Option<String>,
    citation: InsertCitationDto,
    container: State<'_, Arc<AppContainer>>,
) -> Result<LiteratureDto, String> {
    let lit = LiteratureDto {
        id: citation.paper_id,
        task_id: task_id.unwrap_or_default(),
        title: citation.title,
        authors: citation.authors,
        abstract_text: citation.abstract_text,
        doi: citation.doi,
        year: citation.year,
        venue: citation.venue,
        citation_count: citation.citation_count,
        file_path: None,
        source: "semantic_scholar".to_string(),
        verified: false,
        created_at: chrono::Utc::now().to_rfc3339(),
    };

    container
        .db
        .save_literature(&lit)
        .await
        .map_err(|e| format!("failed to save citation: {}", e))?;

    Ok(lit)
}

#[tauri::command]
pub async fn copy_to_task(
    literature_id: String,
    task_id: String,
    container: State<'_, Arc<AppContainer>>,
) -> Result<LiteratureDto, String> {
    container
        .db
        .copy_to_task(&literature_id, &task_id)
        .await
        .map_err(|e| format!("failed to copy to task: {}", e))
}

// ===================== NOTES =====================

#[tauri::command]
pub async fn save_note(
    note: citeforge_workspace::NoteDto,
    container: State<'_, Arc<AppContainer>>,
) -> Result<citeforge_workspace::NoteDto, String> {
    let now = chrono::Utc::now().to_rfc3339();
    let note = citeforge_workspace::NoteDto {
        updated_at: now,
        ..note
    };
    container
        .db
        .save_note(&note)
        .await
        .map_err(|e| format!("failed to save note: {}", e))?;
    Ok(note)
}

#[tauri::command]
pub async fn get_notes(
    task_id: Option<String>,
    container: State<'_, Arc<AppContainer>>,
) -> Result<Vec<citeforge_workspace::NoteDto>, String> {
    container
        .db
        .get_notes(task_id.as_deref())
        .await
        .map_err(|e| format!("failed to get notes: {}", e))
}

#[tauri::command]
pub async fn get_note_by_id(
    note_id: String,
    container: State<'_, Arc<AppContainer>>,
) -> Result<Option<citeforge_workspace::NoteDto>, String> {
    container
        .db
        .get_note_by_id(&note_id)
        .await
        .map_err(|e| format!("failed to get note: {}", e))
}

#[tauri::command]
pub async fn delete_note(
    note_id: String,
    container: State<'_, Arc<AppContainer>>,
) -> Result<(), String> {
    container
        .db
        .delete_note(&note_id)
        .await
        .map_err(|e| format!("failed to delete note: {}", e))
}

#[tauri::command]
pub async fn search_notes(
    query: String,
    container: State<'_, Arc<AppContainer>>,
) -> Result<Vec<citeforge_workspace::NoteDto>, String> {
    container
        .db
        .search_notes(&query)
        .await
        .map_err(|e| format!("failed to search notes: {}", e))
}

// ===================== NOTE LINKS =====================

#[tauri::command]
pub async fn create_note_link(
    source_note_id: String,
    target_note_id: String,
    link_type: Option<String>,
    container: State<'_, Arc<AppContainer>>,
) -> Result<citeforge_workspace::NoteLinkDto, String> {
    let link = citeforge_workspace::NoteLinkDto {
        id: format!("link-{}", uuid::Uuid::new_v4()),
        source_note_id,
        target_note_id,
        link_type: link_type.unwrap_or_else(|| "reference".to_string()),
        created_at: chrono::Utc::now().to_rfc3339(),
    };
    container
        .db
        .create_note_link(&link)
        .await
        .map_err(|e| format!("failed to create note link: {}", e))?;
    Ok(link)
}

#[tauri::command]
pub async fn get_note_links(
    note_id: String,
    container: State<'_, Arc<AppContainer>>,
) -> Result<Vec<citeforge_workspace::NoteLinkDto>, String> {
    container
        .db
        .get_note_links(&note_id)
        .await
        .map_err(|e| format!("failed to get note links: {}", e))
}

#[tauri::command]
pub async fn get_note_backlinks(
    note_id: String,
    container: State<'_, Arc<AppContainer>>,
) -> Result<Vec<citeforge_workspace::NoteLinkDto>, String> {
    container
        .db
        .get_note_backlinks(&note_id)
        .await
        .map_err(|e| format!("failed to get backlinks: {}", e))
}

#[tauri::command]
pub async fn delete_note_link(
    source_note_id: String,
    target_note_id: String,
    container: State<'_, Arc<AppContainer>>,
) -> Result<(), String> {
    container
        .db
        .delete_note_link(&source_note_id, &target_note_id)
        .await
        .map_err(|e| format!("failed to delete note link: {}", e))
}

// ===================== READING PROGRESS =====================

#[tauri::command]
pub async fn save_reading_progress(
    progress: citeforge_workspace::ReadingProgressDto,
    container: State<'_, Arc<AppContainer>>,
) -> Result<(), String> {
    container
        .db
        .save_reading_progress(&progress)
        .await
        .map_err(|e| format!("failed to save reading progress: {}", e))
}

#[tauri::command]
pub async fn get_reading_progress(
    literature_id: String,
    container: State<'_, Arc<AppContainer>>,
) -> Result<Option<citeforge_workspace::ReadingProgressDto>, String> {
    container
        .db
        .get_reading_progress(&literature_id)
        .await
        .map_err(|e| format!("failed to get reading progress: {}", e))
}

// ===================== AGENT CHAT =====================

#[tauri::command]
pub async fn chat_with_agent(
    task_id: String,
    agent_name: String,
    personality_prompt: String,
    message: String,
    container: State<'_, Arc<AppContainer>>,
) -> Result<String, String> {
    let service = crate::application::AgentChatService::new(
        Arc::clone(&container.db),
        Arc::clone(&container.llm),
    );

    service
        .chat(
            &task_id,
            &agent_name,
            &personality_prompt,
            &message,
            &crate::application::ChatContext::default(),
        )
        .await
        .map_err(|e| format!("agent chat error: {}", e))
}

#[tauri::command]
pub async fn get_agent_conversation(
    task_id: String,
    agent_name: Option<String>,
    limit: Option<i64>,
    container: State<'_, Arc<AppContainer>>,
) -> Result<Vec<citeforge_workspace::AgentConversationDto>, String> {
    container
        .db
        .get_agent_conversation(&task_id, agent_name.as_deref(), limit)
        .await
        .map_err(|e| format!("failed to get conversation: {}", e))
}

#[tauri::command]
pub async fn start_agent_discussion(
    task_id: String,
    topic: String,
    literature_ids: Vec<String>,
    container: State<'_, Arc<AppContainer>>,
) -> Result<Vec<citeforge_workspace::AgentConversationDto>, String> {
    let service = crate::application::AgentChatService::new(
        Arc::clone(&container.db),
        Arc::clone(&container.llm),
    );

    service
        .start_discussion(&task_id, &topic, &literature_ids)
        .await
        .map_err(|e| format!("discussion error: {}", e))
}

// ===================== LITERATURE SECTIONS =====================

#[tauri::command]
pub async fn save_literature_sections(
    literature_id: String,
    sections: Vec<citeforge_workspace::LiteratureSectionDto>,
    container: State<'_, Arc<AppContainer>>,
) -> Result<(), String> {
    container
        .db
        .save_literature_sections(&literature_id, &sections)
        .await
        .map_err(|e| format!("failed to save sections: {}", e))
}

#[tauri::command]
pub async fn get_literature_sections(
    literature_id: String,
    container: State<'_, Arc<AppContainer>>,
) -> Result<Vec<citeforge_workspace::LiteratureSectionDto>, String> {
    container
        .db
        .get_literature_sections(&literature_id)
        .await
        .map_err(|e| format!("failed to get sections: {}", e))
}

// ===================== THEMES =====================

#[tauri::command]
pub async fn save_themes(
    task_id: String,
    themes: Vec<citeforge_workspace::LiteratureThemeDto>,
    container: State<'_, Arc<AppContainer>>,
) -> Result<(), String> {
    container
        .db
        .save_themes(&task_id, &themes)
        .await
        .map_err(|e| format!("failed to save themes: {}", e))
}

#[tauri::command]
pub async fn get_themes(
    task_id: Option<String>,
    container: State<'_, Arc<AppContainer>>,
) -> Result<Vec<citeforge_workspace::LiteratureThemeDto>, String> {
    match task_id {
        Some(tid) => container
            .db
            .get_themes(&tid)
            .await
            .map_err(|e| format!("failed to get themes: {}", e)),
        None => Ok(Vec::new()),
    }
}

// ===================== LITERATURE NOTES =====================

#[tauri::command]
pub async fn link_note_to_literature(
    link: citeforge_workspace::LiteratureNoteDto,
    container: State<'_, Arc<AppContainer>>,
) -> Result<(), String> {
    container
        .db
        .link_note_to_literature(&link)
        .await
        .map_err(|e| format!("failed to link note: {}", e))
}

#[tauri::command]
pub async fn get_notes_by_literature(
    literature_id: String,
    container: State<'_, Arc<AppContainer>>,
) -> Result<Vec<citeforge_workspace::LiteratureNoteDto>, String> {
    container
        .db
        .get_notes_by_literature(&literature_id)
        .await
        .map_err(|e| format!("failed to get literature notes: {}", e))
}

#[tauri::command]
pub async fn get_literature_by_note(
    note_id: String,
    container: State<'_, Arc<AppContainer>>,
) -> Result<Vec<citeforge_workspace::LiteratureNoteDto>, String> {
    container
        .db
        .get_literature_by_note(&note_id)
        .await
        .map_err(|e| format!("failed to get literature by note: {}", e))
}

// ===================== BIBTEX IMPORT =====================

#[tauri::command]
pub async fn import_bibtex(
    task_id: String,
    bibtex_content: String,
    container: State<'_, Arc<AppContainer>>,
) -> Result<Vec<citeforge_workspace::LiteratureDto>, String> {
    let entries = parse_bibtex_entries(&bibtex_content);
    let mut imported = Vec::new();

    for entry in entries {
        let lit = citeforge_workspace::LiteratureDto {
            id: format!("lit-{}", uuid::Uuid::new_v4()),
            task_id: task_id.clone(),
            title: entry.title.unwrap_or_else(|| "Unknown".to_string()),
            authors: entry.authors,
            abstract_text: entry.abstract_text,
            doi: entry.doi,
            year: entry.year,
            venue: entry.journal.or(entry.booktitle),
            citation_count: None,
            file_path: None,
            source: "bibtex".to_string(),
            verified: false,
            created_at: chrono::Utc::now().to_rfc3339(),
        };

        container
            .db
            .save_literature(&lit)
            .await
            .map_err(|e| format!("failed to save bibtex entry: {}", e))?;

        imported.push(lit);
    }

    Ok(imported)
}

#[derive(Debug, Default)]
struct BibtexEntry {
    title: Option<String>,
    authors: Vec<String>,
    abstract_text: Option<String>,
    doi: Option<String>,
    year: Option<i32>,
    journal: Option<String>,
    booktitle: Option<String>,
}

fn parse_bibtex_entries(content: &str) -> Vec<BibtexEntry> {
    let mut entries = Vec::new();
    let mut current = BibtexEntry::default();
    let mut in_entry = false;
    let mut key;
    let mut value;
    let mut _brace_depth = 0;

    for line in content.lines() {
        let trimmed = line.trim();

        if trimmed.starts_with('@') && trimmed.contains('{') {
            if in_entry && !current.title.is_none() {
                entries.push(std::mem::take(&mut current));
            }
            in_entry = true;
            continue;
        }

        if !in_entry {
            continue;
        }

        // Parse key = {value} or key = "value"
        if let Some(eq_pos) = trimmed.find('=') {
            key = trimmed[..eq_pos].trim().to_lowercase();
            let rest = trimmed[eq_pos + 1..].trim();

            // Extract value
            if rest.starts_with('{') || rest.starts_with('"') {
                let end_char = if rest.starts_with('{') { '}' } else { '"' };
                if let Some(end_pos) = rest.rfind(end_char) {
                    value = rest[1..end_pos].trim().to_string();
                } else {
                    value = rest.trim_start_matches(|c| c == '{' || c == '"').to_string();
                }
            } else {
                value = rest.trim_end_matches(',').to_string();
            }

            match key.as_str() {
                "title" => current.title = Some(value),
                "author" => {
                    current.authors = value
                        .split(" and ")
                        .map(|s| s.trim().to_string())
                        .collect();
                }
                "abstract" => current.abstract_text = Some(value),
                "doi" => current.doi = Some(value),
                "year" => current.year = value.parse().ok(),
                "journal" => current.journal = Some(value),
                "booktitle" => current.booktitle = Some(value),
                _ => {}
            }
        }

        if trimmed == "}" {
            if in_entry {
                entries.push(std::mem::take(&mut current));
            }
            in_entry = false;
        }
    }

    if in_entry && !current.title.is_none() {
        entries.push(current);
    }

    entries
}
