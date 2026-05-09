CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    topic TEXT NOT NULL,
    state TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS literature_entries (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    title TEXT NOT NULL,
    authors TEXT NOT NULL,
    abstract_text TEXT,
    doi TEXT,
    year INTEGER,
    venue TEXT,
    citation_count INTEGER,
    verified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS task_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE INDEX IF NOT EXISTS idx_literature_task ON literature_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_events_task ON task_events(task_id);
