use crate::error::WorkspaceError;
use citeforge_core::entity::{LiteratureEntry, Task, TaskState};
use uuid::Uuid;
use citeforge_core::event::TaskEvent;
use rusqlite::{params, Connection};
use std::path::Path;
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct LiteratureDto {
    pub id: String,
    pub task_id: String,
    pub title: String,
    pub authors: Vec<String>,
    pub abstract_text: Option<String>,
    pub doi: Option<String>,
    pub year: Option<i32>,
    pub venue: Option<String>,
    pub citation_count: Option<i32>,
    pub file_path: Option<String>,
    pub source: String,
    pub verified: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct NoteDto {
    pub id: String,
    pub task_id: Option<String>,
    pub title: String,
    pub content: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct NoteLinkDto {
    pub id: String,
    pub source_note_id: String,
    pub target_note_id: String,
    pub link_type: String,
    pub created_at: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ReadingProgressDto {
    pub literature_id: String,
    pub task_id: String,
    pub current_page: i32,
    pub total_pages: i32,
    pub read_percentage: f64,
    pub last_read_at: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AgentConversationDto {
    pub id: String,
    pub task_id: String,
    pub agent_name: String,
    pub personality_id: Option<String>,
    pub role: String,
    pub content: String,
    pub metadata: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct LiteratureSectionDto {
    pub id: String,
    pub literature_id: String,
    pub section_id: String,
    pub title: String,
    pub section_type: Option<String>,
    pub page_start: Option<i32>,
    pub page_end: Option<i32>,
    pub content_summary: Option<String>,
    pub extracted_at: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct LiteratureThemeDto {
    pub id: String,
    pub task_id: String,
    pub name: String,
    pub description: Option<String>,
    pub literature_ids: Vec<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct LiteratureNoteDto {
    pub id: String,
    pub note_id: String,
    pub literature_id: String,
    pub page_number: Option<i32>,
    pub section_id: Option<String>,
    pub selection_text: Option<String>,
    pub created_at: String,
}

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

        if current_version < 2 {
            // Add file_path column to literature_entries if not exists
            let _ = conn.execute(
                "ALTER TABLE literature_entries ADD COLUMN file_path TEXT",
                [],
            );
            let migration = include_str!("../../../migrations/002_notes_and_agent.sql");
            conn.execute_batch(migration)?;
            conn.execute(
                "INSERT OR REPLACE INTO schema_version (version) VALUES (2)",
                [],
            )?;
        }

        if current_version < 3 {
            // Add source column to literature_entries if not exists
            let _ = conn.execute(
                "ALTER TABLE literature_entries ADD COLUMN source TEXT NOT NULL DEFAULT 'pdf'",
                [],
            );
            conn.execute(
                "INSERT OR REPLACE INTO schema_version (version) VALUES (3)",
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

    pub async fn save_literature(&self, lit: &LiteratureDto) -> Result<(), WorkspaceError> {
        let conn = self.conn.lock().await;
        let authors_json =
            serde_json::to_string(&lit.authors).map_err(WorkspaceError::serde)?;

        conn.execute(
            "INSERT OR REPLACE INTO literature_entries (id, task_id, sort_order, title, authors, abstract_text, doi, year, venue, citation_count, verified, file_path, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
            params![
                lit.id,
                lit.task_id,
                0,
                lit.title,
                authors_json,
                lit.abstract_text,
                lit.doi,
                lit.year,
                lit.venue,
                lit.citation_count,
                lit.verified as i32,
                lit.file_path,
                lit.created_at,
                chrono::Utc::now().to_rfc3339(),
            ],
        )?;
        Ok(())
    }

    pub async fn copy_to_task(&self, literature_id: &str, task_id: &str) -> Result<LiteratureDto, WorkspaceError> {
        let conn = self.conn.lock().await;

        // Get the source literature
        let mut stmt = conn.prepare(
            "SELECT id, task_id, title, authors, abstract_text, doi, year, venue, citation_count, verified, file_path, source, created_at
             FROM literature_entries WHERE id = ?1",
        )?;

        let source = stmt.query_row(params![literature_id], |row| {
            let authors_json: String = row.get(3)?;
            let authors: Vec<String> = serde_json::from_str(&authors_json).unwrap_or_default();
            Ok(LiteratureDto {
                id: row.get(0)?,
                task_id: row.get(1)?,
                title: row.get(2)?,
                authors,
                abstract_text: row.get(4)?,
                doi: row.get(5)?,
                year: row.get(6)?,
                venue: row.get(7)?,
                citation_count: row.get(8)?,
                verified: row.get::<_, i32>(9)? != 0,
                file_path: row.get(10)?,
                source: row.get(11)?,
                created_at: row.get(12)?,
            })
        }).map_err(|_| WorkspaceError::NotFound(format!("Literature not found")))?;

        // Create a new entry for the task with new ID
        let new_lit = LiteratureDto {
            id: Uuid::new_v4().to_string(),
            task_id: task_id.to_string(),
            title: source.title,
            authors: source.authors,
            abstract_text: source.abstract_text,
            doi: source.doi,
            year: source.year,
            venue: source.venue,
            citation_count: source.citation_count,
            file_path: source.file_path,
            source: source.source,
            verified: source.verified,
            created_at: chrono::Utc::now().to_rfc3339(),
        };

        drop(stmt);

        // Save the new entry
        let authors_json = serde_json::to_string(&new_lit.authors).map_err(WorkspaceError::serde)?;
        conn.execute(
            "INSERT INTO literature_entries (id, task_id, sort_order, title, authors, abstract_text, doi, year, venue, citation_count, verified, file_path, source, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
            params![
                new_lit.id,
                new_lit.task_id,
                0,
                new_lit.title,
                authors_json,
                new_lit.abstract_text,
                new_lit.doi,
                new_lit.year,
                new_lit.venue,
                new_lit.citation_count,
                new_lit.verified as i32,
                new_lit.file_path,
                new_lit.source,
                new_lit.created_at,
                chrono::Utc::now().to_rfc3339(),
            ],
        )?;

        Ok(new_lit)
    }

    pub async fn get_literature_by_task(
        &self,
        task_id: &str,
    ) -> Result<Vec<LiteratureDto>, WorkspaceError> {
        let conn = self.conn.lock().await;
        let mut stmt = conn.prepare(
            "SELECT id, task_id, title, authors, abstract_text, doi, year, venue, citation_count, verified, file_path, source, created_at
             FROM literature_entries WHERE task_id = ?1 ORDER BY sort_order ASC",
        )?;

        let rows = stmt.query_map(params![task_id], |row| {
            let authors_json: String = row.get(3)?;
            let authors: Vec<String> =
                serde_json::from_str(&authors_json).unwrap_or_default();
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                authors,
                row.get::<_, Option<String>>(4)?,
                row.get::<_, Option<String>>(5)?,
                row.get::<_, Option<i32>>(6)?,
                row.get::<_, Option<String>>(7)?,
                row.get::<_, Option<i32>>(8)?,
                row.get::<_, i32>(9)? != 0,
                row.get::<_, Option<String>>(10)?,
                row.get::<_, String>(11)?,
                row.get::<_, String>(12)?,
            ))
        })?;

        let entries: Vec<LiteratureDto> = rows
            .filter_map(|r| r.ok())
            .map(
                |(id, task_id, title, authors, abstract_text, doi, year, venue, citation_count, verified, file_path, source, created_at)| {
                    LiteratureDto {
                        id,
                        task_id,
                        title,
                        authors,
                        abstract_text,
                        doi,
                        year,
                        venue,
                        citation_count,
                        file_path,
                        source,
                        verified,
                        created_at,
                    }
                },
            )
            .collect();

        Ok(entries)
    }

    pub async fn get_global_literature(&self) -> Result<Vec<LiteratureDto>, WorkspaceError> {
        let conn = self.conn.lock().await;
        let mut stmt = conn.prepare(
            "SELECT id, task_id, title, authors, abstract_text, doi, year, venue, citation_count, verified, file_path, source, created_at
             FROM literature_entries WHERE task_id IS NULL OR task_id = '' ORDER BY sort_order ASC",
        )?;

        let rows = stmt.query_map([], |row| {
            let authors_json: String = row.get(3)?;
            let authors: Vec<String> =
                serde_json::from_str(&authors_json).unwrap_or_default();
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, Option<String>>(1)?,
                row.get::<_, String>(2)?,
                authors,
                row.get::<_, Option<String>>(4)?,
                row.get::<_, Option<String>>(5)?,
                row.get::<_, Option<i32>>(6)?,
                row.get::<_, Option<String>>(7)?,
                row.get::<_, Option<i32>>(8)?,
                row.get::<_, i32>(9)? != 0,
                row.get::<_, Option<String>>(10)?,
                row.get::<_, String>(11)?,
                row.get::<_, String>(12)?,
            ))
        })?;

        let entries: Vec<LiteratureDto> = rows
            .filter_map(|r| r.ok())
            .map(
                |(id, task_id, title, authors, abstract_text, doi, year, venue, citation_count, verified, file_path, source, created_at)| {
                    LiteratureDto {
                        id,
                        task_id: task_id.unwrap_or_default(),
                        title,
                        authors,
                        abstract_text,
                        doi,
                        year,
                        venue,
                        citation_count,
                        file_path,
                        source,
                        verified,
                        created_at,
                    }
                },
            )
            .collect();

        Ok(entries)
    }

    // ===================== NOTES =====================

    pub async fn save_note(&self, note: &NoteDto) -> Result<(), WorkspaceError> {
        let conn = self.conn.lock().await;
        conn.execute(
            "INSERT OR REPLACE INTO notes (id, task_id, title, content, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                note.id,
                note.task_id,
                note.title,
                note.content,
                note.created_at,
                note.updated_at,
            ],
        )?;
        Ok(())
    }

    pub async fn get_notes(&self, task_id: Option<&str>) -> Result<Vec<NoteDto>, WorkspaceError> {
        let conn = self.conn.lock().await;
        let notes = if let Some(tid) = task_id {
            let mut stmt = conn.prepare("SELECT id, task_id, title, content, created_at, updated_at FROM notes WHERE task_id = ?1 ORDER BY updated_at DESC")?;
            let rows = stmt.query_map(params![tid], |row| {
                Ok(NoteDto {
                    id: row.get(0)?,
                    task_id: row.get(1)?,
                    title: row.get(2)?,
                    content: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            })?;
            rows.filter_map(|r| r.ok()).collect()
        } else {
            let mut stmt = conn.prepare("SELECT id, task_id, title, content, created_at, updated_at FROM notes ORDER BY updated_at DESC")?;
            let rows = stmt.query_map([], |row| {
                Ok(NoteDto {
                    id: row.get(0)?,
                    task_id: row.get(1)?,
                    title: row.get(2)?,
                    content: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            })?;
            rows.filter_map(|r| r.ok()).collect()
        };

        Ok(notes)
    }

    pub async fn get_note_by_id(&self, note_id: &str) -> Result<Option<NoteDto>, WorkspaceError> {
        let conn = self.conn.lock().await;
        let mut stmt = conn.prepare(
            "SELECT id, task_id, title, content, created_at, updated_at FROM notes WHERE id = ?1",
        )?;

        let result = stmt.query_row(params![note_id], |row| {
            Ok(NoteDto {
                id: row.get(0)?,
                task_id: row.get(1)?,
                title: row.get(2)?,
                content: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        });

        match result {
            Ok(note) => Ok(Some(note)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    pub async fn delete_note(&self, note_id: &str) -> Result<(), WorkspaceError> {
        let conn = self.conn.lock().await;
        conn.execute("DELETE FROM notes WHERE id = ?1", params![note_id])?;
        Ok(())
    }

    pub async fn search_notes(&self, query: &str) -> Result<Vec<NoteDto>, WorkspaceError> {
        let conn = self.conn.lock().await;
        let like = format!("%{}%", query);
        let mut stmt = conn.prepare(
            "SELECT id, task_id, title, content, created_at, updated_at FROM notes WHERE title LIKE ?1 OR content LIKE ?1 ORDER BY updated_at DESC",
        )?;

        let rows = stmt.query_map(params![&like], |row| {
            Ok(NoteDto {
                id: row.get(0)?,
                task_id: row.get(1)?,
                title: row.get(2)?,
                content: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })?;

        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    // ===================== NOTE LINKS =====================

    pub async fn create_note_link(&self, link: &NoteLinkDto) -> Result<(), WorkspaceError> {
        let conn = self.conn.lock().await;
        conn.execute(
            "INSERT OR IGNORE INTO note_links (id, source_note_id, target_note_id, link_type, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                link.id,
                link.source_note_id,
                link.target_note_id,
                link.link_type,
                link.created_at,
            ],
        )?;
        Ok(())
    }

    pub async fn delete_note_link(&self, source_id: &str, target_id: &str) -> Result<(), WorkspaceError> {
        let conn = self.conn.lock().await;
        conn.execute(
            "DELETE FROM note_links WHERE source_note_id = ?1 AND target_note_id = ?2",
            params![source_id, target_id],
        )?;
        Ok(())
    }

    pub async fn get_note_links(&self, note_id: &str) -> Result<Vec<NoteLinkDto>, WorkspaceError> {
        let conn = self.conn.lock().await;
        let mut stmt = conn.prepare(
            "SELECT id, source_note_id, target_note_id, link_type, created_at FROM note_links WHERE source_note_id = ?1",
        )?;

        let rows = stmt.query_map(params![note_id], |row| {
            Ok(NoteLinkDto {
                id: row.get(0)?,
                source_note_id: row.get(1)?,
                target_note_id: row.get(2)?,
                link_type: row.get(3)?,
                created_at: row.get(4)?,
            })
        })?;

        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub async fn get_note_backlinks(&self, note_id: &str) -> Result<Vec<NoteLinkDto>, WorkspaceError> {
        let conn = self.conn.lock().await;
        let mut stmt = conn.prepare(
            "SELECT id, source_note_id, target_note_id, link_type, created_at FROM note_links WHERE target_note_id = ?1",
        )?;

        let rows = stmt.query_map(params![note_id], |row| {
            Ok(NoteLinkDto {
                id: row.get(0)?,
                source_note_id: row.get(1)?,
                target_note_id: row.get(2)?,
                link_type: row.get(3)?,
                created_at: row.get(4)?,
            })
        })?;

        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    // ===================== READING PROGRESS =====================

    pub async fn save_reading_progress(&self, progress: &ReadingProgressDto) -> Result<(), WorkspaceError> {
        let conn = self.conn.lock().await;
        conn.execute(
            "INSERT OR REPLACE INTO reading_progress (literature_id, task_id, current_page, total_pages, read_percentage, last_read_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                progress.literature_id,
                progress.task_id,
                progress.current_page,
                progress.total_pages,
                progress.read_percentage,
                progress.last_read_at,
            ],
        )?;
        Ok(())
    }

    pub async fn get_reading_progress(&self, literature_id: &str) -> Result<Option<ReadingProgressDto>, WorkspaceError> {
        let conn = self.conn.lock().await;
        let mut stmt = conn.prepare(
            "SELECT literature_id, task_id, current_page, total_pages, read_percentage, last_read_at FROM reading_progress WHERE literature_id = ?1",
        )?;

        let result = stmt.query_row(params![literature_id], |row| {
            Ok(ReadingProgressDto {
                literature_id: row.get(0)?,
                task_id: row.get(1)?,
                current_page: row.get(2)?,
                total_pages: row.get(3)?,
                read_percentage: row.get(4)?,
                last_read_at: row.get(5)?,
            })
        });

        match result {
            Ok(p) => Ok(Some(p)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    // ===================== AGENT CONVERSATIONS =====================

    pub async fn save_agent_message(&self, msg: &AgentConversationDto) -> Result<(), WorkspaceError> {
        let conn = self.conn.lock().await;
        conn.execute(
            "INSERT INTO agent_conversations (id, task_id, agent_name, personality_id, role, content, metadata, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                msg.id,
                msg.task_id,
                msg.agent_name,
                msg.personality_id,
                msg.role,
                msg.content,
                msg.metadata,
                msg.created_at,
            ],
        )?;
        Ok(())
    }

    pub async fn get_agent_conversation(
        &self,
        task_id: &str,
        agent_name: Option<&str>,
        limit: Option<i64>,
    ) -> Result<Vec<AgentConversationDto>, WorkspaceError> {
        let conn = self.conn.lock().await;
        let (sql, params_vec): (String, Vec<Box<dyn rusqlite::ToSql>>) = if let Some(name) = agent_name {
            let sql = format!(
                "SELECT id, task_id, agent_name, personality_id, role, content, metadata, created_at FROM agent_conversations WHERE task_id = ?1 AND agent_name = ?2 ORDER BY created_at DESC LIMIT {}",
                limit.unwrap_or(100)
            );
            (sql, vec![Box::new(task_id.to_string()), Box::new(name.to_string())])
        } else {
            let sql = format!(
                "SELECT id, task_id, agent_name, personality_id, role, content, metadata, created_at FROM agent_conversations WHERE task_id = ?1 ORDER BY created_at DESC LIMIT {}",
                limit.unwrap_or(100)
            );
            (sql, vec![Box::new(task_id.to_string())])
        };

        let mut stmt = conn.prepare(&sql)?;
        let param_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
        let rows = stmt.query_map(&*param_refs, |row| {
            Ok(AgentConversationDto {
                id: row.get(0)?,
                task_id: row.get(1)?,
                agent_name: row.get(2)?,
                personality_id: row.get(3)?,
                role: row.get(4)?,
                content: row.get(5)?,
                metadata: row.get(6)?,
                created_at: row.get(7)?,
            })
        })?;

        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    // ===================== LITERATURE SECTIONS =====================

    pub async fn save_literature_sections(
        &self,
        literature_id: &str,
        sections: &[LiteratureSectionDto],
    ) -> Result<(), WorkspaceError> {
        let conn = self.conn.lock().await;
        // Clear old sections for this literature
        conn.execute(
            "DELETE FROM literature_sections WHERE literature_id = ?1",
            params![literature_id],
        )?;

        for section in sections {
            conn.execute(
                "INSERT INTO literature_sections (id, literature_id, section_id, title, section_type, page_start, page_end, content_summary, extracted_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                params![
                    section.id,
                    section.literature_id,
                    section.section_id,
                    section.title,
                    section.section_type,
                    section.page_start,
                    section.page_end,
                    section.content_summary,
                    section.extracted_at,
                ],
            )?;
        }
        Ok(())
    }

    pub async fn get_literature_sections(&self, literature_id: &str) -> Result<Vec<LiteratureSectionDto>, WorkspaceError> {
        let conn = self.conn.lock().await;
        let mut stmt = conn.prepare(
            "SELECT id, literature_id, section_id, title, section_type, page_start, page_end, content_summary, extracted_at FROM literature_sections WHERE literature_id = ?1 ORDER BY page_start ASC",
        )?;

        let rows = stmt.query_map(params![literature_id], |row| {
            Ok(LiteratureSectionDto {
                id: row.get(0)?,
                literature_id: row.get(1)?,
                section_id: row.get(2)?,
                title: row.get(3)?,
                section_type: row.get(4)?,
                page_start: row.get(5)?,
                page_end: row.get(6)?,
                content_summary: row.get(7)?,
                extracted_at: row.get(8)?,
            })
        })?;

        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    // ===================== LITERATURE THEMES =====================

    pub async fn save_themes(
        &self,
        task_id: &str,
        themes: &[LiteratureThemeDto],
    ) -> Result<(), WorkspaceError> {
        let conn = self.conn.lock().await;
        conn.execute(
            "DELETE FROM literature_themes WHERE task_id = ?1",
            params![task_id],
        )?;

        for theme in themes {
            let literature_ids_json = serde_json::to_string(&theme.literature_ids).map_err(WorkspaceError::serde)?;
            conn.execute(
                "INSERT INTO literature_themes (id, task_id, name, description, literature_ids, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![
                    theme.id,
                    theme.task_id,
                    theme.name,
                    theme.description,
                    literature_ids_json,
                    theme.created_at,
                ],
            )?;
        }
        Ok(())
    }

    pub async fn get_themes(&self, task_id: &str) -> Result<Vec<LiteratureThemeDto>, WorkspaceError> {
        let conn = self.conn.lock().await;
        let mut stmt = conn.prepare(
            "SELECT id, task_id, name, description, literature_ids, created_at FROM literature_themes WHERE task_id = ?1",
        )?;

        let rows = stmt.query_map(params![task_id], |row| {
            let literature_ids_json: String = row.get(4)?;
            let literature_ids: Vec<String> =
                serde_json::from_str(&literature_ids_json).unwrap_or_default();
            Ok(LiteratureThemeDto {
                id: row.get(0)?,
                task_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                literature_ids,
                created_at: row.get(5)?,
            })
        })?;

        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    // ===================== LITERATURE NOTES (note-literature junction) =====================

    pub async fn link_note_to_literature(&self, link: &LiteratureNoteDto) -> Result<(), WorkspaceError> {
        let conn = self.conn.lock().await;
        conn.execute(
            "INSERT OR REPLACE INTO literature_notes (id, note_id, literature_id, page_number, section_id, selection_text, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                link.id,
                link.note_id,
                link.literature_id,
                link.page_number,
                link.section_id,
                link.selection_text,
                link.created_at,
            ],
        )?;
        Ok(())
    }

    pub async fn get_notes_by_literature(&self, literature_id: &str) -> Result<Vec<LiteratureNoteDto>, WorkspaceError> {
        let conn = self.conn.lock().await;
        let mut stmt = conn.prepare(
            "SELECT id, note_id, literature_id, page_number, section_id, selection_text, created_at FROM literature_notes WHERE literature_id = ?1",
        )?;

        let rows = stmt.query_map(params![literature_id], |row| {
            Ok(LiteratureNoteDto {
                id: row.get(0)?,
                note_id: row.get(1)?,
                literature_id: row.get(2)?,
                page_number: row.get(3)?,
                section_id: row.get(4)?,
                selection_text: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?;

        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub async fn get_literature_by_note(&self, note_id: &str) -> Result<Vec<LiteratureNoteDto>, WorkspaceError> {
        let conn = self.conn.lock().await;
        let mut stmt = conn.prepare(
            "SELECT id, note_id, literature_id, page_number, section_id, selection_text, created_at FROM literature_notes WHERE note_id = ?1",
        )?;

        let rows = stmt.query_map(params![note_id], |row| {
            Ok(LiteratureNoteDto {
                id: row.get(0)?,
                note_id: row.get(1)?,
                literature_id: row.get(2)?,
                page_number: row.get(3)?,
                section_id: row.get(4)?,
                selection_text: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?;

        Ok(rows.filter_map(|r| r.ok()).collect())
    }
}
