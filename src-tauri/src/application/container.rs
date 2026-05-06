use std::sync::Arc;
use anyhow::Context;
use crate::config::AppConfig;
use crate::workspace::Database;
use citeforge_core::ports::{ChatProvider, EmbedProvider, VectorStore, DocumentParser, SearchEngine};
use citeforge_chroma::ChromaError;
use citeforge_llm::registry::LlmRegistry;
use citeforge_chroma::ChromaStore;
use citeforge_search::SemanticScholarClient;
use citeforge_pdf::PdfParser;
use crate::application::outbox::EventOutbox;

pub struct AppContainer {
    pub config: AppConfig,
    pub db: Arc<Database>,
    pub llm: Arc<dyn ChatProvider>,
    pub embedder: Arc<dyn EmbedProvider>,
    pub search: Arc<dyn SearchEngine>,
    pub vector_store: Arc<dyn VectorStore<Error = ChromaError>>,
    pub pdf_parser: Arc<dyn DocumentParser>,
    pub outbox: Arc<EventOutbox>,
    pub llm_registry: LlmRegistry,
}

impl AppContainer {
    pub async fn new(config: AppConfig) -> anyhow::Result<Self> {
        let db = Arc::new(Database::new(&config.workspace.root).await
            .context("failed to initialize database")?);

        let llm_registry = LlmRegistry::new();

        let provider_config = citeforge_core::ports::ProviderConfig {
            provider_type: format!("{:?}", config.llm.provider).to_lowercase(),
            base_url: Some(config.llm.base_url.clone()),
            api_key: Some(config.llm.api_key.clone().unwrap_or_default()),
            model: Some(config.llm.model.clone()),
            timeout_secs: config.llm.timeout_secs,
        };

        let llm = llm_registry.create_chat(&provider_config)
            .context("failed to create chat provider")?;

        let embedder = llm_registry.create_embed(&provider_config)
            .context("failed to create embed provider")?;

        let search: Arc<dyn SearchEngine> = Arc::new(
            SemanticScholarClient::new(config.llm.api_key.clone())
        );

        let chroma_store = ChromaStore::new(
            "http://localhost:8000".to_string(),
            "citeforge".to_string(),
            1536,
        );
        if let Err(e) = chroma_store.ensure_collection().await {
            tracing::warn!("failed to ensure chroma collection: {}", e);
        }
        let vector_store: Arc<dyn VectorStore<Error = ChromaError>> = Arc::new(chroma_store);

        let pdf_parser: Arc<dyn DocumentParser> = Arc::new(PdfParser);

        let (outbox, _) = EventOutbox::new(Arc::clone(&db));

        Ok(Self {
            config,
            db,
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
