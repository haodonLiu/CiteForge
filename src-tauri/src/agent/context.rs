use crate::agent::personality::AgentPersonality;
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentContext {
    pub role: String,
    pub behavior_rules: Vec<String>,
    pub constraints: Vec<String>,
    pub personality: AgentPersonality,
    pub custom_context: String,
}

impl AgentContext {
    pub fn default_config_dir() -> std::path::PathBuf {
        dirs::home_dir()
            .unwrap_or_else(|| std::path::PathBuf::from("."))
            .join(".citeforge")
    }

    pub async fn load_from_path(path: &Path) -> Result<Self, Box<dyn std::error::Error>> {
        let agents_md = Self::read_file_or_default(&path.join("AGENTS.md")).await;
        let constrain_md = Self::read_file_or_default(&path.join("CONSTRAIN.md")).await;
        let personality_md = Self::read_file_or_default(&path.join("PERSONALITY.md")).await;
        let context_md = Self::read_file_or_default(&path.join("CONTEXT.md")).await;

        let role = Self::extract_role(&agents_md).unwrap_or_else(|| "科研助手".to_string());
        let behavior_rules = Self::extract_list(&agents_md);
        let constraints = Self::extract_list(&constrain_md);
        let personality = Self::parse_personality_md(&personality_md)
            .unwrap_or_else(|_| AgentPersonality::strict_scholar());

        Ok(Self {
            role,
            behavior_rules,
            constraints,
            personality,
            custom_context: context_md,
        })
    }

    async fn read_file_or_default(path: &Path) -> String {
        tokio::fs::read_to_string(path)
            .await
            .unwrap_or_default()
    }

    fn extract_role(content: &str) -> Option<String> {
        content.lines()
            .find(|line| line.starts_with("# ") || line.starts_with("## 角色"))
            .map(|line| line.trim_start_matches("# ").trim_start_matches("## 角色").trim().to_string())
    }

    fn extract_list(content: &str) -> Vec<String> {
        content.lines()
            .filter(|line| line.starts_with("- "))
            .map(|line| line.trim_start_matches("- ").trim().to_string())
            .collect()
    }

    fn parse_personality_md(content: &str) -> Result<AgentPersonality, Box<dyn std::error::Error>> {
        let name = Self::extract_field(content, "name").unwrap_or_else(|| "Custom".to_string());
        let description = Self::extract_field(content, "description").unwrap_or_default();

        Ok(AgentPersonality {
            id: uuid::Uuid::new_v4(),
            name,
            description,
            traits: crate::agent::personality::PersonalityTraits {
                directness: Self::extract_number(content, "directness").unwrap_or(50),
                humor: Self::extract_number(content, "humor").unwrap_or(50),
                curiosity: Self::extract_number(content, "curiosity").unwrap_or(50),
                criticalness: Self::extract_number(content, "criticalness").unwrap_or(50),
                patience: Self::extract_number(content, "patience").unwrap_or(50),
                creativity: Self::extract_number(content, "creativity").unwrap_or(50),
            },
            interaction_style: crate::agent::personality::InteractionStyle {
                proactive_questions: Self::extract_bool(content, "proactive_questions").unwrap_or(true),
                challenge_assumptions: Self::extract_bool(content, "challenge_assumptions").unwrap_or(false),
                suggest_alternatives: Self::extract_bool(content, "suggest_alternatives").unwrap_or(true),
                use_analogies: Self::extract_bool(content, "use_analogies").unwrap_or(false),
                cite_sources: Self::extract_bool(content, "cite_sources").unwrap_or(true),
            },
            system_prompt: Self::extract_field(content, "system_prompt").unwrap_or_default(),
        })
    }

    fn extract_field(content: &str, field: &str) -> Option<String> {
        content.lines()
            .find(|line| line.contains(&format!("{}:", field)))
            .and_then(|line| line.split(':').nth(1))
            .map(|value| value.trim().trim_matches('"').to_string())
    }

    fn extract_number(content: &str, field: &str) -> Option<u8> {
        Self::extract_field(content, field)
            .and_then(|s| s.parse().ok())
    }

    fn extract_bool(content: &str, field: &str) -> Option<bool> {
        Self::extract_field(content, field)
            .map(|s| s.to_lowercase() == "true" || s == "1")
    }

    pub fn build_system_prompt(&self) -> String {
        let mut prompt = String::new();
        prompt.push_str(&format!("你是{}。\n\n", self.role));
        prompt.push_str("## 行为规范\n");
        for rule in &self.behavior_rules {
            prompt.push_str(&format!("- {}\n", rule));
        }
        prompt.push_str("\n## 约束条件\n");
        for constraint in &self.constraints {
            prompt.push_str(&format!("- {}\n", constraint));
        }
        prompt.push_str(&format!("\n## 个性特征\n{}", self.personality.system_prompt));
        prompt
    }
}
