use std::sync::Arc;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use crate::domain::agent::{Agent, AgentError};
use crate::domain::execution_context::TaskExecutionContext;
use crate::application::AppContainer;
use citeforge_core::entity::{LiteratureEntry, Theme};

#[derive(Debug, Serialize, Deserialize)]
pub struct WriterInput {
    pub task_id: String,
    pub topic: String,
    pub literature_entries: Vec<LiteratureEntry>,
    pub themes: Vec<Theme>,
    pub trends: Vec<String>,
    pub gaps: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WriterOutput {
    pub draft: String,
    pub citation_count: usize,
}

pub struct WriterAgent {
    container: Arc<AppContainer>,
}

impl WriterAgent {
    pub fn new(container: Arc<AppContainer>) -> Self {
        Self { container }
    }

    fn validate_citations(&self, draft: &str, pool_size: usize) -> Result<(), AgentError> {
        // Check for [N] format citations
        let citation_regex = regex::Regex::new(r"\[(\d+)\]").expect("citation regex should always be valid");
        let mut errors = Vec::new();

        for cap in citation_regex.captures_iter(draft) {
            if let Ok(idx) = cap[1].parse::<usize>() {
                if idx < 1 || idx > pool_size {
                    errors.push(format!("Invalid citation [{}] - pool size is {}", idx, pool_size));
                }
            }
        }

        if !errors.is_empty() {
            return Err(AgentError::Execution(errors.join("; ")));
        }

        Ok(())
    }
}

#[async_trait]
impl Agent for WriterAgent {
    type Input = WriterInput;
    type Output = WriterOutput;

    fn name(&self) -> &'static str {
        "WriterAgent"
    }

    async fn run(&self, ctx: &TaskExecutionContext, input: Self::Input) -> Result<Self::Output, AgentError> {
        tracing::info!("WriterAgent: writing draft for topic '{}'", input.topic);

        let pool_size = input.literature_entries.len();

        // Build literature context
        let literature_context: String = input.literature_entries.iter()
            .enumerate()
            .map(|(i, e)| format!("[{}] {} - {}", i + 1, e.title, e.authors.join(", ")))
            .collect::<Vec<_>>()
            .join("\n");

        let prompt = format!(
            "Write a structured literature review on: {}\n\n\
            Literature Pool:\n{}\n\n\
            Themes identified: {}\n\
            Trends: {}\n\
            Research gaps: {}\n\n\
            Write in sections: Abstract, Introduction, Methodology, Findings, Discussion, Conclusion.\n\
            Use [N] format for citations where N is the index in the literature pool above.\n\
            Ensure all citations are valid (1-based indexing into the literature pool).",
            input.topic,
            literature_context,
            input.themes.iter().map(|t| t.name.as_str()).collect::<Vec<_>>().join(", "),
            input.trends.join("; "),
            input.gaps.join("; ")
        );

        let messages = vec![
            citeforge_core::ports::ChatMessage {
                role: "user".to_string(),
                content: prompt,
            }
        ];

        let draft = ctx.run_with_timeout(async {
            self.container.llm.chat(messages).await
        }).await
        .map_err(|_| AgentError::Timeout)?
        .map_err(|e| AgentError::Llm(format!("LLM error: {}", e)))?;

        // Validate citations
        self.validate_citations(&draft, pool_size)?;

        // Count citations
        let citation_regex = regex::Regex::new(r"\[(\d+)\]").expect("citation regex should always be valid");
        let citation_count = citation_regex.find_iter(&draft).count();

        Ok(WriterOutput { draft, citation_count })
    }
}