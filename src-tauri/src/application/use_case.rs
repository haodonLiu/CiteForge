use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct RunTaskInput {
    pub topic: String,
    pub pdf_paths: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RunTaskOutput {
    pub task_id: String,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetStatusInput {
    pub task_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetStatusOutput {
    pub task_id: String,
    pub status: String,
    pub progress: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ResumeTaskInput {
    pub workspace_path: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ResumeTaskOutput {
    pub task_id: String,
    pub status: String,
}
