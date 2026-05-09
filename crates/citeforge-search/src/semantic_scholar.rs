use async_trait::async_trait;
use citeforge_core::entity::LiteratureEntry;
use citeforge_core::ports::{SearchEngine, SearchError};

pub struct SemanticScholarClient {
    api_key: Option<String>,
    client: reqwest::Client,
}

impl SemanticScholarClient {
    pub fn new(api_key: Option<String>) -> Self {
        Self {
            api_key,
            client: reqwest::Client::new(),
        }
    }
}

#[async_trait]
impl SearchEngine for SemanticScholarClient {
    async fn search(&self, query: &str, max_results: usize) -> Result<Vec<LiteratureEntry>, SearchError> {
        let url = "https://api.semanticscholar.org/graph/v1/paper/search";

        let mut req = self.client.get(url)
            .query(&[
                ("query", query),
                ("limit", &max_results.to_string()),
                ("fields", "title,authors,abstract,year,venue,citationCount,externalIds"),
            ]);

        if let Some(key) = &self.api_key {
            req = req.header("x-api-key", key);
        }

        let resp = req.send().await
            .map_err(|e| SearchError::Network(e.to_string()))?;

        if resp.status() == 429 {
            return Err(SearchError::RateLimited);
        }

        if !resp.status().is_success() {
            return Err(SearchError::Api(format!("API error: {}", resp.status())));
        }

        let result: serde_json::Value = resp.json().await
            .map_err(|e| SearchError::Network(e.to_string()))?;

        if let Some(msg) = result["error"].as_str() {
            tracing::warn!("Semantic Scholar API error: {}", msg);
        }

        let entries: Vec<LiteratureEntry> = result["data"]
            .as_array()
            .unwrap_or(&vec![])
            .iter()
            .filter_map(|paper| {
                let paper_id = paper["paperId"].as_str()?;
                if paper_id.is_empty() {
                    return None;
                }
                Some(paper)
            })
            .enumerate()
            .map(|(idx, paper)| {
                let authors: Vec<String> = paper["authors"]
                    .as_array()
                    .unwrap_or(&vec![])
                    .iter()
                    .filter_map(|a| a["name"].as_str().map(|s| s.to_string()))
                    .collect();

                let year = paper["year"].as_i64().map(|y| y as i32);
                let venue = paper["venue"].as_str().map(|s| s.to_string());
                let citation_count = paper["citationCount"].as_i64().map(|c| c as i32);
                let doi = paper["externalIds"]["DOI"].as_str().map(|s| s.to_string());

                LiteratureEntry {
                    id: paper["paperId"].as_str().unwrap().to_string(),
                    sort_order: idx as i32 + 1,
                    title: paper["title"].as_str().unwrap_or("").to_string(),
                    authors,
                    abstract_text: paper["abstract"].as_str().map(|s| s.to_string()),
                    doi,
                    year,
                    venue,
                    citation_count,
                    verified: false,
                }
            })
            .collect();

        Ok(entries)
    }
}
