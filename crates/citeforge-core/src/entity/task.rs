use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub topic: String,
    pub state: TaskState,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TaskState {
    Pending,
    Researching,
    Analyzing,
    Writing,
    Completed,
    Failed { error: String, retry_count: u8 },
}

impl Task {
    pub fn new(id: String, topic: String) -> Self {
        let now = Utc::now();
        Self {
            id,
            topic,
            state: TaskState::Pending,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn transition(&mut self, new_state: TaskState) -> Result<(), InvalidTransition> {
        validate_transition(&self.state, &new_state)?;
        self.state = new_state;
        self.updated_at = Utc::now();
        Ok(())
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct InvalidTransition;

fn is_failed(state: &TaskState) -> bool {
    matches!(state, TaskState::Failed { .. })
}

fn is_terminal(state: &TaskState) -> bool {
    matches!(state, TaskState::Completed) || is_failed(state)
}

fn validate_transition(from: &TaskState, to: &TaskState) -> Result<(), InvalidTransition> {
    if is_terminal(from) {
        return Err(InvalidTransition);
    }

    match (from, to) {
        (TaskState::Pending, TaskState::Researching) => Ok(()),
        (TaskState::Researching, TaskState::Analyzing) => Ok(()),
        (TaskState::Analyzing, TaskState::Writing) => Ok(()),
        (TaskState::Writing, TaskState::Completed) => Ok(()),
        (s, TaskState::Failed { .. }) if !is_failed(s) => Ok(()),
        _ => Err(InvalidTransition),
    }
}
