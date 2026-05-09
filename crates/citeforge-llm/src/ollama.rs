use async_trait::async_trait;
use citeforge_core::error::CiteForgeError;
use citeforge_core::ports::{
    ChatError, ChatMessage, ChatProvider, ChatProviderFactory, EmbedError, EmbedProvider,
    EmbedProviderFactory, ProviderConfig,
};
use std::sync::Arc;
pub struct OllamaProvider {
    base_url: String,
    model: String,
    client: reqwest::Client,
}

impl OllamaProvider {
    pub fn new(base_url: String, model: String) -> Self {
        Self {
            base_url,
            model,
            client: reqwest::Client::new(),
        }
    }

    pub fn factory() -> Box<dyn ChatProviderFactory> {
        Box::new(OllamaFactory)
    }

    pub fn embed_factory() -> Box<dyn EmbedProviderFactory> {
        Box::new(OllamaEmbedFactory)
    }
}

struct OllamaFactory;

impl ChatProviderFactory for OllamaFactory {
    fn name(&self) -> &'static str {
        "ollama"
    }

    fn create(&self, config: &ProviderConfig) -> Result<Arc<dyn ChatProvider>, CiteForgeError> {
        Ok(Arc::new(OllamaProvider::new(
            config
                .base_url
                .clone()
                .unwrap_or_else(|| "http://localhost:11434".to_string()),
            config.model.clone().unwrap_or_else(|| "llama2".to_string()),
        )))
    }
}

struct OllamaEmbedFactory;

impl EmbedProviderFactory for OllamaEmbedFactory {
    fn name(&self) -> &'static str {
        "ollama"
    }

    fn create(&self, config: &ProviderConfig) -> Result<Arc<dyn EmbedProvider>, CiteForgeError> {
        Ok(Arc::new(OllamaProvider::new(
            config
                .base_url
                .clone()
                .unwrap_or_else(|| "http://localhost:11434".to_string()),
            config
                .model
                .clone()
                .unwrap_or_else(|| "nomic-embed-text".to_string()),
        )))
    }
}

#[async_trait]
impl ChatProvider for OllamaProvider {
    async fn chat(&self, messages: Vec<ChatMessage>) -> Result<String, ChatError> {
        let url = format!("{}/api/chat", self.base_url);

        let body = serde_json::json!({
            "model": self.model,
            "messages": messages.iter().map(|m| {
                serde_json::json!({
                    "role": m.role,
                    "content": m.content
                })
            }).collect::<Vec<_>>()
        });

        let resp = self
            .client
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| ChatError::Network(e.to_string()))?;

        if !resp.status().is_success() {
            return Err(ChatError::Api(format!("API error: {}", resp.status())));
        }

        let result: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| ChatError::Network(e.to_string()))?;

        let content = result["message"]["content"]
            .as_str()
            .unwrap_or("")
            .to_string();

        Ok(content)
    }

    fn provider_name(&self) -> &str {
        "ollama"
    }
}

#[async_trait]
impl EmbedProvider for OllamaProvider {
    async fn embed(&self, texts: Vec<String>) -> Result<Vec<Vec<f32>>, EmbedError> {
        let url = format!("{}/api/embeddings", self.base_url);

        let mut embeddings = Vec::new();
        for text in texts {
            let body = serde_json::json!({
                "model": self.model,
                "prompt": text
            });

            let resp = self
                .client
                .post(&url)
                .json(&body)
                .send()
                .await
                .map_err(|e| EmbedError::Network(e.to_string()))?;

            if !resp.status().is_success() {
                return Err(EmbedError::Api(format!("API error: {}", resp.status())));
            }

            let result: serde_json::Value = resp
                .json()
                .await
                .map_err(|e| EmbedError::Network(e.to_string()))?;

            let embedding = parse_single_embedding(&result)?;
            embeddings.push(embedding);
        }

        Ok(embeddings)
    }

    fn supports_batch(&self) -> bool {
        false
    }
}

fn parse_single_embedding(result: &serde_json::Value) -> Result<Vec<f32>, EmbedError> {
    result["embedding"]
        .as_array()
        .ok_or_else(|| EmbedError::Api("missing 'embedding' in response".to_string()))
        .map(|arr| {
            arr.iter()
                .map(|v| v.as_f64().unwrap_or(0.0) as f32)
                .collect()
        })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_valid_embedding() {
        let json = serde_json::json!({"embedding": [0.1, 0.2, 0.3]});
        let result = parse_single_embedding(&json).unwrap();
        assert_eq!(result, vec![0.1f32, 0.2, 0.3]);
    }

    #[test]
    fn test_parse_missing_embedding() {
        let json = serde_json::json!({});
        assert!(parse_single_embedding(&json).is_err());
    }
}
