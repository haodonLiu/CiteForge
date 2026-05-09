pub struct Reranker;

impl Reranker {
    pub fn new() -> Self {
        Self
    }

    pub fn rerank(
        &self,
        _query: &str,
        _documents: Vec<String>,
        scores: Vec<f32>,
        top_k: usize,
    ) -> Vec<(usize, f32)> {
        let mut reranked: Vec<(usize, f32)> = scores.into_iter().enumerate().collect();

        reranked.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        reranked.truncate(top_k);
        reranked
    }
}

impl Default for Reranker {
    fn default() -> Self {
        Self::new()
    }
}
