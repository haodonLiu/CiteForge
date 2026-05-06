use std::sync::Arc;
use std::time::{Duration, Instant};
use async_trait::async_trait;
use backoff::{ExponentialBackoff, future::retry};
use citeforge_core::ports::{ChatProvider, EmbedProvider, ChatMessage, ChatError, EmbedError};

pub struct ResilientChatProvider {
    inner: Arc<dyn ChatProvider>,
    fallback: Option<Arc<dyn ChatProvider>>,
    circuit: Arc<tokio::sync::RwLock<CircuitState>>,
    max_retries: u32,
}

#[derive(Debug, Clone, PartialEq)]
enum CircuitState {
    Closed,
    Open(Instant),
    HalfOpen,
}

impl ResilientChatProvider {
    pub fn new(inner: Arc<dyn ChatProvider>) -> Self {
        Self {
            inner,
            fallback: None,
            circuit: Arc::new(tokio::sync::RwLock::new(CircuitState::Closed)),
            max_retries: 3,
        }
    }

    pub fn with_fallback(mut self, fallback: Arc<dyn ChatProvider>) -> Self {
        self.fallback = Some(fallback);
        self
    }

    async fn is_open(&self) -> bool {
        let state = self.circuit.read().await;
        match &*state {
            CircuitState::Open(last_failure) if last_failure.elapsed() < Duration::from_secs(30) => true,
            CircuitState::Open(_) => {
                drop(state);
                *self.circuit.write().await = CircuitState::HalfOpen;
                false
            }
            _ => false,
        }
    }

    async fn record_success(&self) {
        *self.circuit.write().await = CircuitState::Closed;
    }

    async fn record_failure(&self) {
        *self.circuit.write().await = CircuitState::Open(Instant::now());
    }
}

#[async_trait]
impl ChatProvider for ResilientChatProvider {
    async fn chat(&self, messages: Vec<ChatMessage>) -> Result<String, ChatError> {
        if self.is_open().await {
            if let Some(fallback) = &self.fallback {
                tracing::warn!("circuit open, using fallback provider");
                return fallback.chat(messages).await;
            }
            return Err(ChatError::CircuitOpen);
        }

        let backoff = ExponentialBackoff {
            max_elapsed_time: Some(Duration::from_secs(60)),
            ..Default::default()
        };

        let inner = Arc::clone(&self.inner);
        let result = retry(backoff, || {
            let inner = Arc::clone(&inner);
            async move {
                inner.chat(messages.clone()).await.map_err(|e| {
                    backoff::Error::transient(e)
                })
            }
        }).await;

        match result {
            Ok(response) => {
                self.record_success().await;
                Ok(response)
            }
            Err(e) => {
                self.record_failure().await;
                if let Some(fallback) = &self.fallback {
                    tracing::warn!("primary provider failed, trying fallback");
                    fallback.chat(messages).await
                } else {
                    Err(e)
                }
            }
        }
    }

    fn provider_name(&self) -> &str {
        self.inner.provider_name()
    }
}

#[async_trait]
impl EmbedProvider for ResilientChatProvider {
    async fn embed(&self, texts: Vec<String>) -> Result<Vec<Vec<f32>>, EmbedError> {
        if let Some(fallback) = &self.fallback {
            return fallback.embed(texts).await;
        }
        self.inner.embed(texts).await
    }

    fn supports_batch(&self) -> bool {
        self.inner.supports_batch()
    }
}
