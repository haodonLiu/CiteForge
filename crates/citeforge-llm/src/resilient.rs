use async_trait::async_trait;
use backoff::{future::retry, ExponentialBackoff};
use citeforge_core::ports::{ChatError, ChatMessage, ChatProvider, EmbedError, EmbedProvider};
use std::sync::Arc;
use std::time::{Duration, Instant};

pub struct ResilientChatProvider {
    inner: Arc<dyn ChatProvider>,
    fallback: Option<Arc<dyn ChatProvider>>,
    circuit: Arc<tokio::sync::RwLock<CircuitState>>,
    #[allow(dead_code)]
    max_retries: u32,
}

pub struct ResilientEmbedProvider {
    inner: Arc<dyn EmbedProvider>,
    fallback: Option<Arc<dyn EmbedProvider>>,
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
            CircuitState::Open(last_failure)
                if last_failure.elapsed() < Duration::from_secs(30) =>
            {
                true
            }
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
        let msgs = messages.clone();
        let result = retry(backoff, || {
            let inner = Arc::clone(&inner);
            let msgs = msgs.clone();
            async move { inner.chat(msgs).await.map_err(backoff::Error::transient) }
        })
        .await;

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

impl ResilientEmbedProvider {
    pub fn new(inner: Arc<dyn EmbedProvider>) -> Self {
        Self {
            inner,
            fallback: None,
        }
    }

    pub fn with_fallback(mut self, fallback: Arc<dyn EmbedProvider>) -> Self {
        self.fallback = Some(fallback);
        self
    }
}

#[async_trait]
impl EmbedProvider for ResilientEmbedProvider {
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
