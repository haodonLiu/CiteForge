use std::sync::Arc;
use anyhow::Result;
use super::{ChatProvider, EmbedProvider, VectorStore};
use crate::error::CiteForgeError;

pub trait ChatProviderFactory: Send + Sync {
    fn name(&self) -> &'static str;
    fn create(&self, config: &ProviderConfig) -> Result<Arc<dyn ChatProvider>, CiteForgeError>;
}

pub trait EmbedProviderFactory: Send + Sync {
    fn name(&self) -> &'static str;
    fn create(&self, config: &ProviderConfig) -> Result<Arc<dyn EmbedProvider>, CiteForgeError>;
}

pub trait VectorStoreFactory: Send + Sync {
    fn name(&self) -> &'static str;
    fn create(&self, config: &StoreConfig) -> Result<Arc<dyn VectorStore<Error = Box<dyn std::error::Error + Send + Sync>>>, CiteForgeError>;
}

#[derive(Debug, Clone)]
pub struct ProviderConfig {
    pub provider_type: String,
    pub base_url: Option<String>,
    pub api_key: Option<String>,
    pub model: Option<String>,
    pub timeout_secs: Option<u64>,
}

#[derive(Debug, Clone)]
pub struct StoreConfig {
    pub store_type: String,
    pub connection_string: String,
}
