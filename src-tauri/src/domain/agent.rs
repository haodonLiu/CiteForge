use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use crate::domain::execution_context::TaskExecutionContext;

#[async_trait]
pub trait Agent: Send + Sync {
    type Input: Serialize + for<'de> Deserialize<'de> + Send;
    type Output: Serialize + for<'de> Deserialize<'de> + Send;

    fn name(&self) -> &'static str;

    async fn run(&self, ctx: &TaskExecutionContext, input: Self::Input) -> Result<Self::Output, AgentError>;

    async fn compensate(&self, _ctx: &TaskExecutionContext) -> Result<(), AgentError> {
        Ok(())
    }
}

#[derive(Debug, thiserror::Error)]
pub enum AgentError {
    #[error("execution error: {0}")]
    Execution(String),
    #[error("cancelled")]
    Cancelled,
    #[error("timeout")]
    Timeout,
    #[error("llm error: {0}")]
    Llm(String),
}
