use std::sync::Arc;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use crate::domain::agent::{Agent, AgentError};
use crate::domain::execution_context::TaskExecutionContext;
use crate::application::AppContainer;
use citeforge_core::entity::LiteratureEntry;
use citeforge_core::event::AgentType;

#[derive(Debug, Serialize, Deserialize)]
pub struct ResearcherInput {
    pub task_id: String,
    pub topic: String,
    pub pdf_paths: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ResearcherOutput {
    pub literature_entries: Vec<LiteratureEntry>,
    pub verified_count: usize,
}

pub struct ResearcherAgent {
    container: Arc<AppContainer>,
}

impl ResearcherAgent {
    pub fn new(container: Arc<AppContainer>) -> Self {
        Self { container }
    }
}

#[async_trait]
impl Agent for ResearcherAgent {
    type Input = ResearcherInput;
    type Output = ResearcherOutput;

    fn name(&self) -> &'static str {
        "ResearcherAgent"
    }

    async fn run(&self, ctx: &TaskExecutionContext, input: Self::Input) -> Result<Self::Output, AgentError> {
        tracing::info!("ResearcherAgent: starting research for topic '{}'", input.topic);

        let mut all_entries = Vec::new();

        // Parse PDFs
        for pdf_path in &input.pdf_paths {
            let bytes = tokio::fs::read(pdf_path).await
                .map_err(|e| AgentError::Execution(format!("failed to read PDF: {}", e)))?;

            let parsed = ctx.run_with_timeout(async {
                self.container.pdf_parser.parse(&bytes).await
            }).await
            .map_err(|_| AgentError::Timeout)?
            .map_err(|e| AgentError::Execution(format!("PDF parse error: {}", e)))?;

            // Create chunks and index
            for page in &parsed.pages {
                let chunk_id = format!("{}-p{}", pdf_path, page.number);
                let embedding = ctx.run_with_timeout(async {
                    self.container.embedder.embed(vec![page.text.clone()]).await
                }).await
                .map_err(|_| AgentError::Timeout)?
                .map_err(|e| AgentError::Llm(format!("embed error: {}", e)))?
                .into_iter().next()
                .ok_or_else(|| AgentError::Execution("no embedding returned".to_string()))?;

                self.container.vector_store.add(
                    &chunk_id,
                    embedding,
                    parsed.metadata.clone(),
                ).await
                .map_err(|e| AgentError::Execution(format!("vector store error: {}", e)))?;
            }

            // Search for related papers
            let search_results = ctx.run_with_timeout(async {
                self.container.search.search(&input.topic, 10).await
            }).await
            .map_err(|_| AgentError::Timeout)?
            .map_err(|e| AgentError::Execution(format!("search error: {}", e)))?;

            all_entries.extend(search_results);
        }

        // Deduplicate by DOI
        let mut seen_dois = std::collections::HashSet::new();
        let unique_entries: Vec<LiteratureEntry> = all_entries.into_iter()
            .filter(|e| {
                if let Some(doi) = &e.doi {
                    seen_dois.insert(doi.clone())
                } else {
                    true
                }
            })
            .collect();

        let verified_count = unique_entries.len();

        Ok(ResearcherOutput {
            literature_entries: unique_entries,
            verified_count,
        })
    }
}
