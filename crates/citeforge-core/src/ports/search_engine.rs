use async_trait::async_trait;
use crate::entity::LiteratureEntry;

#[async_trait]
pub trait SearchEngine: Send + Sync {
    async fn search(&self, query: &str, max_results: usize) -> Result<Vec<LiteratureEntry>, SearchError>;
}

#[derive(Debug, thiserror::Error)]
pub enum SearchError {
    #[error("network error: {0}")]
    Network(String),
    #[error("api error: {0}")]
    Api(String),
    #[error("rate limited")]
    RateLimited,
}
