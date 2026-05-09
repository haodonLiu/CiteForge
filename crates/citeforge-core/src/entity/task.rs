use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

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
    AnalyzingAndWriting,
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

impl std::fmt::Display for InvalidTransition {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "invalid state transition")
    }
}

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
        (TaskState::Researching, TaskState::AnalyzingAndWriting) => Ok(()),
        (TaskState::Analyzing, TaskState::Writing) => Ok(()),
        (TaskState::Writing, TaskState::Completed) => Ok(()),
        (TaskState::AnalyzingAndWriting, TaskState::Completed) => Ok(()),
        (s, TaskState::Failed { .. }) if !is_failed(s) => Ok(()),
        _ => Err(InvalidTransition),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_pending_to_researching() {
        let mut task = Task::new("t1".into(), "topic".into());
        assert!(task.transition(TaskState::Researching).is_ok());
        assert_eq!(task.state, TaskState::Researching);
    }

    #[test]
    fn test_valid_full_pipeline() {
        let mut task = Task::new("t1".into(), "topic".into());
        assert!(task.transition(TaskState::Researching).is_ok());
        assert!(task.transition(TaskState::Analyzing).is_ok());
        assert!(task.transition(TaskState::Writing).is_ok());
        assert!(task.transition(TaskState::Completed).is_ok());
    }

    #[test]
    fn test_valid_concurrent_pipeline() {
        let mut task = Task::new("t1".into(), "topic".into());
        assert!(task.transition(TaskState::Researching).is_ok());
        assert!(task.transition(TaskState::AnalyzingAndWriting).is_ok());
        assert!(task.transition(TaskState::Completed).is_ok());
    }

    #[test]
    fn test_invalid_researching_to_researching() {
        let mut task = Task::new("t1".into(), "topic".into());
        assert!(task.transition(TaskState::Researching).is_ok());
        assert!(task.transition(TaskState::Researching).is_err());
    }

    #[test]
    fn test_invalid_skip_state() {
        let mut task = Task::new("t1".into(), "topic".into());
        assert!(task.transition(TaskState::Analyzing).is_err());
    }

    #[test]
    fn test_cannot_transition_from_completed() {
        let mut task = Task::new("t1".into(), "topic".into());
        task.transition(TaskState::Researching).unwrap();
        task.transition(TaskState::Analyzing).unwrap();
        task.transition(TaskState::Writing).unwrap();
        task.transition(TaskState::Completed).unwrap();
        assert!(task.transition(TaskState::Researching).is_err());
    }

    #[test]
    fn test_can_fail_from_any_non_terminal() {
        let mut task = Task::new("t1".into(), "topic".into());
        assert!(task
            .transition(TaskState::Failed {
                error: "e".into(),
                retry_count: 0
            })
            .is_ok());
    }
}
