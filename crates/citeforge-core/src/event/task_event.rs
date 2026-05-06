use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AgentType {
    Researcher,
    Analyst,
    Writer,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TaskEvent {
    TaskStarted { task_id: String },
    TaskCompleted { task_id: String },
    TaskFailed { task_id: String, error: String },
    AgentCompleted { task_id: String, agent: AgentType },
    LiteraturePoolUpdated { task_id: String, count: i32 },
    DraftGenerated { task_id: String },
}
