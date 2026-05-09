use crate::domain::execution_context::TaskExecutionContext;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

#[async_trait]
pub trait Agent: Send + Sync {
    type Input: Serialize + for<'de> Deserialize<'de> + Send;
    type Output: Serialize + for<'de> Deserialize<'de> + Send;

    async fn run(
        &self,
        ctx: &TaskExecutionContext,
        input: Self::Input,
    ) -> Result<Self::Output, AgentError>;
}

#[derive(Debug, thiserror::Error)]
pub enum AgentError {
    #[error("execution error: {0}")]
    Execution(String),
    #[error("timeout")]
    Timeout,
    #[error("llm error: {0}")]
    Llm(String),
}
