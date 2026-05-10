use async_trait::async_trait;
use citeforge_core::error::CiteForgeError;
use citeforge_core::ports::{
    EmbedError, EmbedProvider, EmbedProviderFactory, ProviderConfig,
};
use reqwest::Client;
use std::sync::Arc;

pub struct ModelScopeProvider {
    base_url: String,
    client: Client,
}

impl ModelScopeProvider {
    pub fn new(base_url: String) -> Self {
        Self {
            base_url,
            client: Client::new(),
        }
    }

    pub fn factory() -> Box<dyn EmbedProviderFactory> {
        Box::new(ModelScopeEmbedFactory)
    }
}

struct ModelScopeEmbedFactory;

impl EmbedProviderFactory for ModelScopeEmbedFactory {
    fn name(&self) -> &'static str {
        "modelscope"
    }

    fn create(&self, config: &ProviderConfig) -> Result<Arc<dyn EmbedProvider>, CiteForgeError> {
        let base_url = config
            .base_url
            .clone()
            .unwrap_or_else(|| "http://localhost:8080".to_string());

        Ok(Arc::new(ModelScopeProvider::new(base_url)))
    }
}

#[async_trait]
impl EmbedProvider for ModelScopeProvider {
    async fn embed(&self, texts: Vec<String>) -> Result<Vec<Vec<f32>>, EmbedError> {
        let url = format!("{}/embed", self.base_url);

        let body = serde_json::json!({ "texts": texts });

        let resp = self
            .client
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| EmbedError::Network(e.to_string()))?;

        if !resp.status().is_success() {
            return Err(EmbedError::Api(format!(
                "API error: {} - {}",
                resp.status(),
                resp.text().await.unwrap_or_default()
            )));
        }

        let result: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| EmbedError::Network(e.to_string()))?;

        let embeddings = result["embeddings"]
            .as_array()
            .ok_or_else(|| EmbedError::Api("missing 'embeddings' in response".to_string()))?
            .iter()
            .map(|arr| {
                arr.as_array()
                    .map_or(&[] as &[serde_json::Value], |v| v.as_slice())
                    .iter()
                    .map(|v| v.as_f64().unwrap_or(0.0) as f32)
                    .collect()
            })
            .collect();

        Ok(embeddings)
    }

    fn supports_batch(&self) -> bool {
        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_provider_creation() {
        let provider = ModelScopeProvider::new("http://localhost:8080".to_string());
        assert_eq!(provider.base_url, "http://localhost:8080");
    }
}
