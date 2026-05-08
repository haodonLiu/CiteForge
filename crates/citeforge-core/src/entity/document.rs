use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub type DocumentId = Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ReadStatus {
    Unread,
    Reading,
    Read,
    ToRead,
    Archived,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Document {
    pub id: DocumentId,
    pub title: String,
    pub file_path: Option<String>,
    pub content: Option<String>,
    pub read_status: ReadStatus,
    pub read_progress: f32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_accessed: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewDocument {
    pub title: String,
    pub file_path: Option<String>,
    pub content: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_document_creation() {
        let doc = Document {
            id: Uuid::new_v4(),
            title: "Test Document".to_string(),
            file_path: None,
            content: Some("# Hello".to_string()),
            read_status: ReadStatus::Unread,
            read_progress: 0.0,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            last_accessed: Utc::now(),
        };

        assert_eq!(doc.title, "Test Document");
        assert_eq!(doc.read_status, ReadStatus::Unread);
    }
}
