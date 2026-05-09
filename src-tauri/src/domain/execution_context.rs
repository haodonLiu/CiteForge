use std::time::{Duration, Instant};
use tokio_util::sync::CancellationToken;

#[derive(Clone)]
pub struct TaskExecutionContext {
    pub cancel_token: CancellationToken,
    pub deadline: Instant,
}

impl TaskExecutionContext {
    pub fn new(_task_id: String, max_duration: Duration) -> Self {
        Self {
            cancel_token: CancellationToken::new(),
            deadline: Instant::now() + max_duration,
        }
    }

    pub fn remaining(&self) -> Duration {
        self.deadline.saturating_duration_since(Instant::now())
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
}
