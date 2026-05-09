use std::sync::Arc;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use crate::domain::agent::{Agent, AgentError};
use crate::domain::execution_context::TaskExecutionContext;
use crate::application::AppContainer;
use citeforge_core::entity::{Theme, LiteratureEntry};

#[derive(Debug, Serialize, Deserialize)]
pub struct AnalystInput {
    pub task_id: String,
    pub literature_entries: Vec<LiteratureEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalystOutput {
    pub themes: Vec<Theme>,
    pub trends: Vec<String>,
    pub gaps: Vec<String>,
}

pub struct AnalystAgent {
    container: Arc<AppContainer>,
}

impl AnalystAgent {
    pub fn new(container: Arc<AppContainer>) -> Self {
        Self { container }
    }
}

#[async_trait]
impl Agent for AnalystAgent {
    type Input = AnalystInput;
    type Output = AnalystOutput;

    fn name(&self) -> &'static str {
        "AnalystAgent"
    }

    async fn run(&self, ctx: &TaskExecutionContext, input: Self::Input) -> Result<Self::Output, AgentError> {
        tracing::info!("AnalystAgent: analyzing {} literature entries", input.literature_entries.len());

        let entries_text: Vec<String> = input.literature_entries.iter()
            .map(|e| format!("Title: {}\nAbstract: {}", e.title, e.abstract_text.as_deref().unwrap_or("")))
            .collect();

        let prompt = format!(
            "You are an academic research analyst. Analyze the following papers and identify:\n\
            1. Main themes (group papers by topic)\n\
            2. Research trends\n\
            3. Research gaps\n\n\
            Papers:\n{}\n\n\
            Respond in JSON format with: themes (name, description, paper_ids), trends (description), gaps (description)",
            entries_text.join("\n---\n")
        );

        let messages = vec![
            citeforge_core::ports::ChatMessage {
                role: "user".to_string(),
                content: prompt,
            }
        ];

        let response = ctx.run_with_timeout(async {
            self.container.llm.chat(messages).await
        }).await
        .map_err(|_| AgentError::Timeout)?
        .map_err(|e| AgentError::Llm(format!("LLM error: {}", e)))?;

        // Parse JSON response - simplified for now
        let themes = self.parse_themes(&response, &input.literature_entries);
        let trends = vec!["Trend 1: Increasing focus on multi-modal models".to_string()];
        let gaps = vec!["Gap: Limited work on explainability".to_string()];

        Ok(AnalystOutput { themes, trends, gaps })
    }
}

impl AnalystAgent {
    fn parse_themes(&self, _response: &str, entries: &[LiteratureEntry]) -> Vec<Theme> {
        // Simplified theme extraction - in production would use proper JSON parsing
        let mut themes = Vec::new();

        if !entries.is_empty() {
            themes.push(Theme {
                id: "theme-1".to_string(),
                name: "Core Research".to_string(),
                description: "Papers directly related to the main topic".to_string(),
                literature_ids: entries.iter().take(3).map(|e| e.id.clone()).collect(),
            });
        }

        themes
    }
}
