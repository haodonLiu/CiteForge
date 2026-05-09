use crate::value_object::DocumentMetadata;
use async_trait::async_trait;

#[derive(Debug, Clone)]
pub struct SearchResult {
    pub id: String,
    pub score: f32,
    pub metadata: DocumentMetadata,
}

#[async_trait]
pub trait VectorStore: Send + Sync {
    type Error: std::error::Error + Send + Sync + 'static;

    async fn add(
        &self,
        id: &str,
        embedding: Vec<f32>,
        metadata: DocumentMetadata,
    ) -> Result<(), Self::Error>;
    async fn search(&self, query: Vec<f32>, top_k: usize)
        -> Result<Vec<SearchResult>, Self::Error>;
    async fn delete(&self, id: &str) -> Result<(), Self::Error>;
    async fn clear(&self) -> Result<(), Self::Error>;
}
