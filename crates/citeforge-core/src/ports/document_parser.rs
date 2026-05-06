use async_trait::async_trait;
use crate::value_object::DocumentMetadata;

#[derive(Debug, thiserror::Error)]
pub enum ParserError {
    #[error("parse error: {0}")]
    ParseError(String),
    #[error("unsupported format")]
    UnsupportedFormat,
}

#[derive(Debug, Clone)]
pub struct Page {
    pub number: usize,
    pub text: String,
}

#[derive(Debug, Clone)]
pub struct ParsedDocument {
    pub pages: Vec<Page>,
    pub metadata: DocumentMetadata,
}

#[async_trait]
pub trait DocumentParser: Send + Sync {
    async fn parse(&self, bytes: &[u8]) -> Result<ParsedDocument, ParserError>;
}
