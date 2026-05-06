use async_trait::async_trait;
use citeforge_core::error::CiteForgeError;
use citeforge_core::ports::{VectorStore, SearchResult};
use citeforge_core::value_object::DocumentMetadata;
use serde_json::json;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ChromaError {
    #[error("connection error: {0}")]
    Connection(String),
    #[error("query error: {0}")]
    Query(String),
    #[error("parse error: {0}")]
    Parse(String),
}

impl From<ChromaError> for CiteForgeError {
    fn from(e: ChromaError) -> Self {
        CiteForgeError::Infrastructure(e.to_string())
    }
}

pub struct ChromaStore {
    base_url: String,
    collection_name: String,
    client: reqwest::Client,
    embedding_dimension: usize,
}

impl ChromaStore {
    pub fn new(base_url: String, collection_name: String, embedding_dimension: usize) -> Self {
        Self {
            base_url,
            collection_name,
            client: reqwest::Client::new(),
            embedding_dimension,
        }
    }

    pub async fn ensure_collection(&self) -> Result<(), ChromaError> {
        let url = format!("{}/collections", self.base_url);

        let body = json!({
            "name": self.collection_name,
            "metadata": { "hnsw:space": "cosine" },
            "get_or_create": true
        });

        let resp = self.client
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| ChromaError::Connection(e.to_string()))?;

        if !resp.status().is_success() {
            return Err(ChromaError::Connection(format!("collection creation failed: {}", resp.status())));
        }

        Ok(())
    }

    pub async fn add_batch(&self, items: Vec<(String, Vec<f32>, DocumentMetadata)>)
        -> Result<(), ChromaError>
    {
        for chunk in items.chunks(100) {
            self.add_chunk(chunk).await?;
        }
        Ok(())
    }

    async fn add_chunk(&self, items: &[(String, Vec<f32>, DocumentMetadata)]) -> Result<(), ChromaError> {
        let url = format!("{}/collections/{}/add", self.base_url, self.collection_name);

        let ids: Vec<String> = items.iter().map(|(id, _, _)| id.clone()).collect();
        let embeddings: Vec<Vec<f32>> = items.iter().map(|(_, e, _)| e.clone()).collect();
        let metadatas: Vec<serde_json::Value> = items.iter().map(|(_, _, m)| {
            json!({
                "title": m.title.clone().unwrap_or_default(),
                "authors": m.authors.join("; "),
                "year": m.year.unwrap_or(0),
                "doi": m.doi.clone().unwrap_or_default(),
            })
        }).collect();

        let body = json!({
            "ids": ids,
            "embeddings": embeddings,
            "metadatas": metadatas
        });

        let resp = self.client
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| ChromaError::Connection(e.to_string()))?;

        if !resp.status().is_success() {
            return Err(ChromaError::Query(format!("add failed: {}", resp.status())));
        }

        Ok(())
    }
}

#[async_trait]
impl VectorStore for ChromaStore {
    type Error = ChromaError;

    async fn add(&self, id: &str, embedding: Vec<f32>, metadata: DocumentMetadata) -> Result<(), Self::Error> {
        self.ensure_collection().await?;
        self.add_batch(vec![(id.to_string(), embedding, metadata)]).await
    }

    async fn search(&self, query: Vec<f32>, top_k: usize) -> Result<Vec<SearchResult>, Self::Error> {
        let url = format!("{}/collections/{}/query", self.base_url, self.collection_name);

        let body = json!({
            "query_embeddings": [query],
            "n_results": top_k,
            "include": ["metadatas", "distances"]
        });

        let resp = self.client
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| ChromaError::Connection(e.to_string()))?;

        let result: serde_json::Value = resp.json()
            .await
            .map_err(|e| ChromaError::Parse(e.to_string()))?;

        let ids = result["ids"][0].as_array().ok_or_else(|| ChromaError::Parse("no ids".to_string()))?;
        let distances = result["distances"][0].as_array().ok_or_else(|| ChromaError::Parse("no distances".to_string()))?;
        let metadatas = result["metadatas"][0].as_array().ok_or_else(|| ChromaError::Parse("no metadatas".to_string()))?;

        let results: Vec<SearchResult> = ids.iter()
            .zip(distances.iter())
            .zip(metadatas.iter())
            .map(|((id, dist), meta)| {
                SearchResult {
                    id: id.as_str().unwrap_or("").to_string(),
                    score: 1.0 - dist.as_f64().unwrap_or(1.0) as f32,
                    metadata: DocumentMetadata {
                        title: meta.get("title").and_then(|v| v.as_str()).map(|s| s.to_string()),
                        authors: meta.get("authors")
                            .and_then(|v| v.as_str())
                            .map(|s| s.split("; ").map(|p| p.to_string()).collect())
                            .unwrap_or_default(),
                        doi: meta.get("doi").and_then(|v| v.as_str()).map(|s| s.to_string()),
                        year: meta.get("year").and_then(|v| v.as_i64()).map(|y| y as i32),
                        venue: None,
                    },
                }
            })
            .collect();

        Ok(results)
    }

    async fn delete(&self, id: &str) -> Result<(), Self::Error> {
        let url = format!("{}/collections/{}/delete", self.base_url, self.collection_name);
        let body = json!({ "ids": [id] });

        self.client.post(&url).json(&body).send().await
            .map_err(|e| ChromaError::Connection(e.to_string()))?;

        Ok(())
    }

    async fn clear(&self) -> Result<(), Self::Error> {
        let url = format!("{}/collections/{}", self.base_url, self.collection_name);
        self.client.delete(&url).send().await
            .map_err(|e| ChromaError::Connection(e.to_string()))?;
        Ok(())
    }
}
