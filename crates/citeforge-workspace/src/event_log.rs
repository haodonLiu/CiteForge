use crate::error::WorkspaceError;
use citeforge_core::event::AgentEvent;
use std::fs::{self, OpenOptions};
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use tokio::sync::Mutex;

pub struct EventLog {
    path: PathBuf,
    writer: Mutex<()>,
}

impl EventLog {
    pub fn new(workspace_root: &Path, task_id: &str) -> Self {
        let path = workspace_root.join(task_id).join("events.log");
        Self {
            path,
            writer: Mutex::new(()),
        }
    }

    pub async fn append(&self, event: &AgentEvent) -> Result<(), WorkspaceError> {
        let _guard = self.writer.lock().await;
        // Create parent directory if it doesn't exist
        if let Some(parent) = self.path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| WorkspaceError::Serde(format!("failed to create directory: {}", e)))?;
        }
        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&self.path)
            .map_err(|e| WorkspaceError::Serde(format!("failed to open events.log: {}", e)))?;

        let line =
            serde_json::to_string(event).map_err(|e| WorkspaceError::Serde(e.to_string()))?;
        writeln!(file, "{}", line)
            .map_err(|e| WorkspaceError::Serde(format!("failed to write event: {}", e)))?;
        Ok(())
    }

    pub async fn load_all(&self) -> Result<Vec<AgentEvent>, WorkspaceError> {
        if !self.path.exists() {
            return Ok(vec![]);
        }

        let file = fs::File::open(&self.path)
            .map_err(|e| WorkspaceError::Serde(format!("failed to open events.log: {}", e)))?;
        let reader = BufReader::new(file);

        let mut events = Vec::new();
        for line in reader.lines() {
            let line = line.map_err(|e| WorkspaceError::Serde(e.to_string()))?;
            if line.trim().is_empty() {
                continue;
            }
            let event: AgentEvent = serde_json::from_str(&line)
                .map_err(|e| WorkspaceError::Serde(format!("failed to parse event: {}", e)))?;
            events.push(event);
        }
        Ok(events)
    }

    pub async fn load_since(&self, after_id: &str) -> Result<Vec<AgentEvent>, WorkspaceError> {
        let all = self.load_all().await?;
        let found = all.iter().position(|e| e.id == after_id);
        match found {
            Some(idx) => Ok(all.into_iter().skip(idx + 1).collect()),
            None => Ok(all),
        }
    }

    pub async fn last_event_id(&self) -> Result<Option<String>, WorkspaceError> {
        let events = self.load_all().await?;
        Ok(events.last().map(|e| e.id.clone()))
    }
}
