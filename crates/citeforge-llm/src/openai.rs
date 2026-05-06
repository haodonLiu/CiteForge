use std::sync::Arc;
use async_trait::async_trait;
use citeforge_core::ports::{ChatProvider, EmbedProvider, ChatMessage, ChatError, EmbedError, ChatProviderFactory, EmbedProviderFactory, ProviderConfig};
use citeforge_core::error::CiteForgeError;
use secrecy::{SecretString, ExposeSecret};

pub struct OpenAIProvider {
    api_key: SecretString,
    base_url: String,
    model: String,
    client: reqwest::Client,
}

impl OpenAIProvider {
    pub fn new(api_key: SecretString, base_url: String, model: String) -> Self {
        Self {
            api_key,
            base_url,
            model,
            client: reqwest::Client::new(),
        }
    }

    pub fn factory() -> Box<dyn ChatProviderFactory> {
        Box::new(OpenAIFactory)
    }

    pub fn embed_factory() -> Box<dyn EmbedProviderFactory> {
        Box::new(OpenAIEmbedFactory)
    }
}

struct OpenAIFactory;

impl ChatProviderFactory for OpenAIFactory {
    fn name(&self) -> &'static str { "openai" }

    fn create(&self, config: &ProviderConfig) -> Result<Arc<dyn ChatProvider>, CiteForgeError> {
        Ok(Arc::new(OpenAIProvider::new(
            secrecy::SecretString::from(config.api_key.clone().unwrap_or_default()),
            config.base_url.clone().unwrap_or_else(|| "https://api.openai.com".to_string()),
            config.model.clone().unwrap_or_else(|| "gpt-4".to_string()),
        )))
    }
}

struct OpenAIEmbedFactory;

impl EmbedProviderFactory for OpenAIEmbedFactory {
    fn name(&self) -> &'static str { "openai" }

    fn create(&self, config: &ProviderConfig) -> Result<Arc<dyn EmbedProvider>, CiteForgeError> {
        Ok(Arc::new(OpenAIProvider::new(
            secrecy::SecretString::from(config.api_key.clone().unwrap_or_default()),
            config.base_url.clone().unwrap_or_else(|| "https://api.openai.com".to_string()),
            config.model.clone().unwrap_or_else(|| "text-embedding-ada-002".to_string()),
        )))
    }
}

#[async_trait]
impl ChatProvider for OpenAIProvider {
    async fn chat(&self, messages: Vec<ChatMessage>) -> Result<String, ChatError> {
        let url = format!("{}/v1/chat/completions", self.base_url);

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
            .header("Authorization", format!("Bearer {}", self.api_key.expose_secret()))
            .json(&body)
            .send()
            .await
            .map_err(|e| ChatError::Network(e.to_string()))?;

        if !resp.status().is_success() {
            return Err(ChatError::Api(format!("API error: {}", resp.status())));
        }

        let result: serde_json::Value = resp.json().await
            .map_err(|e| ChatError::Network(e.to_string()))?;

        let content = result["choices"][0]["message"]["content"]
            .as_str()
            .unwrap_or("")
            .to_string();

        Ok(content)
    }

    fn provider_name(&self) -> &str {
        "openai"
    }
}

#[async_trait]
impl EmbedProvider for OpenAIProvider {
    async fn embed(&self, texts: Vec<String>) -> Result<Vec<Vec<f32>>, EmbedError> {
        let url = format!("{}/v1/embeddings", self.base_url);

        let body = serde_json::json!({
            "model": self.model,
            "input": texts
        });

        let resp = self.client.post(&url)
            .header("Authorization", format!("Bearer {}", self.api_key.expose_secret()))
            .json(&body)
            .send()
            .await
            .map_err(|e| EmbedError::Network(e.to_string()))?;

        if !resp.status().is_success() {
            return Err(EmbedError::Api(format!("API error: {}", resp.status())));
        }

        let result: serde_json::Value = resp.json().await
            .map_err(|e| EmbedError::Network(e.to_string()))?;

        parse_embeddings(&result)
    }

    fn supports_batch(&self) -> bool {
        true
    }
}

fn parse_embeddings(result: &serde_json::Value) -> Result<Vec<Vec<f32>>, EmbedError> {
    let data = result["data"]
        .as_array()
        .ok_or_else(|| EmbedError::Api("missing 'data' array in response".to_string()))?;

    let embeddings: Vec<Vec<f32>> = data
        .iter()
        .map(|item| {
            item["embedding"]
                .as_array()
                .ok_or_else(|| EmbedError::Api("missing 'embedding' in data item".to_string()))
                .map(|arr| arr.iter().map(|v| v.as_f64().unwrap_or(0.0) as f32).collect())
        })
        .collect::<Result<Vec<_>, _>>()?;

    Ok(embeddings)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_valid_embeddings() {
        let json = serde_json::json!({
            "data": [
                {"embedding": [0.1, 0.2, 0.3]},
                {"embedding": [0.4, 0.5, 0.6]}
            ]
        });
        let result = parse_embeddings(&json).unwrap();
        assert_eq!(result.len(), 2);
        assert_eq!(result[0], vec![0.1f32, 0.2, 0.3]);
    }

    #[test]
    fn test_parse_missing_data_array() {
        let json = serde_json::json!({});
        assert!(parse_embeddings(&json).is_err());
    }

    #[test]
    fn test_parse_missing_embedding_field() {
        let json = serde_json::json!({
            "data": [{"other": "field"}]
        });
        assert!(parse_embeddings(&json).is_err());
    }
}
