use std::collections::HashMap;

pub struct Bm25 {
    k1: f32,
    b: f32,
    average_doc_length: f32,
    doc_lengths: Vec<usize>,
    doc_freqs: Vec<HashMap<String, usize>>,
    idf: HashMap<String, f32>,
}

impl Bm25 {
    pub fn new(k1: f32, b: f32) -> Self {
        Self {
            k1,
            b,
            average_doc_length: 0.0,
            doc_lengths: Vec::new(),
            doc_freqs: Vec::new(),
            idf: HashMap::new(),
        }
    }

    pub fn index(&mut self, documents: Vec<String>) {
        let mut total_length = 0;
        let num_docs = documents.len();

        for doc in &documents {
            let tokens = self.tokenize(doc);
            let doc_length = tokens.len();
            total_length += doc_length;
            self.doc_lengths.push(doc_length);

            let mut freq: HashMap<String, usize> = HashMap::new();
            for token in &tokens {
                *freq.entry(token.clone()).or_insert(0) += 1;
            }
            self.doc_freqs.push(freq);
        }

        self.average_doc_length = total_length as f32 / num_docs as f32;

        let mut doc_occurrences: HashMap<String, usize> = HashMap::new();
        for freq in &self.doc_freqs {
            for token in freq.keys() {
                *doc_occurrences.entry(token.clone()).or_insert(0) += 1;
            }
        }

        for (token, count) in doc_occurrences {
            let idf = ((num_docs - count) as f32 + 0.5) / (count as f32 + 0.5);
            self.idf.insert(token, idf.max(0.0));
        }
    }

    pub fn search(&self, query: &str, top_k: usize) -> Vec<(usize, f32)> {
        let query_tokens = self.tokenize(query);
        let mut scores: Vec<(usize, f32)> = Vec::new();

        for (doc_idx, freq) in self.doc_freqs.iter().enumerate() {
            let doc_length = self.doc_lengths[doc_idx];
            let mut score = 0.0f32;

            for token in &query_tokens {
                if let Some(&term_freq) = freq.get(token) {
                    let idf = self.idf.get(token).copied().unwrap_or(0.0);
                    let tf = term_freq as f32;
                    let doc_len_norm = doc_length as f32 / self.average_doc_length;

                    score += idf * (tf * (self.k1 + 1.0))
                        / (tf + self.k1 * (1.0 - self.b + self.b * doc_len_norm));
                }
            }

            scores.push((doc_idx, score));
        }

        scores.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        scores.truncate(top_k);
        scores
    }

    fn tokenize(&self, text: &str) -> Vec<String> {
        text.to_lowercase()
            .split(|c: char| !c.is_alphanumeric())
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string())
            .collect()
    }
}
