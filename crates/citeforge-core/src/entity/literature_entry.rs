use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LiteratureEntry {
    pub id: String,
    pub index: i32,
    pub title: String,
    pub authors: Vec<String>,
    pub abstract_text: Option<String>,
    pub doi: Option<String>,
    pub year: Option<i32>,
    pub venue: Option<String>,
    pub citation_count: Option<i32>,
    pub verified: bool,
}
