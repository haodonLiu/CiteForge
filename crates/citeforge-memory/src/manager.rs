use crate::error::MemoryError;
use crate::store::MemoryStore;
use crate::types::*;
use chrono::Utc;
use std::path::Path;
use uuid::Uuid;

/// High-level interface for storing, recalling, and forgetting memories.
pub struct MemoryManager {
    store: MemoryStore,
}

impl MemoryManager {
    /// Create a new manager backed by the SQLite database at `db_path`.
    pub fn new(db_path: &Path) -> Result<Self, MemoryError> {
        let store = MemoryStore::new(db_path)?;
        Ok(Self { store })
    }

    /// Persist a new memory and return its id.
    pub async fn store(&self, new_memory: NewMemory) -> Result<MemoryId, MemoryError> {
        let id = Uuid::new_v4();
        let now = Utc::now();
        let memory = Memory {
            id,
            content: new_memory.content,
            memory_type: new_memory.memory_type,
            metadata: new_memory.metadata,
            created_at: now,
            last_accessed: now,
            access_count: 0,
        };
        self.store.store(&memory)?;
        Ok(id)
    }

    /// Search memories by content substring.
    pub async fn recall(
        &self,
        query: &str,
        limit: usize,
    ) -> Result<Vec<Memory>, MemoryError> {
        self.store.search(query, limit)
    }

    /// Retrieve a single memory by id.
    pub async fn get(&self, id: &Uuid) -> Result<Option<Memory>, MemoryError> {
        self.store.get(id)
    }

    /// Delete a memory. Returns `true` if the memory existed.
    pub async fn forget(&self, id: &Uuid) -> Result<bool, MemoryError> {
        self.store.delete(id)
    }
}
