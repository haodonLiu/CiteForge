use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub type LiteratureId = Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Author {
    pub name: String,
    pub orcid: Option<String>,
    pub affiliation: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Category {
    Methodology,
    Theory,
    Survey,
    Experiment,
    Review,
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Literature {
    pub id: LiteratureId,
    pub title: String,
    pub authors: Vec<Author>,
    pub abstract_text: Option<String>,
    pub doi: Option<String>,
    pub year: Option<u32>,
    pub venue: Option<String>,
    pub tags: Vec<String>,
    pub categories: Vec<Category>,
    pub citation_count: Option<u32>,
    pub file_path: Option<String>,
    pub source: String,
    pub imported_at: DateTime<Utc>,
    pub last_accessed: DateTime<Utc>,
    pub read_progress: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewLiterature {
    pub title: String,
    pub authors: Vec<Author>,
    pub abstract_text: Option<String>,
    pub doi: Option<String>,
    pub year: Option<u32>,
    pub venue: Option<String>,
    pub tags: Vec<String>,
    pub categories: Vec<Category>,
    pub citation_count: Option<u32>,
    pub file_path: Option<String>,
    pub source: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_literature_creation() {
        let lit = Literature {
            id: Uuid::new_v4(),
            title: "Attention Is All You Need".to_string(),
            authors: vec![Author {
                name: "Vaswani et al.".to_string(),
                orcid: None,
                affiliation: None,
            }],
            abstract_text: Some("The dominant sequence transduction models...".to_string()),
            doi: Some("10.48550/arXiv.1706.03762".to_string()),
            year: Some(2017),
            venue: Some("NeurIPS".to_string()),
            tags: vec!["transformer".to_string(), "attention".to_string()],
            categories: vec![Category::Theory],
            citation_count: Some(100000),
            file_path: None,
            source: "arxiv".to_string(),
            imported_at: Utc::now(),
            last_accessed: Utc::now(),
            read_progress: 0.0,
        };

        assert_eq!(lit.title, "Attention Is All You Need");
        assert_eq!(lit.year, Some(2017));
    }
}
