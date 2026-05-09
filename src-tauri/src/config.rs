use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use anyhow::Context;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AppConfig {
    pub workspace: WorkspaceConfig,
    pub llm: LlmConfig,
    #[serde(default)]
    pub chroma: ChromaConfig,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct WorkspaceConfig {
    pub root: PathBuf,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct LlmConfig {
    pub provider: LlmProvider,
    pub base_url: String,
    pub api_key: Option<String>,
    pub model: String,
    pub timeout_secs: Option<u64>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ChromaConfig {
    pub url: String,
    pub collection: String,
    pub embedding_dimension: usize,
}

impl Default for ChromaConfig {
    fn default() -> Self {
        Self {
            url: "http://localhost:8000".to_string(),
            collection: "citeforge".to_string(),
            embedding_dimension: 1536,
        }
    }
}

#[derive(Debug, Clone, Copy, Deserialize, Serialize)]
pub enum LlmProvider {
    OpenAI,
    Anthropic,
    Ollama,
}

impl Default for AppConfig {
    fn default() -> Self {
        let data_dir = dirs::data_local_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("CiteForge");
        std::fs::create_dir_all(&data_dir).ok();

        Self {
            workspace: WorkspaceConfig {
                root: data_dir,
            },
            llm: LlmConfig {
                provider: LlmProvider::Ollama,
                base_url: "http://localhost:11434".to_string(),
                api_key: None,
                model: "llama3".to_string(),
                timeout_secs: Some(60),
            },
            chroma: ChromaConfig::default(),
        }
    }
}

impl AppConfig {
    pub fn from_file(path: &str) -> anyhow::Result<Self> {
        let contents = std::fs::read_to_string(path)
            .context(format!("failed to read config file: {}", path))?;
        let config: AppConfig = serde_yaml::from_str(&contents)
            .context("failed to parse config file")?;
        Ok(config)
    }
}
