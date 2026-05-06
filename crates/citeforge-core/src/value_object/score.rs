use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Score {
    pub value: f32,
    pub components: ScoreComponents,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScoreComponents {
    pub vector_similarity: f32,
    pub metadata_completeness: f32,
    pub citation_count: f32,
}
