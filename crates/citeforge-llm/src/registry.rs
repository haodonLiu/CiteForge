use crate::anthropic::AnthropicProvider;
use crate::modelscope::ModelScopeProvider;
use crate::ollama::OllamaProvider;
use crate::openai::OpenAIProvider;
use anyhow::Result;
use citeforge_core::error::CiteForgeError;
use citeforge_core::ports::{
    ChatProvider, ChatProviderFactory, EmbedProvider, EmbedProviderFactory, ProviderConfig,
};
use std::sync::Arc;

pub struct LlmRegistry {
    chat_factories: std::collections::HashMap<String, Box<dyn ChatProviderFactory>>,
    embed_factories: std::collections::HashMap<String, Box<dyn EmbedProviderFactory>>,
}

impl Default for LlmRegistry {
    fn default() -> Self {
        Self::new()
    }
}

impl LlmRegistry {
    pub fn new() -> Self {
        let mut reg = Self {
            chat_factories: std::collections::HashMap::new(),
            embed_factories: std::collections::HashMap::new(),
        };

        reg.register_chat("openai", OpenAIProvider::factory());
        reg.register_chat("anthropic", AnthropicProvider::factory());
        reg.register_chat("ollama", OllamaProvider::factory());

        reg.register_embed("openai", OpenAIProvider::embed_factory());
        reg.register_embed("ollama", OllamaProvider::embed_factory());
        reg.register_embed("modelscope", ModelScopeProvider::factory());

        reg
    }

    fn register_chat(&mut self, name: &'static str, factory: Box<dyn ChatProviderFactory>) {
        self.chat_factories.insert(name.to_string(), factory);
    }

    fn register_embed(&mut self, name: &'static str, factory: Box<dyn EmbedProviderFactory>) {
        self.embed_factories.insert(name.to_string(), factory);
    }

    pub fn create_chat(
        &self,
        config: &ProviderConfig,
    ) -> Result<Arc<dyn ChatProvider>, CiteForgeError> {
        let factory = self
            .chat_factories
            .get(&config.provider_type)
            .ok_or_else(|| {
                CiteForgeError::Application(format!(
                    "unknown chat provider: {}",
                    config.provider_type
                ))
            })?;

        factory.create(config)
    }

    pub fn create_embed(
        &self,
        config: &ProviderConfig,
    ) -> Result<Arc<dyn EmbedProvider>, CiteForgeError> {
        let factory = self
            .embed_factories
            .get(&config.provider_type)
            .ok_or_else(|| {
                CiteForgeError::Application(format!(
                    "unknown embed provider: {}",
                    config.provider_type
                ))
            })?;

        factory.create(config)
    }
}
