use std::sync::Arc;
use anyhow::Context;
use async_trait::async_trait;
use crate::config::AppConfig;
use crate::workspace::{Database, TimeTracker};
use citeforge_core::ports::{ChatProvider, EmbedProvider, VectorStore, DocumentParser, SearchEngine, ChatMessage, ChatError, EmbedError, SearchError};
use citeforge_core::ports::vector_store::SearchResult;
use citeforge_core::entity::LiteratureEntry;
use citeforge_core::value_object::DocumentMetadata;
use citeforge_chroma::ChromaError;
use citeforge_llm::registry::LlmRegistry;
use citeforge_chroma::ChromaStore;
use citeforge_pdf::PdfParser;
use crate::application::outbox::EventOutbox;

pub struct AppContainer {
    pub config: AppConfig,
    pub db: Arc<Database>,
    pub time_tracker: Arc<TimeTracker>,
    pub llm: Arc<dyn ChatProvider>,
    pub embedder: Arc<dyn EmbedProvider>,
    pub search: Arc<dyn SearchEngine>,
    pub vector_store: Arc<dyn VectorStore<Error = ChromaError>>,
    pub pdf_parser: Arc<dyn DocumentParser>,
    pub outbox: Arc<EventOutbox>,
    pub llm_registry: LlmRegistry,
}

/// Stub implementations for when services are unavailable
struct StubChatProvider;

#[async_trait]
impl ChatProvider for StubChatProvider {
    async fn chat(&self, _messages: Vec<ChatMessage>) -> Result<String, ChatError> {
        Ok("LLM service not configured".to_string())
    }
    fn provider_name(&self) -> &str { "stub" }
}

struct StubEmbedProvider;

#[async_trait]
impl EmbedProvider for StubEmbedProvider {
    async fn embed(&self, _texts: Vec<String>) -> Result<Vec<Vec<f32>>, EmbedError> {
        Ok(vec![])
    }
    fn supports_batch(&self) -> bool { false }
}

struct StubSearchEngine;

#[async_trait]
impl SearchEngine for StubSearchEngine {
    async fn search(&self, _query: &str, _limit: usize) -> Result<Vec<LiteratureEntry>, SearchError> {
        Ok(vec![])
    }
}

struct StubVectorStore;

#[async_trait]
impl VectorStore for StubVectorStore {
    type Error = ChromaError;
    async fn add(&self, _id: &str, _embedding: Vec<f32>, _metadata: DocumentMetadata) -> Result<(), Self::Error> { Ok(()) }
    async fn search(&self, _query: Vec<f32>, _top_k: usize) -> Result<Vec<SearchResult>, Self::Error> { Ok(vec![]) }
    async fn delete(&self, _id: &str) -> Result<(), Self::Error> { Ok(()) }
    async fn clear(&self) -> Result<(), Self::Error> { Ok(()) }
}

impl AppContainer {
    pub async fn new(config: AppConfig) -> anyhow::Result<Self> {
        tracing::info!("Database root: {:?}", config.workspace.root);
        let db = match Database::new(&config.workspace.root).await {
            Ok(d) => {
                tracing::info!("Database initialized successfully");
                Arc::new(d)
            }
            Err(e) => {
                tracing::error!("Database init error: {:?}", e);
                return Err(e.into());
            }
        };

        let time_tracker = match TimeTracker::new(&config.workspace.root).await {
            Ok(t) => {
                tracing::info!("TimeTracker initialized successfully");
                Arc::new(t)
            }
            Err(e) => {
                tracing::error!("TimeTracker init error: {:?}", e);
                return Err(e.into());
            }
        };

        let llm_registry = LlmRegistry::new();

        // Build provider config once - api_key determines whether we try real providers
        let provider_config = citeforge_core::ports::ProviderConfig {
            provider_type: format!("{:?}", config.llm.provider).to_lowercase(),
            base_url: Some(config.llm.base_url.clone()),
            api_key: config.llm.api_key.clone(),
            model: Some(config.llm.model.clone()),
            timeout_secs: config.llm.timeout_secs,
        };

        let llm = match llm_registry.create_chat(&provider_config) {
            Ok(llm) => llm,
            Err(e) => {
                tracing::warn!("chat provider init failed, using stub: {}", e);
                Arc::new(StubChatProvider) as Arc<dyn ChatProvider>
            }
        };

        let embedder = match llm_registry.create_embed(&provider_config) {
            Ok(e) => e,
            Err(e) => {
                tracing::warn!("embed provider init failed, using stub: {}", e);
                Arc::new(StubEmbedProvider) as Arc<dyn EmbedProvider>
            }
        };

        let search: Arc<dyn SearchEngine> = Arc::new(StubSearchEngine);

        // Try to connect ChromaDB, fall back to stub
        let vector_store: Arc<dyn VectorStore<Error = ChromaError>> = {
            let chroma_store = ChromaStore::new(
                config.chroma.url.clone(),
                config.chroma.collection.clone(),
                config.chroma.embedding_dimension,
            );
            match tokio::time::timeout(
                std::time::Duration::from_secs(2),
                chroma_store.ensure_collection(),
            ).await {
                Ok(Ok(_)) => Arc::new(chroma_store),
                _ => {
                    tracing::warn!("ChromaDB unavailable at {}, using stub", config.chroma.url);
                    Arc::new(StubVectorStore)
                }
            }
        };

        let pdf_parser: Arc<dyn DocumentParser> = Arc::new(PdfParser);

        let (outbox, _) = EventOutbox::new(Arc::clone(&db));

        Ok(Self {
            config,
            db,
            time_tracker,
            llm,
            embedder,
            search,
            vector_store,
            pdf_parser,
            outbox: Arc::new(outbox),
            llm_registry,
        })
    }
}
