use citeforge_core::error::CiteForgeError;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum WorkspaceError {
    #[error("database error: {0}")]
    Database(#[from] rusqlite::Error),
    #[error("task not found: {0}")]
    TaskNotFound(String),
    #[error("migration error: {0}")]
    Migration(String),
    #[error("serialization error: {0}")]
    Serde(String),
    #[error("date parse error: {0}")]
    Chrono(String),
}

impl From<WorkspaceError> for CiteForgeError {
    fn from(e: WorkspaceError) -> Self {
        CiteForgeError::Infrastructure(e.to_string())
    }
}

impl WorkspaceError {
    pub fn serde<E: std::fmt::Display>(e: E) -> Self {
        Self::Serde(e.to_string())
    }
    pub fn chrono<E: std::fmt::Display>(e: E) -> Self {
        Self::Chrono(e.to_string())
    }
    pub fn io<E: std::fmt::Display>(e: E) -> Self {
        Self::Serde(format!("io error: {}", e))
    }
}
