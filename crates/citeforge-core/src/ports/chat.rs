use async_trait::async_trait;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, thiserror::Error)]
pub enum ChatError {
    #[error("network error: {0}")]
    Network(String),
    #[error("api error: {0}")]
    Api(String),
    #[error("circuit open")]
    CircuitOpen,
    #[error("timeout")]
    Timeout,
}

#[async_trait]
pub trait ChatProvider: Send + Sync {
    async fn chat(&self, messages: Vec<ChatMessage>) -> Result<String, ChatError>;
    fn provider_name(&self) -> &str;
}
