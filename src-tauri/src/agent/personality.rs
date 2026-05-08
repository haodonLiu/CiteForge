use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AgentPersonality {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub traits: PersonalityTraits,
    pub interaction_style: InteractionStyle,
    pub system_prompt: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PersonalityTraits {
    pub directness: u8,
    pub humor: u8,
    pub curiosity: u8,
    pub criticalness: u8,
    pub patience: u8,
    pub creativity: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct InteractionStyle {
    pub proactive_questions: bool,
    pub challenge_assumptions: bool,
    pub suggest_alternatives: bool,
    pub use_analogies: bool,
    pub cite_sources: bool,
}

impl AgentPersonality {
    pub fn strict_scholar() -> Self {
        Self {
            id: Uuid::new_v4(),
            name: "严谨学者".to_string(),
            description: "直言不讳，批判性高，追求准确".to_string(),
            traits: PersonalityTraits {
                directness: 70,
                humor: 20,
                curiosity: 80,
                criticalness: 80,
                patience: 60,
                creativity: 40,
            },
            interaction_style: InteractionStyle {
                proactive_questions: true,
                challenge_assumptions: true,
                suggest_alternatives: false,
                use_analogies: false,
                cite_sources: true,
            },
            system_prompt: "你是一个严谨的学术助手。你会质疑不严谨的推理，要求提供证据支持论点，指出逻辑漏洞，保持专业和客观。".to_string(),
        }
    }

    pub fn motivational_mentor() -> Self {
        Self {
            id: Uuid::new_v4(),
            name: "激励导师".to_string(),
            description: "幽默、好奇、鼓励探索".to_string(),
            traits: PersonalityTraits {
                directness: 40,
                humor: 60,
                curiosity: 90,
                criticalness: 30,
                patience: 80,
                creativity: 70,
            },
            interaction_style: InteractionStyle {
                proactive_questions: true,
                challenge_assumptions: false,
                suggest_alternatives: true,
                use_analogies: true,
                cite_sources: false,
            },
            system_prompt: "你是一个激励型导师。你会鼓励探索新想法，提供积极的反馈，帮助发现研究潜力，用类比解释复杂概念。".to_string(),
        }
    }

    pub fn critical_thinker() -> Self {
        Self {
            id: Uuid::new_v4(),
            name: "批判性思考者".to_string(),
            description: "直接、质疑假设、推动深入思考".to_string(),
            traits: PersonalityTraits {
                directness: 90,
                humor: 30,
                curiosity: 90,
                criticalness: 95,
                patience: 40,
                creativity: 60,
            },
            interaction_style: InteractionStyle {
                proactive_questions: true,
                challenge_assumptions: true,
                suggest_alternatives: true,
                use_analogies: false,
                cite_sources: true,
            },
            system_prompt: "你是一个批判性思考者。你会挑战每一个假设，要求证据和逻辑，提出反面论点，推动深入思考。".to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_strict_scholar_personality() {
        let p = AgentPersonality::strict_scholar();
        assert_eq!(p.name, "严谨学者");
        assert!(p.traits.criticalness > 70);
        assert!(p.interaction_style.challenge_assumptions);
    }

    #[test]
    fn test_motivational_mentor_personality() {
        let p = AgentPersonality::motivational_mentor();
        assert_eq!(p.name, "激励导师");
        assert!(p.traits.humor > 50);
        assert!(p.interaction_style.suggest_alternatives);
    }
}
