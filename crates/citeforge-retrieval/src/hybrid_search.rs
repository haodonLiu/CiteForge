use crate::bm25::Bm25;

pub struct HybridSearch {
    bm25: Bm25,
}

impl HybridSearch {
    pub fn new(bm25: Bm25) -> Self {
        Self { bm25 }
    }

    pub fn search(&self, query: &str, top_k: usize) -> Vec<(usize, f32)> {
        self.bm25.search(query, top_k)
    }

    pub fn fuse_results(
        &self,
        bm25_scores: Vec<(usize, f32)>,
        vector_scores: Vec<(usize, f32)>,
        k: usize,
    ) -> Vec<(usize, f32)> {
        let mut rrf: HashMap<usize, f32> = HashMap::new();

        for (rank, (doc_idx, _)) in bm25_scores.iter().enumerate() {
            let score = 1.0 / (k as f32 + rank as f32 + 1.0);
            *rrf.entry(*doc_idx).or_insert(0.0) += score;
        }

        for (rank, (doc_idx, _)) in vector_scores.iter().enumerate() {
            let score = 1.0 / (k as f32 + rank as f32 + 1.0);
            *rrf.entry(*doc_idx).or_insert(0.0) += score;
        }

        let mut results: Vec<(usize, f32)> = rrf.into_iter().collect();
        results.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        results
    }
}

use std::collections::HashMap;
