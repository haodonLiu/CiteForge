use thiserror::Error;

#[derive(Debug, Error)]
pub enum PluginError {
    #[error("Plugin not found: {0}")]
    NotFound(String),
    #[error("Plugin error: {0}")]
    LoadError(String),
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
}
