use thiserror::Error;

/// Error type for memory operations.
#[derive(Debug, Error)]
pub enum MemoryError {
    #[error("database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("UUID parse error: {0}")]
    UuidParse(#[from] uuid::Error),

    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),

    #[error("memory not found: {0}")]
    NotFound(String),
}
