use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Draft {
    pub id: String,
    pub task_id: String,
    pub content: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}
