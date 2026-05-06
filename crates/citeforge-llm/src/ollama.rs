use std::sync::Arc;
use async_trait::async_trait;
use citeforge_core::ports::{ChatProvider, EmbedProvider, ChatMessage, ChatError, EmbedError, ChatProviderFactory, EmbedProviderFactory, ProviderConfig};
use citeforge_core::error::CiteForgeError;
use secrecy::SecretString;

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
    fn name(&self) -> &'static str { "ollama" }

    fn create(&self, config: &ProviderConfig) -> Result<Arc<dyn ChatProvider>, CiteForgeError> {
        Ok(Arc::new(OllamaProvider::new(
            config.base_url.clone().unwrap_or_else(|| "http://localhost:11434".to_string()),
            config.model.clone().unwrap_or_else(|| "llama2".to_string()),
        )))
    }
}

struct OllamaEmbedFactory;

impl EmbedProviderFactory for OllamaEmbedFactory {
    fn name(&self) -> &'static str { "ollama" }

    fn create(&self, config: &ProviderConfig) -> Result<Arc<dyn EmbedProvider>, CiteForgeError> {
        Ok(Arc::new(OllamaProvider::new(
            config.base_url.clone().unwrap_or_else(|| "http://localhost:11434".to_string()),
            config.model.clone().unwrap_or_else(|| "nomic-embed-text".to_string()),
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

        let resp = self.client.post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| ChatError::Network(e.to_string()))?;

        if !resp.status().is_success() {
            return Err(ChatError::Api(format!("API error: {}", resp.status())));
        }

        let result: serde_json::Value = resp.json().await
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

            let resp = self.client.post(&url)
                .json(&body)
                .send()
                .await
                .map_err(|e| EmbedError::Network(e.to_string()))?;

            if !resp.status().is_success() {
                return Err(EmbedError::Api(format!("API error: {}", resp.status())));
            }

            let result: serde_json::Value = resp.json().await
                .map_err(|e| EmbedError::Network(e.to_string()))?;

            let embedding: Vec<f32> = result["embedding"]
                .as_array()
                .unwrap()
                .iter()
                .map(|v| v.as_f64().unwrap_or(0.0) as f32)
                .collect();

            embeddings.push(embedding);
        }

        Ok(embeddings)
    }

    fn supports_batch(&self) -> bool {
        true
    }
}
