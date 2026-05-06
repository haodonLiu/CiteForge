use thiserror::Error;
use citeforge_core::error::CiteForgeError;

#[derive(Debug, Error)]
pub enum WorkspaceError {
    #[error("database error: {0}")]
    Database(#[from] rusqlite::Error),
    #[error("task not found: {0}")]
    TaskNotFound(String),
    #[error("migration error: {0}")]
    Migration(String),
}

impl From<WorkspaceError> for CiteForgeError {
    fn from(e: WorkspaceError) -> Self {
        CiteForgeError::Infrastructure(e.to_string())
    }
}
