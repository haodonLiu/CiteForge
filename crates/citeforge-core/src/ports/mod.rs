pub mod chat;
pub mod document_parser;
pub mod embed;
pub mod registry;
pub mod search_engine;
pub mod vector_store;

pub use chat::{ChatError, ChatMessage, ChatProvider};
pub use document_parser::{DocumentParser, Page, ParsedDocument, ParserError};
pub use embed::{EmbedError, EmbedProvider};
pub use registry::{
    ChatProviderFactory, EmbedProviderFactory, ProviderConfig, StoreConfig, VectorStoreFactory,
};
pub use search_engine::{SearchEngine, SearchError};
pub use vector_store::{SearchResult, VectorStore};
