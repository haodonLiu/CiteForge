use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub type MemoryId = Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MemoryType {
    ShortTerm,
    LongTerm,
    Working,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Importance {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MemorySource {
    Literature { id: Uuid, page: u32 },
    Note { id: Uuid },
    Conversation { session_id: Uuid },
    Annotation { id: Uuid },
    UserInput,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct MemoryMetadata {
    pub source: MemorySource,
    pub tags: Vec<String>,
    pub document_id: Option<Uuid>,
    pub literature_id: Option<Uuid>,
    pub importance: Importance,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Memory {
    pub id: MemoryId,
    pub content: String,
    pub memory_type: MemoryType,
    pub metadata: MemoryMetadata,
    pub created_at: DateTime<Utc>,
    pub last_accessed: DateTime<Utc>,
    pub access_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewMemory {
    pub content: String,
    pub memory_type: MemoryType,
    pub metadata: MemoryMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryUpdates {
    pub content: Option<String>,
    pub metadata: Option<MemoryMetadata>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_memory_creation() {
        let memory = Memory {
            id: Uuid::new_v4(),
            content: "Test memory".to_string(),
            memory_type: MemoryType::LongTerm,
            metadata: MemoryMetadata {
                source: MemorySource::UserInput,
                tags: vec!["test".to_string()],
                document_id: None,
                literature_id: None,
                importance: Importance::Medium,
            },
            created_at: Utc::now(),
            last_accessed: Utc::now(),
            access_count: 0,
        };

        assert_eq!(memory.content, "Test memory");
        assert_eq!(memory.memory_type, MemoryType::LongTerm);
        assert_eq!(memory.metadata.tags, vec!["test".to_string()]);
    }

    #[test]
    fn test_memory_serialization_roundtrip() {
        let memory = Memory {
            id: Uuid::new_v4(),
            content: "Serializable memory".to_string(),
            memory_type: MemoryType::ShortTerm,
            metadata: MemoryMetadata {
                source: MemorySource::Literature {
                    id: Uuid::new_v4(),
                    page: 42,
                },
                tags: vec!["research".to_string()],
                document_id: Some(Uuid::new_v4()),
                literature_id: None,
                importance: Importance::High,
            },
            created_at: Utc::now(),
            last_accessed: Utc::now(),
            access_count: 5,
        };

        let json = serde_json::to_string(&memory).expect("serialization should succeed");
        let deserialized: Memory =
            serde_json::from_str(&json).expect("deserialization should succeed");
        assert_eq!(memory, deserialized);
    }
}
