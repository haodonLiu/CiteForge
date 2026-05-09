use async_trait::async_trait;
use citeforge_core::error::CiteForgeError;
use citeforge_core::ports::{
    ChatError, ChatMessage, ChatProvider, ChatProviderFactory, EmbedError, EmbedProvider,
    ProviderConfig,
};
use secrecy::{ExposeSecret, SecretString};
use std::sync::Arc;

pub struct AnthropicProvider {
    api_key: SecretString,
    base_url: String,
    model: String,
    client: reqwest::Client,
}

impl AnthropicProvider {
    pub fn new(api_key: SecretString, base_url: String, model: String) -> Self {
        Self {
            api_key,
            base_url,
            model,
            client: reqwest::Client::new(),
        }
    }

    pub fn factory() -> Box<dyn ChatProviderFactory> {
        Box::new(AnthropicFactory)
    }
}

struct AnthropicFactory;

impl ChatProviderFactory for AnthropicFactory {
    fn name(&self) -> &'static str {
        "anthropic"
    }

    fn create(&self, config: &ProviderConfig) -> Result<Arc<dyn ChatProvider>, CiteForgeError> {
        Ok(Arc::new(AnthropicProvider::new(
            secrecy::SecretString::from(config.api_key.clone().unwrap_or_default()),
            config
                .base_url
                .clone()
                .unwrap_or_else(|| "https://api.anthropic.com".to_string()),
            config
                .model
                .clone()
                .unwrap_or_else(|| "claude-3-sonnet".to_string()),
        )))
    }
}

#[async_trait]
impl ChatProvider for AnthropicProvider {
    async fn chat(&self, messages: Vec<ChatMessage>) -> Result<String, ChatError> {
        let url = format!("{}/v1/messages", self.base_url);

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
            .header("x-api-key", self.api_key.expose_secret())
            .header("anthropic-version", "2023-06-01")
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

        let content = result["content"][0]["text"]
            .as_str()
            .unwrap_or("")
            .to_string();

        Ok(content)
    }

    fn provider_name(&self) -> &str {
        "anthropic"
    }
}

#[async_trait]
impl EmbedProvider for AnthropicProvider {
    async fn embed(&self, _texts: Vec<String>) -> Result<Vec<Vec<f32>>, EmbedError> {
        Err(EmbedError::Api(
            "Anthropic does not support embeddings".to_string(),
        ))
    }

    fn supports_batch(&self) -> bool {
        false
    }
}
