use std::time::{Duration, Instant};
use tokio::sync::CancellationToken;

pub struct TaskExecutionContext {
    pub cancel_token: CancellationToken,
    pub deadline: Instant,
    pub task_id: String,
}

impl TaskExecutionContext {
    pub fn new(task_id: String, max_duration: Duration) -> Self {
        Self {
            cancel_token: CancellationToken::new(),
            deadline: Instant::now() + max_duration,
            task_id,
        }
    }

    pub fn remaining(&self) -> Duration {
        self.deadline.saturating_duration_since(Instant::now())
    }

    pub fn is_cancelled(&self) -> bool {
        self.cancel_token.is_cancelled()
    }

    pub async fn run_with_timeout<F, R>(&self, future: F) -> Result<R, ExecutionError>
    where
        F: std::future::Future<Output = R>,
    {
        tokio::select! {
            result = future => Ok(result),
            _ = self.cancel_token.cancelled() => Err(ExecutionError::Cancelled),
            _ = tokio::time::sleep(self.remaining()) => Err(ExecutionError::Timeout),
        }
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ExecutionError {
    #[error("task cancelled")]
    Cancelled,
    #[error("task timed out")]
    Timeout,
    #[error("agent error: {0}")]
    Agent(String),
}
