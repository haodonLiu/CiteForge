use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum EventSource {
    Orchestrator,
    Researcher,
    Analyst,
    Writer,
    Human,
    System,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum EventType {
    // === Researcher 事件 ===
    ResearchStarted,
    PaperDiscovered,
    ResearchCompleted,
    ResearchFailed,

    // === Analyst 事件 ===
    AnalysisStarted,
    ThemeExtracted,
    SimilarityComputed,
    GapIdentified,
    AnalysisCompleted,

    // === Writer 事件 ===
    WritingStarted,
    SectionDrafted,
    CitationResolved,
    CitationUnresolved,

    // === Checkpoint / HITL 事件 ===
    CheckpointReached,
    HumanDecision,
    EmergencyResearchTriggered,
    EmergencyResearchCompleted,

    // === 系统事件 ===
    StateTransition,
    ErrorOccurred,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentEvent {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub source: EventSource,
    pub event_type: EventType,
    pub payload: serde_json::Value,
    pub requires_action: bool,
}

impl AgentEvent {
    pub fn new(source: EventSource, event_type: EventType, payload: serde_json::Value, requires_action: bool) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            timestamp: Utc::now(),
            source,
            event_type,
            payload,
            requires_action,
        }
    }

    pub fn requires_action(mut self, requires: bool) -> Self {
        self.requires_action = requires;
        self
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum GapSeverity {
    Minor,    // <3 篇，自动回退
    Major,    // ≥3 篇，Checkpoint 暂停
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum HumanDecision {
    Proceed,
    Retry,
    AddPapers { query: String },
    ReorderThemes { flow: Vec<String> },
    RewriteSection { section: String, notes: String },
    AcceptWithGaps,
    Abort { reason: String },
}
