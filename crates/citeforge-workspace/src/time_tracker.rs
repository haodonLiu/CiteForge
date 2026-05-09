use serde::{Deserialize, Serialize};
use std::path::Path;
use tokio::fs;
use tokio::sync::RwLock;
use std::collections::HashMap;
use chrono::Local;

use crate::error::WorkspaceError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeRecords {
    pub entries: HashMap<String, u32>, // date string -> minutes
}

impl Default for TimeRecords {
    fn default() -> Self {
        Self { entries: HashMap::new() }
    }
}

#[derive(Debug)]
pub struct TimeTracker {
    records: RwLock<TimeRecords>,
    file_path: std::path::PathBuf,
    is_tracking: RwLock<bool>,
    last_tick: RwLock<Option<chrono::DateTime<chrono::Local>>>,
}

impl TimeTracker {
    pub async fn new(root: &Path) -> Result<Self, WorkspaceError> {
        let file_path = root.join("time_records.json");
        let records = Self::load_from_file(&file_path).await.unwrap_or_default();

        Ok(Self {
            records: RwLock::new(records),
            file_path,
            is_tracking: RwLock::new(false),
            last_tick: RwLock::new(None),
        })
    }

    async fn load_from_file(path: &Path) -> Option<TimeRecords> {
        let content = fs::read_to_string(path).await.ok()?;
        serde_json::from_str(&content).ok()
    }

    async fn save_to_file(&self) -> Result<(), WorkspaceError> {
        let records = self.records.read().await;
        let json = serde_json::to_string_pretty(&*records)
            .map_err(WorkspaceError::serde)?;
        fs::write(&self.file_path, json).await
            .map_err(|e| WorkspaceError::io(e))?;
        Ok(())
    }

    fn today_key() -> String {
        Local::now().format("%Y-%m-%d").to_string()
    }

    pub async fn start_tracking(&self) -> bool {
        let mut tracking = self.is_tracking.write().await;
        if *tracking {
            return false;
        }
        *tracking = true;
        *self.last_tick.write().await = Some(Local::now());
        tracing::debug!("time tracking started");
        true
    }

    pub async fn stop_tracking(&self) -> bool {
        let mut tracking = self.is_tracking.write().await;
        if !*tracking {
            return false;
        }

        // Add elapsed minutes
        let last = self.last_tick.read().await;
        if let Some(last_time) = *last {
            let elapsed = (Local::now() - last_time).num_minutes() as u32;
            if elapsed > 0 {
                let mut records = self.records.write().await;
                let key = Self::today_key();
                *records.entries.entry(key).or_insert(0) += elapsed;
            }
        }

        *tracking = false;
        *self.last_tick.write().await = None;
        tracing::debug!("time tracking stopped");
        true
    }

    pub async fn tick(&self) -> Option<u32> {
        let tracking = self.is_tracking.read().await;
        if !*tracking {
            return None;
        }

        let mut last = self.last_tick.write().await;
        let now = Local::now();

        if let Some(last_time) = *last {
            let elapsed = (now - last_time).num_minutes() as u32;
            if elapsed >= 1 {
                // Update records
                let mut records = self.records.write().await;
                let key = Self::today_key();
                *records.entries.entry(key).or_insert(0) += 1;
                *last = Some(now);

                // Save periodically (every 5 minutes)
                if elapsed % 5 == 0 {
                    drop(records);
                    let _ = self.save_to_file().await;
                }

                return Some(1);
            }
        } else {
            *last = Some(now);
        }

        None
    }

    pub async fn get_today_minutes(&self) -> u32 {
        let records = self.records.read().await;
        let key = Self::today_key();
        records.entries.get(&key).copied().unwrap_or(0)
    }

    pub async fn is_tracking(&self) -> bool {
        *self.is_tracking.read().await
    }

    pub async fn get_all_records(&self) -> HashMap<String, u32> {
        let records = self.records.read().await;
        records.entries.clone()
    }
}