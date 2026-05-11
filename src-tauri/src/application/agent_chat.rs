use citeforge_core::ports::ChatMessage;
use citeforge_workspace::{
    AgentConversationDto, Database,
};
use std::sync::Arc;

/// Context passed to agent chat to enrich the conversation
#[derive(Debug, Clone, Default)]
pub struct ChatContext {
    pub topic: Option<String>,
    pub literature_ids: Vec<String>,
    pub note_ids: Vec<String>,
}

/// Single agent chat service
pub struct AgentChatService {
    db: Arc<Database>,
    llm: Arc<dyn citeforge_core::ports::ChatProvider>,
}

impl AgentChatService {
    pub fn new(db: Arc<Database>, llm: Arc<dyn citeforge_core::ports::ChatProvider>) -> Self {
        Self { db, llm }
    }

    /// Send a message to an agent and get a response
    pub async fn chat(
        &self,
        task_id: &str,
        agent_name: &str,
        personality_prompt: &str,
        user_message: &str,
        context: &ChatContext,
    ) -> anyhow::Result<String> {
        // Build system prompt
        let system_prompt = self.build_system_prompt(agent_name, personality_prompt, context).await;

        // Load recent conversation history (last 10 messages)
        let history = self
            .db
            .get_agent_conversation(task_id, Some(agent_name), Some(10))
            .await
            .unwrap_or_default();

        // Build messages for LLM
        let mut messages = vec![ChatMessage {
            role: "system".to_string(),
            content: system_prompt,
        }];

        // Add history (oldest first)
        for msg in history.iter().rev() {
            messages.push(ChatMessage {
                role: msg.role.clone(),
                content: msg.content.clone(),
            });
        }

        // Add user message
        messages.push(ChatMessage {
            role: "user".to_string(),
            content: user_message.to_string(),
        });

        // Call LLM
        let response = self.llm.chat(messages).await.map_err(|e| {
            anyhow::anyhow!("LLM error: {}", e)
        })?;

        // Save user message
        let user_msg = AgentConversationDto {
            id: format!("msg-{}", uuid::Uuid::new_v4()),
            task_id: task_id.to_string(),
            agent_name: agent_name.to_string(),
            personality_id: None,
            role: "user".to_string(),
            content: user_message.to_string(),
            metadata: None,
            created_at: chrono::Utc::now().to_rfc3339(),
        };
        let _ = self.db.save_agent_message(&user_msg).await;

        // Save assistant response
        let assistant_msg = AgentConversationDto {
            id: format!("msg-{}", uuid::Uuid::new_v4()),
            task_id: task_id.to_string(),
            agent_name: agent_name.to_string(),
            personality_id: None,
            role: "assistant".to_string(),
            content: response.clone(),
            metadata: None,
            created_at: chrono::Utc::now().to_rfc3339(),
        };
        let _ = self.db.save_agent_message(&assistant_msg).await;

        Ok(response)
    }

    /// Start a multi-agent discussion on a topic
    pub async fn start_discussion(
        &self,
        task_id: &str,
        topic: &str,
        _literature_ids: &[String],
    ) -> anyhow::Result<Vec<AgentConversationDto>> {
        let mut discussion = Vec::new();

        // Step 1: Researcher provides background
        let researcher_prompt = self.build_system_prompt(
            "Researcher",
            "你是一个研究助手，擅长收集和整理学术信息。你会提供相关背景知识和文献依据。",
            &ChatContext {
                topic: Some(topic.to_string()),
                ..Default::default()
            },
        ).await;

        let researcher_response = self
            .llm
            .chat(vec![
                ChatMessage {
                    role: "system".to_string(),
                    content: researcher_prompt,
                },
                ChatMessage {
                    role: "user".to_string(),
                    content: format!("请就以下主题提供背景信息和相关文献依据：{}", topic),
                },
            ])
            .await
            .unwrap_or_else(|_| "无法获取研究信息".to_string());

        discussion.push(AgentConversationDto {
            id: format!("msg-{}", uuid::Uuid::new_v4()),
            task_id: task_id.to_string(),
            agent_name: "Researcher".to_string(),
            personality_id: None,
            role: "assistant".to_string(),
            content: researcher_response.clone(),
            metadata: Some("{\"step\":\"research\"}".to_string()),
            created_at: chrono::Utc::now().to_rfc3339(),
        });

        // Step 2: Analyst analyzes and critiques
        let analyst_prompt = self.build_system_prompt(
            "Analyst",
            "你是一个分析专家，擅长识别模式、发现研究 gaps、提出批判性观点。",
            &ChatContext {
                topic: Some(topic.to_string()),
                ..Default::default()
            },
        ).await;

        let analyst_response = self
            .llm
            .chat(vec![
                ChatMessage {
                    role: "system".to_string(),
                    content: analyst_prompt,
                },
                ChatMessage {
                    role: "user".to_string(),
                    content: format!(
                        "基于以下研究背景，请进行分析、识别关键模式和研究 gaps：\n\n{}",
                        researcher_response
                    ),
                },
            ])
            .await
            .unwrap_or_else(|_| "无法进行分析".to_string());

        discussion.push(AgentConversationDto {
            id: format!("msg-{}", uuid::Uuid::new_v4()),
            task_id: task_id.to_string(),
            agent_name: "Analyst".to_string(),
            personality_id: None,
            role: "assistant".to_string(),
            content: analyst_response.clone(),
            metadata: Some("{\"step\":\"analysis\"}".to_string()),
            created_at: chrono::Utc::now().to_rfc3339(),
        });

        // Step 3: Writer synthesizes conclusions
        let writer_prompt = self.build_system_prompt(
            "Writer",
            "你是一个学术写作专家，擅长将讨论整理成结构化的总结和结论。",
            &ChatContext {
                topic: Some(topic.to_string()),
                ..Default::default()
            },
        ).await;

        let writer_response = self
            .llm
            .chat(vec![
                ChatMessage {
                    role: "system".to_string(),
                    content: writer_prompt,
                },
                ChatMessage {
                    role: "user".to_string(),
                    content: format!(
                        "请将以下讨论整理成结构化的总结：\n\n研究背景：\n{}\n\n分析观点：\n{}",
                        researcher_response, analyst_response
                    ),
                },
            ])
            .await
            .unwrap_or_else(|_| "无法生成总结".to_string());

        discussion.push(AgentConversationDto {
            id: format!("msg-{}", uuid::Uuid::new_v4()),
            task_id: task_id.to_string(),
            agent_name: "Writer".to_string(),
            personality_id: None,
            role: "assistant".to_string(),
            content: writer_response,
            metadata: Some("{\"step\":\"synthesis\"}".to_string()),
            created_at: chrono::Utc::now().to_rfc3339(),
        });

        // Save all discussion messages
        for msg in &discussion {
            let _ = self.db.save_agent_message(msg).await;
        }

        Ok(discussion)
    }

    async fn build_system_prompt(
        &self,
        agent_name: &str,
        personality_prompt: &str,
        context: &ChatContext,
    ) -> String {
        let mut prompt = format!(
            "你是 CiteForge 的 {} Agent。\n{}\n\n",
            agent_name, personality_prompt
        );

        if let Some(topic) = &context.topic {
            prompt.push_str(&format!("当前讨论主题：{}\n", topic));
        }

        // Add relevant literature context if available
        if !context.literature_ids.is_empty() {
            prompt.push_str("\n相关文献：\n");
            for lit_id in &context.literature_ids {
                // Try to load literature details from db
                // Note: We don't have a get_literature_by_id method, so we skip details for now
                prompt.push_str(&format!("- [{}]\n", lit_id));
            }
        }

        // Add relevant notes context if available
        if !context.note_ids.is_empty() {
            prompt.push_str("\n相关笔记：\n");
            for note_id in &context.note_ids {
                if let Ok(Some(note)) = self.db.get_note_by_id(note_id).await {
                    prompt.push_str(&format!("- {}: {}\n", note.title, &note.content[..note.content.len().min(200)]));
                }
            }
        }

        prompt.push_str("\n请使用中文回复。如果引用文献，请使用 [index] 格式。");
        prompt
    }
}
