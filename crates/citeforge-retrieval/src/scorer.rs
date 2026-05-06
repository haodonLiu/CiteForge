use citeforge_core::value_object::Score;

pub struct RelevanceScorer {
    vector_weight: f32,
    metadata_weight: f32,
    citation_weight: f32,
}

impl RelevanceScorer {
    pub fn new(vector_weight: f32, metadata_weight: f32, citation_weight: f32) -> Self {
        Self {
            vector_weight,
            metadata_weight,
            citation_weight,
        }
    }

    pub fn compute(
        &self,
        vector_similarity: f32,
        metadata_completeness: f32,
        citation_count: i32,
    ) -> Score {
        let citation_log = if citation_count > 0 {
            (citation_count as f32).ln().max(0.0)
        } else {
            0.0
        };

        let value = self.vector_weight * vector_similarity
            + self.metadata_weight * metadata_completeness
            + self.citation_weight * citation_log;

        Score {
            value,
            components: citeforge_core::value_object::ScoreComponents {
                vector_similarity,
                metadata_completeness,
                citation_count: citation_log,
            },
        }
    }
}
