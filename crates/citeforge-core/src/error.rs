use thiserror::Error;

#[derive(Debug, Error)]
pub enum CiteForgeError {
    #[error("domain error: {0}")]
    Domain(String),

    #[error("infrastructure error: {0}")]
    Infrastructure(String),

    #[error("application error: {0}")]
    Application(String),
}

impl From<std::io::Error> for CiteForgeError {
    fn from(e: std::io::Error) -> Self {
        CiteForgeError::Infrastructure(e.to_string())
    }
}

impl From<serde_json::Error> for CiteForgeError {
    fn from(e: serde_json::Error) -> Self {
        CiteForgeError::Infrastructure(e.to_string())
    }
}
