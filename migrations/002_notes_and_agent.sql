-- Migration 002: Notes, reading progress, agent conversations, literature sections, themes

CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    task_id TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notes_task ON notes(task_id);

CREATE TABLE IF NOT EXISTS note_links (
    id TEXT PRIMARY KEY,
    source_note_id TEXT NOT NULL,
    target_note_id TEXT NOT NULL,
    link_type TEXT NOT NULL DEFAULT 'reference',
    created_at TEXT NOT NULL,
    FOREIGN KEY (source_note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (target_note_id) REFERENCES notes(id) ON DELETE CASCADE,
    UNIQUE(source_note_id, target_note_id)
);

CREATE INDEX IF NOT EXISTS idx_note_links_source ON note_links(source_note_id);
CREATE INDEX IF NOT EXISTS idx_note_links_target ON note_links(target_note_id);

CREATE TABLE IF NOT EXISTS reading_progress (
    literature_id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    current_page INTEGER NOT NULL DEFAULT 1,
    total_pages INTEGER NOT NULL DEFAULT 0,
    read_percentage REAL NOT NULL DEFAULT 0.0,
    last_read_at TEXT,
    FOREIGN KEY (literature_id) REFERENCES literature_entries(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reading_progress_task ON reading_progress(task_id);

CREATE TABLE IF NOT EXISTS agent_conversations (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    personality_id TEXT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_conv_task ON agent_conversations(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_conv_agent ON agent_conversations(task_id, agent_name);

CREATE TABLE IF NOT EXISTS literature_sections (
    id TEXT PRIMARY KEY,
    literature_id TEXT NOT NULL,
    section_id TEXT NOT NULL,
    title TEXT NOT NULL,
    section_type TEXT,
    page_start INTEGER,
    page_end INTEGER,
    content_summary TEXT,
    extracted_at TEXT NOT NULL,
    FOREIGN KEY (literature_id) REFERENCES literature_entries(id) ON DELETE CASCADE,
    UNIQUE(literature_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_lit_sections_lit ON literature_sections(literature_id);

CREATE TABLE IF NOT EXISTS literature_themes (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    literature_ids TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_themes_task ON literature_themes(task_id);

CREATE TABLE IF NOT EXISTS literature_notes (
    id TEXT PRIMARY KEY,
    note_id TEXT NOT NULL,
    literature_id TEXT NOT NULL,
    page_number INTEGER,
    section_id TEXT,
    selection_text TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (literature_id) REFERENCES literature_entries(id) ON DELETE CASCADE,
    UNIQUE(note_id, literature_id, page_number, section_id)
);

CREATE INDEX IF NOT EXISTS idx_lit_notes_note ON literature_notes(note_id);
CREATE INDEX IF NOT EXISTS idx_lit_notes_lit ON literature_notes(literature_id);
