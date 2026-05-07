use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskDto {
    pub id: String,
    pub topic: String,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LiteratureEntryDto {
    pub id: String,
    pub index: i32,
    pub title: String,
    pub authors: Vec<String>,
    #[serde(rename = "abstractText")]
    pub abstract_text: Option<String>,
    pub doi: Option<String>,
    pub year: Option<i32>,
    pub venue: Option<String>,
    #[serde(rename = "citationCount")]
    pub citation_count: Option<i32>,
    pub verified: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeDto {
    pub id: String,
    pub name: String,
    pub description: String,
    #[serde(rename = "literatureIds")]
    pub literature_ids: Vec<String>,
}
