use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub type AnnotationId = Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AnnotationType {
    Highlight,
    Underline,
    Note,
    Stamp,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Position {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub page_width: f64,
    pub page_height: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Annotation {
    pub id: AnnotationId,
    pub document_id: Uuid,
    pub page_number: u32,
    pub annotation_type: AnnotationType,
    pub content: Option<String>,
    pub color: String,
    pub position: Position,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewAnnotation {
    pub document_id: Uuid,
    pub page_number: u32,
    pub annotation_type: AnnotationType,
    pub content: Option<String>,
    pub color: String,
    pub position: Position,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_annotation_creation() {
        let annotation = Annotation {
            id: Uuid::new_v4(),
            document_id: Uuid::new_v4(),
            page_number: 1,
            annotation_type: AnnotationType::Highlight,
            content: None,
            color: "#fbbf24".to_string(),
            position: Position {
                x: 0.1,
                y: 0.2,
                width: 0.3,
                height: 0.05,
                page_width: 1.0,
                page_height: 1.0,
            },
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        assert_eq!(annotation.annotation_type, AnnotationType::Highlight);
        assert_eq!(annotation.color, "#fbbf24");
    }
}
