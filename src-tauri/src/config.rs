use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use anyhow::Context;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AppConfig {
    pub workspace: WorkspaceConfig,
    pub llm: LlmConfig,
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

#[derive(Debug, Clone, Copy, Deserialize, Serialize)]
pub enum LlmProvider {
    OpenAI,
    Anthropic,
    Ollama,
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
