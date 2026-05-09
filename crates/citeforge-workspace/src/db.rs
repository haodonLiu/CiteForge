use crate::error::WorkspaceError;
use citeforge_core::entity::{LiteratureEntry, Task, TaskState};
use citeforge_core::event::TaskEvent;
use rusqlite::{params, Connection};
use std::path::Path;
use std::sync::Arc;
use tokio::sync::Mutex;

pub struct Database {
    conn: Arc<Mutex<Connection>>,
}

impl Database {
    pub async fn new(root: &Path) -> Result<Self, WorkspaceError> {
        let db_path = root.join("citeforge.db");
        let conn = Connection::open(&db_path)?;

        Self::run_migrations(&conn)?;

        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
        })
    }

    fn run_migrations(conn: &Connection) -> Result<(), WorkspaceError> {
        conn.execute(
            "CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY)",
            [],
        )?;

        let version: Option<i64> = conn
            .query_row("SELECT version FROM schema_version LIMIT 1", [], |row| {
                row.get(0)
            })
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
                serde_json::to_string(&task.state).map_err(WorkspaceError::serde)?,
                task.created_at.to_rfc3339(),
                task.updated_at.to_rfc3339(),
            ],
        )?;
        Ok(())
    }

    pub async fn get_task(&self, id: &str) -> Result<Task, WorkspaceError> {
        let conn = self.conn.lock().await;
        let mut stmt = conn
            .prepare("SELECT id, topic, state, created_at, updated_at FROM tasks WHERE id = ?1")?;

        let (id, topic, state_json, created_at_str, updated_at_str): (
            String,
            String,
            String,
            String,
            String,
        ) = stmt
            .query_row(params![id], |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                ))
            })
            .map_err(|_| WorkspaceError::TaskNotFound(id.to_string()))?;

        let state: TaskState = serde_json::from_str(&state_json).map_err(WorkspaceError::serde)?;
        let created_at = chrono::DateTime::parse_from_rfc3339(&created_at_str)
            .map_err(WorkspaceError::chrono)?
            .with_timezone(&chrono::Utc);
        let updated_at = chrono::DateTime::parse_from_rfc3339(&updated_at_str)
            .map_err(WorkspaceError::chrono)?
            .with_timezone(&chrono::Utc);

        Ok(Task {
            id,
            topic,
            state,
            created_at,
            updated_at,
        })
    }

    pub async fn append_event(
        &self,
        task_id: &str,
        event: &TaskEvent,
    ) -> Result<(), WorkspaceError> {
        let conn = self.conn.lock().await;
        let payload = serde_json::to_string(event).map_err(WorkspaceError::serde)?;
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
            "SELECT payload FROM task_events WHERE task_id = ?1 ORDER BY created_at ASC",
        )?;

        let payloads: Vec<String> = stmt
            .query_map(params![task_id], |row| row.get(0))?
            .collect::<Result<Vec<_>, _>>()?;

        let events = payloads
            .iter()
            .map(|p| serde_json::from_str(p).map_err(WorkspaceError::serde))
            .collect::<Result<Vec<_>, _>>()?;

        Ok(events)
    }

    pub async fn export_json(&self, task_id: &str) -> Result<String, WorkspaceError> {
        let conn = self.conn.lock().await;
        let mut stmt = conn.prepare(
            "SELECT id, sort_order, title, authors, abstract_text, doi, year, venue, citation_count, verified FROM literature_entries WHERE task_id = ?1"
        )?;

        type LiteratureRow = (
            String,
            i32,
            String,
            String,
            Option<String>,
            Option<String>,
            Option<i32>,
            Option<String>,
            Option<i32>,
            bool,
        );

        let rows: Vec<LiteratureRow> = stmt
            .query_map(params![task_id], |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get::<_, String>(3)?,
                    row.get(4)?,
                    row.get(5)?,
                    row.get(6)?,
                    row.get(7)?,
                    row.get(8)?,
                    row.get::<_, i32>(9)? != 0,
                ))
            })?
            .collect::<Result<Vec<_>, _>>()?;

        let entries = rows
            .into_iter()
            .map(|r| {
                let authors: Vec<String> =
                    serde_json::from_str(&r.3).map_err(WorkspaceError::serde)?;
                Ok(LiteratureEntry {
                    id: r.0,
                    sort_order: r.1,
                    title: r.2,
                    authors,
                    abstract_text: r.4,
                    doi: r.5,
                    year: r.6,
                    venue: r.7,
                    citation_count: r.8,
                    verified: r.9,
                })
            })
            .collect::<Result<Vec<_>, WorkspaceError>>()?;

        serde_json::to_string_pretty(&entries).map_err(WorkspaceError::serde)
    }
}
