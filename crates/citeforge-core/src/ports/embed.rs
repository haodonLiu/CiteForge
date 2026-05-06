use async_trait::async_trait;

#[derive(Debug, thiserror::Error)]
pub enum EmbedError {
    #[error("network error: {0}")]
    Network(String),
    #[error("api error: {0}")]
    Api(String),
}

#[async_trait]
pub trait EmbedProvider: Send + Sync {
    async fn embed(&self, texts: Vec<String>) -> Result<Vec<Vec<f32>>, EmbedError>;
    fn supports_batch(&self) -> bool;
}
