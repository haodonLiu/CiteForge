use crate::error::MemoryError;
use crate::types::*;
use chrono::{DateTime, Utc};
use rusqlite::{params, Connection};
use std::path::Path;
use std::sync::{Arc, Mutex};
use uuid::Uuid;

/// SQLite-backed storage for memory records.
pub struct MemoryStore {
    conn: Arc<Mutex<Connection>>,
}

impl MemoryStore {
    /// Open (or create) the SQLite database at `db_path` and initialise the schema.
    pub fn new(db_path: &Path) -> Result<Self, MemoryError> {
        let conn = Connection::open(db_path)?;
        let store = Self {
            conn: Arc::new(Mutex::new(conn)),
        };
        store.init_schema()?;
        Ok(store)
    }

    fn init_schema(&self) -> Result<(), MemoryError> {
        let conn = self.conn.lock().expect("mutex poisoned");
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS memories (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                memory_type TEXT NOT NULL,
                metadata TEXT NOT NULL,
                created_at TEXT NOT NULL,
                last_accessed TEXT NOT NULL,
                access_count INTEGER NOT NULL DEFAULT 0
            );
            CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(memory_type);
            CREATE INDEX IF NOT EXISTS idx_memories_created ON memories(created_at);",
        )?;
        Ok(())
    }

    /// Persist a memory record.
    pub fn store(&self, memory: &Memory) -> Result<(), MemoryError> {
        let conn = self.conn.lock().expect("mutex poisoned");
        let metadata_json = serde_json::to_string(&memory.metadata)?;
        conn.execute(
            "INSERT INTO memories (id, content, memory_type, metadata, created_at, last_accessed, access_count)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                memory.id.to_string(),
                memory.content,
                serde_json::to_string(&memory.memory_type)?,
                metadata_json,
                memory.created_at.to_rfc3339(),
                memory.last_accessed.to_rfc3339(),
                memory.access_count,
            ],
        )?;
        Ok(())
    }

    /// Retrieve a single memory by id.
    pub fn get(&self, id: &Uuid) -> Result<Option<Memory>, MemoryError> {
        let conn = self.conn.lock().expect("mutex poisoned");
        let mut stmt = conn.prepare(
            "SELECT id, content, memory_type, metadata, created_at, last_accessed, access_count
             FROM memories WHERE id = ?1",
        )?;

        let mut rows = stmt.query_map(params![id.to_string()], Self::row_to_memory)?;

        match rows.next() {
            Some(row) => Ok(Some(row?)),
            None => Ok(None),
        }
    }

    /// Simple substring search over memory content, ordered by recency.
    pub fn search(&self, query: &str, limit: usize) -> Result<Vec<Memory>, MemoryError> {
        let conn = self.conn.lock().expect("mutex poisoned");
        let mut stmt = conn.prepare(
            "SELECT id, content, memory_type, metadata, created_at, last_accessed, access_count
             FROM memories WHERE content LIKE ?1
             ORDER BY last_accessed DESC LIMIT ?2",
        )?;

        let pattern = format!("%{}%", query);
        let rows = stmt.query_map(params![pattern, limit as i64], |row| {
            Self::row_to_memory(row)
        })?;

        let mut memories = Vec::new();
        for row in rows {
            memories.push(row?);
        }
        Ok(memories)
    }

    /// Delete a memory by id. Returns `true` if a row was actually removed.
    pub fn delete(&self, id: &Uuid) -> Result<bool, MemoryError> {
        let conn = self.conn.lock().expect("mutex poisoned");
        let rows_deleted = conn.execute(
            "DELETE FROM memories WHERE id = ?1",
            params![id.to_string()],
        )?;
        Ok(rows_deleted > 0)
    }

    // ---- private helpers ----

    /// Map a SQLite row to a `Memory` value.  Extracted so both `get` and `search`
    /// share the same deserialisation logic without duplicating unwrap chains.
    fn row_to_memory(row: &rusqlite::Row<'_>) -> Result<Memory, rusqlite::Error> {
        let id: String = row.get(0)?;
        let content: String = row.get(1)?;
        let memory_type_json: String = row.get(2)?;
        let metadata_json: String = row.get(3)?;
        let created_at_str: String = row.get(4)?;
        let last_accessed_str: String = row.get(5)?;
        let access_count: u32 = row.get(6)?;

        let id = Uuid::parse_str(&id)
            .map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
        let memory_type: MemoryType = serde_json::from_str(&memory_type_json)
            .map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
        let metadata: MemoryMetadata = serde_json::from_str(&metadata_json)
            .map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
        let created_at: DateTime<Utc> = DateTime::parse_from_rfc3339(&created_at_str)
            .map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?
            .with_timezone(&Utc);
        let last_accessed: DateTime<Utc> = DateTime::parse_from_rfc3339(&last_accessed_str)
            .map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?
            .with_timezone(&Utc);

        Ok(Memory {
            id,
            content,
            memory_type,
            metadata,
            created_at,
            last_accessed,
            access_count,
        })
    }
}
