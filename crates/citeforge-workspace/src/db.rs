use rusqlite::{Connection, params};
use std::path::Path;
use std::sync::Arc;
use tokio::sync::Mutex;
use thiserror::Error;
use crate::error::WorkspaceError;
use citeforge_core::entity::{Task, TaskState, LiteratureEntry};
use citeforge_core::event::TaskEvent;

pub struct Database {
    conn: Arc<Mutex<Connection>>,
}

impl Database {
    pub async fn new(root: &Path) -> Result<Self, WorkspaceError> {
        let db_path = root.join("citeforge.db");
        let conn = Connection::open(&db_path)?;

        Self::run_migrations(&conn)?;

        Ok(Self { conn: Arc::new(Mutex::new(conn)) })
    }

    fn run_migrations(conn: &Connection) -> Result<(), WorkspaceError> {
        conn.execute(
            "CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY)",
            [],
        )?;

        let version: Option<i64> = conn
            .query_row("SELECT version FROM schema_version LIMIT 1", [], |row| row.get(0))
            .ok();

        let current_version = version.unwrap_or(0);

        if current_version < 1 {
            let migration = include_str!("../../../migrations/001_initial.sql");
            conn.execute_batch(migration)?;
            conn.execute(
                "INSERT OR REPLACE INTO schema_version (version) VALUES (1)",
                [],
            )?;
        }

        Ok(())
    }

    pub async fn save_task(&self, task: &Task) -> Result<(), WorkspaceError> {
        let conn = self.conn.lock().await;
        conn.execute(
            "INSERT OR REPLACE INTO tasks (id, topic, state, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                task.id,
                task.topic,
                serde_json::to_string(&task.state).unwrap(),
                task.created_at.to_rfc3339(),
                task.updated_at.to_rfc3339(),
            ],
        )?;
        Ok(())
    }

    pub async fn get_task(&self, id: &str) -> Result<Task, WorkspaceError> {
        let conn = self.conn.lock().await;
        let mut stmt = conn.prepare(
            "SELECT id, topic, state, created_at, updated_at FROM tasks WHERE id = ?1"
        )?;

        let task = stmt.query_row(params![id], |row| {
            let state_json: String = row.get(2)?;
            let state: TaskState = serde_json::from_str(&state_json).unwrap();
            Ok(Task {
                id: row.get(0)?,
                topic: row.get(1)?,
                state,
                created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(3)?).unwrap().with_timezone(&chrono::Utc),
                updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(4)?).unwrap().with_timezone(&chrono::Utc),
            })
        }).map_err(|_| WorkspaceError::TaskNotFound(id.to_string()))?;

        Ok(task)
    }

    pub async fn append_event(&self, task_id: &str, event: &TaskEvent) -> Result<(), WorkspaceError> {
        let conn = self.conn.lock().await;
        let payload = serde_json::to_string(event).unwrap();
        let event_type = format!("{:?}", event);
        conn.execute(
            "INSERT INTO task_events (task_id, event_type, payload, created_at) VALUES (?1, ?2, ?3, ?4)",
            params![
                task_id,
                event_type,
                payload,
                chrono::Utc::now().to_rfc3339(),
            ],
        )?;
        Ok(())
    }

    pub async fn get_events(&self, task_id: &str) -> Result<Vec<TaskEvent>, WorkspaceError> {
        let conn = self.conn.lock().await;
        let mut stmt = conn.prepare(
            "SELECT payload FROM task_events WHERE task_id = ?1 ORDER BY created_at ASC"
        )?;

        let events = stmt.query_map(params![task_id], |row| {
            let payload: String = row.get(0)?;
            Ok(serde_json::from_str(&payload).unwrap())
        })?.collect::<Result<Vec<_>, _>>()?;

        Ok(events)
    }

    pub async fn export_json(&self, task_id: &str) -> Result<String, WorkspaceError> {
        let conn = self.conn.lock().await;
        let mut stmt = conn.prepare(
            "SELECT id, index, title, authors, abstract_text, doi, year, venue, citation_count, verified FROM literature_entries WHERE task_id = ?1"
        )?;

        let entries = stmt.query_map(params![task_id], |row| {
            Ok(LiteratureEntry {
                id: row.get(0)?,
                index: row.get(1)?,
                title: row.get(2)?,
                authors: serde_json::from_str(&row.get::<_, String>(3)?).unwrap(),
                abstract_text: row.get(4)?,
                doi: row.get(5)?,
                year: row.get(6)?,
                venue: row.get(7)?,
                citation_count: row.get(8)?,
                verified: row.get::<_, i32>(9)? != 0,
            })
        })?.collect::<Result<Vec<_>, _>>()?;

        Ok(serde_json::to_string_pretty(&entries).unwrap())
    }
}
