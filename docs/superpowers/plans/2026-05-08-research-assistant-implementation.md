# CiteForge 研究助手终端实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 CiteForge 从文献管理工具转型为自带 Agent 的科研助手终端，支持 PDF 阅读批注、Markdown/LaTeX 编辑、文献管理、WASM 插件、本地记忆、多主题。

**Architecture:** 增量扩展现有 Tauri + Next.js 架构。后端新增 3 个 crate（theme、memory、plugin），前端重构为多页面布局。复用现有 Agent pipeline、LLM provider、检索系统。

**Tech Stack:** Rust 2021, Tauri 2, Next.js 14, React 18, TypeScript, SQLite, ChromaDB, wasmtime, react-pdf, Monaco Editor, KaTeX, Zustand

---

## Phase 1: 后端基础设施

### Task 1: 创建 citeforge-theme crate

**Files:**
- Create: `crates/citeforge-theme/Cargo.toml`
- Create: `crates/citeforge-theme/src/lib.rs`
- Create: `crates/citeforge-theme/src/theme.rs`
- Create: `crates/citeforge-theme/src/manager.rs`
- Create: `crates/citeforge-theme/src/presets.rs`
- Test: `crates/citeforge-theme/src/theme.rs` (inline tests)

- [ ] **Step 1: Create Cargo.toml**

```toml
[package]
name = "citeforge-theme"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
thiserror = "1"
tokio = { version = "1", features = ["full"] }
chrono = { version = "0.4", features = ["serde"] }
```

- [ ] **Step 2: Create theme.rs with types**

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Theme {
    pub id: String,
    pub name: String,
    pub description: String,
    pub author: String,
    pub version: String,
    pub colors: ThemeColors,
    pub fonts: ThemeFonts,
    pub spacing: ThemeSpacing,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ThemeColors {
    pub primary: String,
    pub secondary: String,
    pub accent: String,
    pub background: String,
    pub surface: String,
    pub card: String,
    pub text_primary: String,
    pub text_secondary: String,
    pub text_muted: String,
    pub success: String,
    pub warning: String,
    pub error: String,
    pub info: String,
    pub highlight: String,
    pub selection: String,
    pub link: String,
    pub code_background: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ThemeFonts {
    pub sans_serif: String,
    pub serif: String,
    pub monospace: String,
    pub size_base: f64,
    pub line_height: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ThemeSpacing {
    pub unit: f64,
    pub radius: f64,
    pub gap: f64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_theme_serialization() {
        let theme = Theme {
            id: "test".to_string(),
            name: "Test".to_string(),
            description: "Test theme".to_string(),
            author: "Test".to_string(),
            version: "1.0.0".to_string(),
            colors: ThemeColors {
                primary: "#6366f1".to_string(),
                secondary: "#8b5cf6".to_string(),
                accent: "#f59e0b".to_string(),
                background: "#0f172a".to_string(),
                surface: "#1e293b".to_string(),
                card: "#1e293b".to_string(),
                text_primary: "#f8fafc".to_string(),
                text_secondary: "#94a3b8".to_string(),
                text_muted: "#64748b".to_string(),
                success: "#22c55e".to_string(),
                warning: "#f59e0b".to_string(),
                error: "#ef4444".to_string(),
                info: "#3b82f6".to_string(),
                highlight: "#fbbf24".to_string(),
                selection: "#6366f1".to_string(),
                link: "#3b82f6".to_string(),
                code_background: "#1e293b".to_string(),
            },
            fonts: ThemeFonts {
                sans_serif: "Inter, sans-serif".to_string(),
                serif: "Georgia, serif".to_string(),
                monospace: "JetBrains Mono, monospace".to_string(),
                size_base: 16.0,
                line_height: 1.6,
            },
            spacing: ThemeSpacing {
                unit: 4.0,
                radius: 8.0,
                gap: 16.0,
            },
        };

        let json = serde_json::to_string(&theme).unwrap();
        let deserialized: Theme = serde_json::from_str(&json).unwrap();
        assert_eq!(theme, deserialized);
    }
}
```

- [ ] **Step 3: Create manager.rs**

```rust
use crate::theme::Theme;
use std::collections::HashMap;
use std::path::PathBuf;

pub struct ThemeManager {
    themes: HashMap<String, Theme>,
    current_theme_id: String,
    config_dir: PathBuf,
}

impl ThemeManager {
    pub fn new(config_dir: PathBuf) -> Self {
        let mut manager = Self {
            themes: HashMap::new(),
            current_theme_id: "midnight_scholar".to_string(),
            config_dir,
        };
        manager.load_presets();
        manager
    }

    fn load_presets(&mut self) {
        let presets = crate::presets::all_presets();
        for theme in presets {
            self.themes.insert(theme.id.clone(), theme);
        }
    }

    pub fn current_theme(&self) -> &Theme {
        self.themes.get(&self.current_theme_id).unwrap()
    }

    pub fn set_theme(&mut self, theme_id: &str) -> Result<(), String> {
        if self.themes.contains_key(theme_id) {
            self.current_theme_id = theme_id.to_string();
            Ok(())
        } else {
            Err(format!("Theme '{}' not found", theme_id))
        }
    }

    pub fn list_themes(&self) -> Vec<&Theme> {
        self.themes.values().collect()
    }

    pub fn add_theme(&mut self, theme: Theme) {
        self.themes.insert(theme.id.clone(), theme);
    }

    pub fn export_theme(&self, theme_id: &str) -> Result<String, String> {
        self.themes
            .get(theme_id)
            .map(|t| serde_json::to_string_pretty(t).unwrap())
            .ok_or_else(|| format!("Theme '{}' not found", theme_id))
    }

    pub fn import_theme(&mut self, json: &str) -> Result<(), String> {
        let theme: Theme = serde_json::from_str(json).map_err(|e| e.to_string())?;
        self.add_theme(theme);
        Ok(())
    }
}
```

- [ ] **Step 4: Create presets.rs with 4 themes**

```rust
use crate::theme::{Theme, ThemeColors, ThemeFonts, ThemeSpacing};

pub fn all_presets() -> Vec<Theme> {
    vec![midnight_scholar(), classic_paper(), green_garden(), high_contrast()]
}

fn midnight_scholar() -> Theme {
    Theme {
        id: "midnight_scholar".to_string(),
        name: "午夜学者".to_string(),
        description: "护眼深色主题，适合长时间阅读".to_string(),
        author: "CiteForge".to_string(),
        version: "1.0.0".to_string(),
        colors: ThemeColors {
            primary: "#6366f1".to_string(),
            secondary: "#8b5cf6".to_string(),
            accent: "#f59e0b".to_string(),
            background: "#0f172a".to_string(),
            surface: "#1e293b".to_string(),
            card: "#1e293b".to_string(),
            text_primary: "#f8fafc".to_string(),
            text_secondary: "#94a3b8".to_string(),
            text_muted: "#64748b".to_string(),
            success: "#22c55e".to_string(),
            warning: "#f59e0b".to_string(),
            error: "#ef4444".to_string(),
            info: "#3b82f6".to_string(),
            highlight: "#fbbf24".to_string(),
            selection: "#6366f1".to_string(),
            link: "#3b82f6".to_string(),
            code_background: "#1e293b".to_string(),
        },
        fonts: default_fonts(),
        spacing: default_spacing(),
    }
}

fn classic_paper() -> Theme {
    Theme {
        id: "classic_paper".to_string(),
        name: "经典论文".to_string(),
        description: "模拟纸质阅读体验".to_string(),
        author: "CiteForge".to_string(),
        version: "1.0.0".to_string(),
        colors: ThemeColors {
            primary: "#2563eb".to_string(),
            secondary: "#7c3aed".to_string(),
            accent: "#dc2626".to_string(),
            background: "#fefce8".to_string(),
            surface: "#ffffff".to_string(),
            card: "#ffffff".to_string(),
            text_primary: "#1e293b".to_string(),
            text_secondary: "#475569".to_string(),
            text_muted: "#94a3b8".to_string(),
            success: "#16a34a".to_string(),
            warning: "#d97706".to_string(),
            error: "#dc2626".to_string(),
            info: "#2563eb".to_string(),
            highlight: "#fde68a".to_string(),
            selection: "#bfdbfe".to_string(),
            link: "#2563eb".to_string(),
            code_background: "#f1f5f9".to_string(),
        },
        fonts: ThemeFonts {
            sans_serif: "Inter, sans-serif".to_string(),
            serif: "Merriweather, Georgia, serif".to_string(),
            monospace: "JetBrains Mono, monospace".to_string(),
            size_base: 16.0,
            line_height: 1.8,
        },
        spacing: default_spacing(),
    }
}

fn green_garden() -> Theme {
    Theme {
        id: "green_garden".to_string(),
        name: "绿色花园".to_string(),
        description: "低对比度护眼主题".to_string(),
        author: "CiteForge".to_string(),
        version: "1.0.0".to_string(),
        colors: ThemeColors {
            primary: "#16a34a".to_string(),
            secondary: "#059669".to_string(),
            accent: "#d97706".to_string(),
            background: "#f0fdf4".to_string(),
            surface: "#ffffff".to_string(),
            card: "#ffffff".to_string(),
            text_primary: "#1a2e05".to_string(),
            text_secondary: "#3f6212".to_string(),
            text_muted: "#65a30d".to_string(),
            success: "#16a34a".to_string(),
            warning: "#d97706".to_string(),
            error: "#dc2626".to_string(),
            info: "#0891b2".to_string(),
            highlight: "#bbf7d0".to_string(),
            selection: "#86efac".to_string(),
            link: "#16a34a".to_string(),
            code_background: "#f0fdf4".to_string(),
        },
        fonts: default_fonts(),
        spacing: default_spacing(),
    }
}

fn high_contrast() -> Theme {
    Theme {
        id: "high_contrast".to_string(),
        name: "高对比".to_string(),
        description: "适合视力不佳用户".to_string(),
        author: "CiteForge".to_string(),
        version: "1.0.0".to_string(),
        colors: ThemeColors {
            primary: "#000000".to_string(),
            secondary: "#1a1a1a".to_string(),
            accent: "#0000ff".to_string(),
            background: "#ffffff".to_string(),
            surface: "#ffffff".to_string(),
            card: "#ffffff".to_string(),
            text_primary: "#000000".to_string(),
            text_secondary: "#000000".to_string(),
            text_muted: "#333333".to_string(),
            success: "#008000".to_string(),
            warning: "#ff8c00".to_string(),
            error: "#ff0000".to_string(),
            info: "#0000ff".to_string(),
            highlight: "#ffff00".to_string(),
            selection: "#0000ff".to_string(),
            link: "#0000ff".to_string(),
            code_background: "#f0f0f0".to_string(),
        },
        fonts: ThemeFonts {
            sans_serif: "Arial, sans-serif".to_string(),
            serif: "Times New Roman, serif".to_string(),
            monospace: "Courier New, monospace".to_string(),
            size_base: 18.0,
            line_height: 2.0,
        },
        spacing: ThemeSpacing {
            unit: 6.0,
            radius: 4.0,
            gap: 20.0,
        },
    }
}

fn default_fonts() -> ThemeFonts {
    ThemeFonts {
        sans_serif: "Inter, sans-serif".to_string(),
        serif: "Georgia, serif".to_string(),
        monospace: "JetBrains Mono, monospace".to_string(),
        size_base: 16.0,
        line_height: 1.6,
    }
}

fn default_spacing() -> ThemeSpacing {
    ThemeSpacing {
        unit: 4.0,
        radius: 8.0,
        gap: 16.0,
    }
}
```

- [ ] **Step 5: Create lib.rs**

```rust
pub mod theme;
pub mod manager;
pub mod presets;

pub use theme::{Theme, ThemeColors, ThemeFonts, ThemeSpacing};
pub use manager::ThemeManager;
```

- [ ] **Step 6: Register crate in workspace Cargo.toml**

Add to `Cargo.toml` members:
```
"crates/citeforge-theme",
```

- [ ] **Step 7: Run tests**

```bash
cargo test -p citeforge-theme
```
Expected: 1 test passes (theme serialization)

- [ ] **Step 8: Commit**

```bash
git add crates/citeforge-theme/ Cargo.toml
git commit -m "feat(theme): add citeforge-theme crate with 4 preset themes"
```

---

### Task 2: 创建 citeforge-memory crate

**Files:**
- Create: `crates/citeforge-memory/Cargo.toml`
- Create: `crates/citeforge-memory/src/lib.rs`
- Create: `crates/citeforge-memory/src/types.rs`
- Create: `crates/citeforge-memory/src/manager.rs`
- Create: `crates/citeforge-memory/src/store.rs`
- Test: `crates/citeforge-memory/src/types.rs` (inline tests)

- [ ] **Step 1: Create Cargo.toml**

```toml
[package]
name = "citeforge-memory"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
thiserror = "1"
tokio = { version = "1", features = ["full"] }
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1", features = ["v4"] }
rusqlite = { version = "0.31", features = ["bundled"] }
tracing = "0.1"
```

- [ ] **Step 2: Create types.rs**

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub type MemoryId = Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MemoryType {
    ShortTerm,
    LongTerm,
    Working,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Importance {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MemorySource {
    Literature { id: Uuid, page: u32 },
    Note { id: Uuid },
    Conversation { session_id: Uuid },
    Annotation { id: Uuid },
    UserInput,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct MemoryMetadata {
    pub source: MemorySource,
    pub tags: Vec<String>,
    pub document_id: Option<Uuid>,
    pub literature_id: Option<Uuid>,
    pub importance: Importance,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Memory {
    pub id: MemoryId,
    pub content: String,
    pub memory_type: MemoryType,
    pub metadata: MemoryMetadata,
    pub created_at: DateTime<Utc>,
    pub last_accessed: DateTime<Utc>,
    pub access_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewMemory {
    pub content: String,
    pub memory_type: MemoryType,
    pub metadata: MemoryMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryUpdates {
    pub content: Option<String>,
    pub metadata: Option<MemoryMetadata>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_memory_creation() {
        let memory = Memory {
            id: Uuid::new_v4(),
            content: "Test memory".to_string(),
            memory_type: MemoryType::LongTerm,
            metadata: MemoryMetadata {
                source: MemorySource::UserInput,
                tags: vec!["test".to_string()],
                document_id: None,
                literature_id: None,
                importance: Importance::Medium,
            },
            created_at: Utc::now(),
            last_accessed: Utc::now(),
            access_count: 0,
        };

        assert_eq!(memory.content, "Test memory");
        assert_eq!(memory.memory_type, MemoryType::LongTerm);
        assert_eq!(memory.metadata.tags, vec!["test".to_string()]);
    }
}
```

- [ ] **Step 3: Create store.rs for SQLite persistence**

```rust
use crate::types::*;
use rusqlite::{params, Connection};
use std::path::Path;
use std::sync::{Arc, Mutex};

pub struct MemoryStore {
    conn: Arc<Mutex<Connection>>,
}

impl MemoryStore {
    pub fn new(db_path: &Path) -> Result<Self, Box<dyn std::error::Error>> {
        let conn = Connection::open(db_path)?;
        let store = Self {
            conn: Arc::new(Mutex::new(conn)),
        };
        store.init_schema()?;
        Ok(store)
    }

    fn init_schema(&self) -> Result<(), Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS memories (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                memory_type TEXT NOT NULL,
                metadata TEXT NOT NULL,
                created_at TEXT NOT NULL,
                last_accessed TEXT NOT NULL,
                access_count INTEGER NOT NULL DEFAULT 0
            );
            CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(memory_type);
            CREATE INDEX IF NOT EXISTS idx_memories_created ON memories(created_at);",
        )?;
        Ok(())
    }

    pub fn store(&self, memory: &Memory) -> Result<(), Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        let metadata_json = serde_json::to_string(&memory.metadata)?;
        conn.execute(
            "INSERT INTO memories (id, content, memory_type, metadata, created_at, last_accessed, access_count)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                memory.id.to_string(),
                memory.content,
                serde_json::to_string(&memory.memory_type)?,
                metadata_json,
                memory.created_at.to_rfc3339(),
                memory.last_accessed.to_rfc3339(),
                memory.access_count,
            ],
        )?;
        Ok(())
    }

    pub fn get(&self, id: &Uuid) -> Result<Option<Memory>, Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, content, memory_type, metadata, created_at, last_accessed, access_count
             FROM memories WHERE id = ?1",
        )?;

        let mut rows = stmt.query_map(params![id.to_string()], |row| {
            Ok(Memory {
                id: Uuid::parse_str(&row.get::<_, String>(0)?).unwrap(),
                content: row.get(1)?,
                memory_type: serde_json::from_str(&row.get::<_, String>(2)?).unwrap(),
                metadata: serde_json::from_str(&row.get::<_, String>(3)?).unwrap(),
                created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(4)?)
                    .unwrap()
                    .with_timezone(&Utc),
                last_accessed: DateTime::parse_from_rfc3339(&row.get::<_, String>(5)?)
                    .unwrap()
                    .with_timezone(&Utc),
                access_count: row.get(6)?,
            })
        })?;

        match rows.next() {
            Some(row) => Ok(Some(row?)),
            None => Ok(None),
        }
    }

    pub fn search(&self, query: &str, limit: usize) -> Result<Vec<Memory>, Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, content, memory_type, metadata, created_at, last_accessed, access_count
             FROM memories WHERE content LIKE ?1
             ORDER BY last_accessed DESC LIMIT ?2",
        )?;

        let pattern = format!("%{}%", query);
        let rows = stmt.query_map(params![pattern, limit as i64], |row| {
            Ok(Memory {
                id: Uuid::parse_str(&row.get::<_, String>(0)?).unwrap(),
                content: row.get(1)?,
                memory_type: serde_json::from_str(&row.get::<_, String>(2)?).unwrap(),
                metadata: serde_json::from_str(&row.get::<_, String>(3)?).unwrap(),
                created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(4)?)
                    .unwrap()
                    .with_timezone(&Utc),
                last_accessed: DateTime::parse_from_rfc3339(&row.get::<_, String>(5)?)
                    .unwrap()
                    .with_timezone(&Utc),
                access_count: row.get(6)?,
            })
        })?;

        let mut memories = Vec::new();
        for row in rows {
            memories.push(row?);
        }
        Ok(memories)
    }

    pub fn delete(&self, id: &Uuid) -> Result<bool, Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        let rows_deleted = conn.execute("DELETE FROM memories WHERE id = ?1", params![id.to_string()])?;
        Ok(rows_deleted > 0)
    }
}
```

- [ ] **Step 4: Create manager.rs**

```rust
use crate::store::MemoryStore;
use crate::types::*;
use std::path::Path;
use uuid::Uuid;

pub struct MemoryManager {
    store: MemoryStore,
}

impl MemoryManager {
    pub fn new(db_path: &Path) -> Result<Self, Box<dyn std::error::Error>> {
        let store = MemoryStore::new(db_path)?;
        Ok(Self { store })
    }

    pub async fn store(&self, new_memory: NewMemory) -> Result<MemoryId, Box<dyn std::error::Error>> {
        let id = Uuid::new_v4();
        let now = chrono::Utc::now();
        let memory = Memory {
            id,
            content: new_memory.content,
            memory_type: new_memory.memory_type,
            metadata: new_memory.metadata,
            created_at: now,
            last_accessed: now,
            access_count: 0,
        };
        self.store.store(&memory)?;
        Ok(id)
    }

    pub async fn recall(&self, query: &str, limit: usize) -> Result<Vec<Memory>, Box<dyn std::error::Error>> {
        self.store.search(query, limit)
    }

    pub async fn get(&self, id: &Uuid) -> Result<Option<Memory>, Box<dyn std::error::Error>> {
        self.store.get(id)
    }

    pub async fn forget(&self, id: &Uuid) -> Result<bool, Box<dyn std::error::Error>> {
        self.store.delete(id)
    }
}
```

- [ ] **Step 5: Create lib.rs**

```rust
pub mod types;
pub mod store;
pub mod manager;

pub use types::*;
pub use manager::MemoryManager;
```

- [ ] **Step 6: Register crate in workspace Cargo.toml**

Add to `Cargo.toml` members:
```
"crates/citeforge-memory",
```

- [ ] **Step 7: Run tests**

```bash
cargo test -p citeforge-memory
```
Expected: 1 test passes

- [ ] **Step 8: Commit**

```bash
git add crates/citeforge-memory/ Cargo.toml
git commit -m "feat(memory): add citeforge-memory crate with SQLite storage"
```

---

### Task 3: 创建 citeforge-plugin crate

**Files:**
- Create: `crates/citeforge-plugin/Cargo.toml`
- Create: `crates/citeforge-plugin/src/lib.rs`
- Create: `crates/citeforge-plugin/src/types.rs`
- Create: `crates/citeforge-plugin/src/manager.rs`
- Test: `crates/citeforge-plugin/src/types.rs` (inline tests)

- [ ] **Step 1: Create Cargo.toml**

```toml
[package]
name = "citeforge-plugin"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
thiserror = "1"
tokio = { version = "1", features = ["full"] }
uuid = { version = "1", features = ["v4"] }
tracing = "0.1"
```

- [ ] **Step 2: Create types.rs**

```rust
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub type PluginId = Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PluginType {
    DataSource,
    Exporter,
    AiEnhancer,
    Analyzer,
    Automation,
    UiExtension,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PluginInfo {
    pub id: PluginId,
    pub name: String,
    pub version: String,
    pub description: String,
    pub plugin_type: PluginType,
    pub author: String,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginConfig {
    pub plugins: Vec<PluginEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginEntry {
    pub name: String,
    pub enabled: bool,
    pub config: Option<serde_json::Value>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_plugin_info_serialization() {
        let info = PluginInfo {
            id: Uuid::new_v4(),
            name: "test-plugin".to_string(),
            version: "1.0.0".to_string(),
            description: "A test plugin".to_string(),
            plugin_type: PluginType::DataSource,
            author: "Test".to_string(),
            enabled: true,
        };

        let json = serde_json::to_string(&info).unwrap();
        let deserialized: PluginInfo = serde_json::from_str(&json).unwrap();
        assert_eq!(info.name, deserialized.name);
        assert_eq!(info.plugin_type, deserialized.plugin_type);
    }

    #[test]
    fn test_plugin_config_serialization() {
        let config = PluginConfig {
            plugins: vec![
                PluginEntry {
                    name: "pubmed".to_string(),
                    enabled: true,
                    config: None,
                },
                PluginEntry {
                    name: "zotero".to_string(),
                    enabled: false,
                    config: Some(serde_json::json!({"api_key": "xxx"})),
                },
            ],
        };

        let json = serde_json::to_string(&config).unwrap();
        let deserialized: PluginConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(config.plugins.len(), deserialized.plugins.len());
        assert!(deserialized.plugins[1].config.is_some());
    }
}
```

- [ ] **Step 3: Create manager.rs (placeholder for WASM runtime)**

```rust
use crate::types::*;
use std::path::PathBuf;

pub struct PluginManager {
    plugins_dir: PathBuf,
    loaded_plugins: Vec<PluginInfo>,
}

impl PluginManager {
    pub fn new(plugins_dir: PathBuf) -> Self {
        Self {
            plugins_dir,
            loaded_plugins: Vec::new(),
        }
    }

    pub fn discover_plugins(&self) -> Result<Vec<PluginInfo>, Box<dyn std::error::Error>> {
        // TODO: Scan plugins_dir for .wasm files and read their metadata
        Ok(self.loaded_plugins.clone())
    }

    pub fn list_plugins(&self) -> &[PluginInfo] {
        &self.loaded_plugins
    }

    pub fn enable_plugin(&mut self, plugin_id: &PluginId) -> Result<(), String> {
        if let Some(plugin) = self.loaded_plugins.iter_mut().find(|p| p.id == *plugin_id) {
            plugin.enabled = true;
            Ok(())
        } else {
            Err("Plugin not found".to_string())
        }
    }

    pub fn disable_plugin(&mut self, plugin_id: &PluginId) -> Result<(), String> {
        if let Some(plugin) = self.loaded_plugins.iter_mut().find(|p| p.id == *plugin_id) {
            plugin.enabled = false;
            Ok(())
        } else {
            Err("Plugin not found".to_string())
        }
    }
}
```

- [ ] **Step 4: Create lib.rs**

```rust
pub mod types;
pub mod manager;

pub use types::*;
pub use manager::PluginManager;
```

- [ ] **Step 5: Register crate in workspace Cargo.toml**

Add to `Cargo.toml` members:
```
"crates/citeforge-plugin",
```

- [ ] **Step 6: Run tests**

```bash
cargo test -p citeforge-plugin
```
Expected: 2 tests pass

- [ ] **Step 7: Commit**

```bash
git add crates/citeforge-plugin/ Cargo.toml
git commit -m "feat(plugin): add citeforge-plugin crate with WASM plugin system skeleton"
```

---

## Phase 2: 领域模型扩展

### Task 4: 扩展 citeforge-core 添加 Document 和 Annotation 模型

**Files:**
- Modify: `crates/citeforge-core/src/entity/mod.rs`
- Create: `crates/citeforge-core/src/entity/document.rs`
- Create: `crates/citeforge-core/src/entity/annotation.rs`
- Create: `crates/citeforge-core/src/entity/literature.rs`
- Test: `crates/citeforge-core/src/entity/document.rs` (inline tests)
- Test: `crates/citeforge-core/src/entity/annotation.rs` (inline tests)

- [ ] **Step 1: Create document.rs**

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub type DocumentId = Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ReadStatus {
    Unread,
    Reading,
    Read,
    ToRead,
    Archived,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Document {
    pub id: DocumentId,
    pub title: String,
    pub file_path: Option<String>,
    pub content: Option<String>,  // Markdown content
    pub read_status: ReadStatus,
    pub read_progress: f32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_accessed: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewDocument {
    pub title: String,
    pub file_path: Option<String>,
    pub content: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_document_creation() {
        let doc = Document {
            id: Uuid::new_v4(),
            title: "Test Document".to_string(),
            file_path: None,
            content: Some("# Hello".to_string()),
            read_status: ReadStatus::Unread,
            read_progress: 0.0,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            last_accessed: Utc::now(),
        };

        assert_eq!(doc.title, "Test Document");
        assert_eq!(doc.read_status, ReadStatus::Unread);
    }
}
```

- [ ] **Step 2: Create annotation.rs**

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub type AnnotationId = Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AnnotationType {
    Highlight,
    Underline,
    Note,
    Stamp,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Position {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub page_width: f64,
    pub page_height: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Annotation {
    pub id: AnnotationId,
    pub document_id: Uuid,
    pub page_number: u32,
    pub annotation_type: AnnotationType,
    pub content: Option<String>,
    pub color: String,
    pub position: Position,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewAnnotation {
    pub document_id: Uuid,
    pub page_number: u32,
    pub annotation_type: AnnotationType,
    pub content: Option<String>,
    pub color: String,
    pub position: Position,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_annotation_creation() {
        let annotation = Annotation {
            id: Uuid::new_v4(),
            document_id: Uuid::new_v4(),
            page_number: 1,
            annotation_type: AnnotationType::Highlight,
            content: None,
            color: "#fbbf24".to_string(),
            position: Position {
                x: 0.1,
                y: 0.2,
                width: 0.3,
                height: 0.05,
                page_width: 1.0,
                page_height: 1.0,
            },
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        assert_eq!(annotation.annotation_type, AnnotationType::Highlight);
        assert_eq!(annotation.color, "#fbbf24");
    }
}
```

- [ ] **Step 3: Create literature.rs**

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub type LiteratureId = Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Author {
    pub name: String,
    pub orcid: Option<String>,
    pub affiliation: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Category {
    Methodology,
    Theory,
    Survey,
    Experiment,
    Review,
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Literature {
    pub id: LiteratureId,
    pub title: String,
    pub authors: Vec<Author>,
    pub abstract_text: Option<String>,
    pub doi: Option<String>,
    pub year: Option<u32>,
    pub venue: Option<String>,
    pub tags: Vec<String>,
    pub categories: Vec<Category>,
    pub citation_count: Option<u32>,
    pub file_path: Option<String>,
    pub source: String,
    pub imported_at: DateTime<Utc>,
    pub last_accessed: DateTime<Utc>,
    pub read_progress: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewLiterature {
    pub title: String,
    pub authors: Vec<Author>,
    pub abstract_text: Option<String>,
    pub doi: Option<String>,
    pub year: Option<u32>,
    pub venue: Option<String>,
    pub tags: Vec<String>,
    pub categories: Vec<Category>,
    pub citation_count: Option<u32>,
    pub file_path: Option<String>,
    pub source: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_literature_creation() {
        let lit = Literature {
            id: Uuid::new_v4(),
            title: "Attention Is All You Need".to_string(),
            authors: vec![Author {
                name: "Vaswani et al.".to_string(),
                orcid: None,
                affiliation: None,
            }],
            abstract_text: Some("The dominant sequence transduction models...".to_string()),
            doi: Some("10.48550/arXiv.1706.03762".to_string()),
            year: Some(2017),
            venue: Some("NeurIPS".to_string()),
            tags: vec!["transformer".to_string(), "attention".to_string()],
            categories: vec![Category::Theory],
            citation_count: Some(100000),
            file_path: None,
            source: "arxiv".to_string(),
            imported_at: Utc::now(),
            last_accessed: Utc::now(),
            read_progress: 0.0,
        };

        assert_eq!(lit.title, "Attention Is All You Need");
        assert_eq!(lit.year, Some(2017));
    }
}
```

- [ ] **Step 4: Update entity/mod.rs**

```rust
pub mod task;
pub mod literature_entry;
pub mod theme;
pub mod draft;
pub mod chunk;
pub mod document;
pub mod annotation;
pub mod literature;
```

- [ ] **Step 5: Run tests**

```bash
cargo test -p citeforge-core
```
Expected: All tests pass including new document, annotation, literature tests

- [ ] **Step 6: Commit**

```bash
git add crates/citeforge-core/
git commit -m "feat(core): add Document, Annotation, and Literature domain models"
```

---

### Task 5: 创建 Agent 个性和上下文系统

**Files:**
- Create: `src-tauri/src/agent/personality.rs`
- Create: `src-tauri/src/agent/context.rs`
- Create: `src-tauri/src/agent/mod.rs`
- Test: `src-tauri/src/agent/personality.rs` (inline tests)

- [ ] **Step 1: Create personality.rs**

```rust
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AgentPersonality {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub traits: PersonalityTraits,
    pub interaction_style: InteractionStyle,
    pub system_prompt: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PersonalityTraits {
    pub directness: u8,
    pub humor: u8,
    pub curiosity: u8,
    pub criticalness: u8,
    pub patience: u8,
    pub creativity: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct InteractionStyle {
    pub proactive_questions: bool,
    pub challenge_assumptions: bool,
    pub suggest_alternatives: bool,
    pub use_analogies: bool,
    pub cite_sources: bool,
}

impl AgentPersonality {
    pub fn strict_scholar() -> Self {
        Self {
            id: Uuid::new_v4(),
            name: "严谨学者".to_string(),
            description: "直言不讳，批判性高，追求准确".to_string(),
            traits: PersonalityTraits {
                directness: 70,
                humor: 20,
                curiosity: 80,
                criticalness: 80,
                patience: 60,
                creativity: 40,
            },
            interaction_style: InteractionStyle {
                proactive_questions: true,
                challenge_assumptions: true,
                suggest_alternatives: false,
                use_analogies: false,
                cite_sources: true,
            },
            system_prompt: "你是一个严谨的学术助手。你会质疑不严谨的推理，要求提供证据支持论点，指出逻辑漏洞，保持专业和客观。".to_string(),
        }
    }

    pub fn motivational_mentor() -> Self {
        Self {
            id: Uuid::new_v4(),
            name: "激励导师".to_string(),
            description: "幽默、好奇、鼓励探索".to_string(),
            traits: PersonalityTraits {
                directness: 40,
                humor: 60,
                curiosity: 90,
                criticalness: 30,
                patience: 80,
                creativity: 70,
            },
            interaction_style: InteractionStyle {
                proactive_questions: true,
                challenge_assumptions: false,
                suggest_alternatives: true,
                use_analogies: true,
                cite_sources: false,
            },
            system_prompt: "你是一个激励型导师。你会鼓励探索新想法，提供积极的反馈，帮助发现研究潜力，用类比解释复杂概念。".to_string(),
        }
    }

    pub fn critical_thinker() -> Self {
        Self {
            id: Uuid::new_v4(),
            name: "批判性思考者".to_string(),
            description: "直接、质疑假设、推动深入思考".to_string(),
            traits: PersonalityTraits {
                directness: 90,
                humor: 30,
                curiosity: 90,
                criticalness: 95,
                patience: 40,
                creativity: 60,
            },
            interaction_style: InteractionStyle {
                proactive_questions: true,
                challenge_assumptions: true,
                suggest_alternatives: true,
                use_analogies: false,
                cite_sources: true,
            },
            system_prompt: "你是一个批判性思考者。你会挑战每一个假设，要求证据和逻辑，提出反面论点，推动深入思考。".to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_strict_scholar_personality() {
        let p = AgentPersonality::strict_scholar();
        assert_eq!(p.name, "严谨学者");
        assert!(p.traits.criticalness > 70);
        assert!(p.interaction_style.challenge_assumptions);
    }

    #[test]
    fn test_motivational_mentor_personality() {
        let p = AgentPersonality::motivational_mentor();
        assert_eq!(p.name, "激励导师");
        assert!(p.traits.humor > 50);
        assert!(p.interaction_style.suggest_alternatives);
    }
}
```

- [ ] **Step 2: Create context.rs**

```rust
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
        // Simple parsing: look for key-value pairs
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
```

- [ ] **Step 3: Create mod.rs**

```rust
pub mod personality;
pub mod context;

pub use personality::AgentPersonality;
pub use context::AgentContext;
```

- [ ] **Step 4: Run tests**

```bash
cargo test -p citeforge-tauri -- agent
```
Expected: Tests pass

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/agent/
git commit -m "feat(agent): add Agent personality and context system"
```

---

## Phase 3: 前端基础设施

### Task 6: 重构前端布局

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/ThemeProvider.tsx`
- Modify: `src/lib/types.ts`
- Modify: `src/lib/store.ts`

- [ ] **Step 1: Update types.ts with new types**

```typescript
// Add to existing types.ts

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  spacing: ThemeSpacing;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  card: string;
  text_primary: string;
  text_secondary: string;
  text_muted: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  highlight: string;
  selection: string;
  link: string;
  code_background: string;
}

export interface ThemeFonts {
  sans_serif: string;
  serif: string;
  monospace: string;
  size_base: number;
  line_height: number;
}

export interface ThemeSpacing {
  unit: number;
  radius: number;
  gap: number;
}

export interface Document {
  id: string;
  title: string;
  file_path?: string;
  content?: string;
  read_status: 'Unread' | 'Reading' | 'Read' | 'ToRead' | 'Archived';
  read_progress: number;
  created_at: string;
  updated_at: string;
}

export interface Annotation {
  id: string;
  document_id: string;
  page_number: number;
  annotation_type: 'Highlight' | 'Underline' | 'Note' | 'Stamp';
  content?: string;
  color: string;
  position: Position;
  created_at: string;
}

export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
  page_width: number;
  page_height: number;
}

export interface Literature {
  id: string;
  title: string;
  authors: Author[];
  abstract_text?: string;
  doi?: string;
  year?: number;
  venue?: string;
  tags: string[];
  categories: string[];
  citation_count?: number;
  file_path?: string;
  source: string;
  imported_at: string;
  read_progress: number;
}

export interface Author {
  name: string;
  orcid?: string;
  affiliation?: string;
}

export interface AgentPersonality {
  id: string;
  name: string;
  description: string;
  traits: PersonalityTraits;
  interaction_style: InteractionStyle;
  system_prompt: string;
}

export interface PersonalityTraits {
  directness: number;
  humor: number;
  curiosity: number;
  criticalness: number;
  patience: number;
  creativity: number;
}

export interface InteractionStyle {
  proactive_questions: boolean;
  challenge_assumptions: boolean;
  suggest_alternatives: boolean;
  use_analogies: boolean;
  cite_sources: boolean;
}
```

- [ ] **Step 2: Create Sidebar.tsx**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: '首页', icon: '🏠' },
  { href: '/library', label: '文献库', icon: '📚' },
  { href: '/reader', label: '阅读器', icon: '📖' },
  { href: '/editor', label: '编辑器', icon: '✏️' },
  { href: '/agent', label: 'Agent', icon: '🤖' },
  { href: '/settings', label: '设置', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-surface border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold text-primary">CiteForge</h1>
        <p className="text-sm text-secondary">科研助手终端</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-primary text-white'
                    : 'text-secondary hover:bg-surface-hover'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted">
          CiteForge v0.1.0
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Create ThemeProvider.tsx**

```tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'midnight_scholar',
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState('midnight_scholar');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

- [ ] **Step 4: Update layout.tsx**

```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import { ThemeProvider } from '@/components/layout/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CiteForge - 科研助手终端',
  description: '自带 Agent 的科研助手终端',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body className={inter.className}>
        <ThemeProvider>
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Update page.tsx**

```tsx
export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">欢迎使用 CiteForge</h1>
      <p className="text-secondary mb-8">
        自带 Agent 的科研助手终端，支持 PDF 阅读、Markdown 编辑、文献管理。
      </p>

      <div className="grid grid-cols-2 gap-6">
        <a href="/library" className="p-6 bg-card rounded-lg border border-border hover:border-primary transition-colors">
          <h2 className="text-xl font-semibold mb-2">📚 文献库</h2>
          <p className="text-secondary">管理和浏览您的研究文献</p>
        </a>

        <a href="/reader" className="p-6 bg-card rounded-lg border border-border hover:border-primary transition-colors">
          <h2 className="text-xl font-semibold mb-2">📖 阅读器</h2>
          <p className="text-secondary">阅读 PDF 并添加批注</p>
        </a>

        <a href="/editor" className="p-6 bg-card rounded-lg border border-border hover:border-primary transition-colors">
          <h2 className="text-xl font-semibold mb-2">✏️ 编辑器</h2>
          <p className="text-secondary">Markdown 和 LaTeX 实时预览</p>
        </a>

        <a href="/agent" className="p-6 bg-card rounded-lg border border-border hover:border-primary transition-colors">
          <h2 className="text-xl font-semibold mb-2">🤖 Agent</h2>
          <p className="text-secondary">与 AI 助手对话</p>
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "feat(layout): restructure frontend with sidebar navigation and theme provider"
```

---

### Task 7: 创建全局 CSS 变量系统

**Files:**
- Create: `src/app/globals.css`
- Create: `src/styles/themes.css`

- [ ] **Step 1: Create globals.css**

```css
@import './styles/themes.css';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: var(--color-background);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  line-height: var(--line-height);
}

/* Utility classes */
.bg-primary { background-color: var(--color-primary); }
.bg-surface { background-color: var(--color-surface); }
.bg-card { background-color: var(--color-card); }

.text-primary { color: var(--color-text-primary); }
.text-secondary { color: var(--color-text-secondary); }
.text-muted { color: var(--color-text-muted); }

.border-primary { border-color: var(--color-primary); }
.border-border { border-color: var(--color-border); }

.hover\:bg-surface-hover:hover {
  background-color: var(--color-surface-hover);
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-surface);
}

::-webkit-scrollbar-thumb {
  background: var(--color-text-muted);
  border-radius: var(--radius);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-secondary);
}
```

- [ ] **Step 2: Create themes.css**

```css
/* Midnight Scholar (default dark theme) */
[data-theme="midnight_scholar"] {
  --color-primary: #6366f1;
  --color-secondary: #8b5cf6;
  --color-accent: #f59e0b;
  --color-background: #0f172a;
  --color-surface: #1e293b;
  --color-surface-hover: #334155;
  --color-card: #1e293b;
  --color-border: #334155;
  --color-text-primary: #f8fafc;
  --color-text-secondary: #94a3b8;
  --color-text-muted: #64748b;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
  --color-highlight: #fbbf24;
  --color-selection: #6366f1;
  --color-link: #3b82f6;
  --color-code-background: #1e293b;

  --font-sans: 'Inter', sans-serif;
  --font-serif: 'Georgia', serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-size-base: 16px;
  --line-height: 1.6;

  --spacing-unit: 4px;
  --radius: 8px;
  --gap: 16px;
}

/* Classic Paper */
[data-theme="classic_paper"] {
  --color-primary: #2563eb;
  --color-secondary: #7c3aed;
  --color-accent: #dc2626;
  --color-background: #fefce8;
  --color-surface: #ffffff;
  --color-surface-hover: #f1f5f9;
  --color-card: #ffffff;
  --color-border: #e2e8f0;
  --color-text-primary: #1e293b;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-error: #dc2626;
  --color-info: #2563eb;
  --color-highlight: #fde68a;
  --color-selection: #bfdbfe;
  --color-link: #2563eb;
  --color-code-background: #f1f5f9;

  --font-sans: 'Inter', sans-serif;
  --font-serif: 'Merriweather', 'Georgia', serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-size-base: 16px;
  --line-height: 1.8;

  --spacing-unit: 4px;
  --radius: 8px;
  --gap: 16px;
}

/* Green Garden */
[data-theme="green_garden"] {
  --color-primary: #16a34a;
  --color-secondary: #059669;
  --color-accent: #d97706;
  --color-background: #f0fdf4;
  --color-surface: #ffffff;
  --color-surface-hover: #dcfce7;
  --color-card: #ffffff;
  --color-border: #bbf7d0;
  --color-text-primary: #1a2e05;
  --color-text-secondary: #3f6212;
  --color-text-muted: #65a30d;
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-error: #dc2626;
  --color-info: #0891b2;
  --color-highlight: #bbf7d0;
  --color-selection: #86efac;
  --color-link: #16a34a;
  --color-code-background: #f0fdf4;

  --font-sans: 'Inter', sans-serif;
  --font-serif: 'Georgia', serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-size-base: 16px;
  --line-height: 1.6;

  --spacing-unit: 4px;
  --radius: 8px;
  --gap: 16px;
}

/* High Contrast */
[data-theme="high_contrast"] {
  --color-primary: #000000;
  --color-secondary: #1a1a1a;
  --color-accent: #0000ff;
  --color-background: #ffffff;
  --color-surface: #ffffff;
  --color-surface-hover: #f0f0f0;
  --color-card: #ffffff;
  --color-border: #000000;
  --color-text-primary: #000000;
  --color-text-secondary: #000000;
  --color-text-muted: #333333;
  --color-success: #008000;
  --color-warning: #ff8c00;
  --color-error: #ff0000;
  --color-info: #0000ff;
  --color-highlight: #ffff00;
  --color-selection: #0000ff;
  --color-link: #0000ff;
  --color-code-background: #f0f0f0;

  --font-sans: 'Arial', sans-serif;
  --font-serif: 'Times New Roman', serif;
  --font-mono: 'Courier New', monospace;
  --font-size-base: 18px;
  --line-height: 2.0;

  --spacing-unit: 6px;
  --radius: 4px;
  --gap: 20px;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css src/styles/themes.css
git commit -m "feat(theme): add CSS variable system with 4 theme presets"
```

---

## Phase 4: 核心功能

### Task 8: 创建 PDF 阅读器组件

**Files:**
- Create: `src/components/reader/PDFViewer.tsx`
- Create: `src/components/reader/AnnotationLayer.tsx`
- Create: `src/components/reader/AnnotationToolbar.tsx`
- Create: `src/app/reader/[id]/page.tsx`

- [ ] **Step 1: Install react-pdf**

```bash
cd src && npm install react-pdf
```

- [ ] **Step 2: Create PDFViewer.tsx**

```tsx
'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  file: string | ArrayBuffer | null;
  pageNumber: number;
  numPages: number;
  scale: number;
  onDocumentLoaded: ({ numPages }: { numPages: number }) => void;
  onPageChange: (page: number) => void;
}

export default function PDFViewer({
  file,
  pageNumber,
  numPages,
  scale,
  onDocumentLoaded,
  onPageChange,
}: PDFViewerProps) {
  return (
    <div className="pdf-viewer">
      <Document
        file={file}
        onLoadSuccess={onDocumentLoaded}
        loading={<div className="p-8 text-center">加载中...</div>}
        error={<div className="p-8 text-center text-error">加载失败</div>}
      >
        <Page
          pageNumber={pageNumber}
          scale={scale}
          renderTextLayer={true}
          renderAnnotationLayer={true}
        />
      </Document>

      <div className="flex items-center justify-center gap-4 p-4 border-t border-border">
        <button
          onClick={() => onPageChange(Math.max(1, pageNumber - 1))}
          disabled={pageNumber <= 1}
          className="px-3 py-1 rounded bg-surface hover:bg-surface-hover disabled:opacity-50"
        >
          上一页
        </button>
        <span className="text-secondary">
          {pageNumber} / {numPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(numPages, pageNumber + 1))}
          disabled={pageNumber >= numPages}
          className="px-3 py-1 rounded bg-surface hover:bg-surface-hover disabled:opacity-50"
        >
          下一页
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create AnnotationLayer.tsx**

```tsx
'use client';

import { useState, useRef } from 'react';
import { Annotation } from '@/lib/types';

interface AnnotationLayerProps {
  annotations: Annotation[];
  currentPage: number;
  onAddAnnotation: (annotation: Omit<Annotation, 'id' | 'created_at'>) => void;
  onDeleteAnnotation: (id: string) => void;
}

export default function AnnotationLayer({
  annotations,
  currentPage,
  onAddAnnotation,
  onDeleteAnnotation,
}: AnnotationLayerProps) {
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(selection.toString());
      setSelectionRect(rect);
    }
  };

  const pageAnnotations = annotations.filter(a => a.page_number === currentPage);

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      onMouseUp={handleMouseUp}
    >
      {pageAnnotations.map((annotation) => (
        <div
          key={annotation.id}
          className="absolute pointer-events-auto cursor-pointer"
          style={{
            left: `${annotation.position.x * 100}%`,
            top: `${annotation.position.y * 100}%`,
            width: `${annotation.position.width * 100}%`,
            height: `${annotation.position.height * 100}%`,
            backgroundColor: annotation.color,
            opacity: 0.3,
          }}
          onClick={() => {
            if (confirm('删除此批注？')) {
              onDeleteAnnotation(annotation.id);
            }
          }}
          title={annotation.content || annotation.annotation_type}
        />
      ))}

      {selectedText && selectionRect && (
        <div
          className="absolute bg-card border border-border rounded shadow-lg p-2 pointer-events-auto z-50"
          style={{
            left: selectionRect.left,
            top: selectionRect.bottom + 8,
          }}
        >
          <div className="flex gap-2">
            <button
              onClick={() => {
                onAddAnnotation({
                  document_id: '',
                  page_number: currentPage,
                  annotation_type: 'Highlight',
                  color: '#fbbf24',
                  position: {
                    x: selectionRect.left / window.innerWidth,
                    y: selectionRect.top / window.innerHeight,
                    width: selectionRect.width / window.innerWidth,
                    height: selectionRect.height / window.innerHeight,
                    page_width: 1,
                    page_height: 1,
                  },
                });
                setSelectedText('');
                setSelectionRect(null);
              }}
              className="px-2 py-1 text-sm bg-yellow-200 rounded"
            >
              高亮
            </button>
            <button
              onClick={() => {
                onAddAnnotation({
                  document_id: '',
                  page_number: currentPage,
                  annotation_type: 'Underline',
                  color: '#6366f1',
                  position: {
                    x: selectionRect.left / window.innerWidth,
                    y: selectionRect.top / window.innerHeight,
                    width: selectionRect.width / window.innerWidth,
                    height: selectionRect.height / window.innerHeight,
                    page_width: 1,
                    page_height: 1,
                  },
                });
                setSelectedText('');
                setSelectionRect(null);
              }}
              className="px-2 py-1 text-sm bg-indigo-200 rounded"
            >
              划线
            </button>
            <button
              onClick={() => {
                const content = prompt('输入笔记内容：');
                if (content) {
                  onAddAnnotation({
                    document_id: '',
                    page_number: currentPage,
                    annotation_type: 'Note',
                    content,
                    color: '#22c55e',
                    position: {
                      x: selectionRect.left / window.innerWidth,
                      y: selectionRect.top / window.innerHeight,
                      width: selectionRect.width / window.innerWidth,
                      height: selectionRect.height / window.innerHeight,
                      page_width: 1,
                      page_height: 1,
                    },
                  });
                }
                setSelectedText('');
                setSelectionRect(null);
              }}
              className="px-2 py-1 text-sm bg-green-200 rounded"
            >
              笔记
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create reader page**

```tsx
'use client';

import { useState, useEffect } from 'react';
import PDFViewer from '@/components/reader/PDFViewer';
import AnnotationLayer from '@/components/reader/AnnotationLayer';
import { Annotation } from '@/lib/types';

export default function ReaderPage({ params }: { params: { id: string } }) {
  const [file, setFile] = useState<string | ArrayBuffer | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  // TODO: Load document from Tauri backend
  useEffect(() => {
    // Load document by params.id
  }, [params.id]);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-4 p-4 border-b border-border">
        <button
          onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
          className="px-3 py-1 rounded bg-surface hover:bg-surface-hover"
        >
          缩小
        </button>
        <span className="text-secondary">{Math.round(scale * 100)}%</span>
        <button
          onClick={() => setScale(s => Math.min(2.0, s + 0.1))}
          className="px-3 py-1 rounded bg-surface hover:bg-surface-hover"
        >
          放大
        </button>
        <button
          onClick={() => setScale(1.0)}
          className="px-3 py-1 rounded bg-surface hover:bg-surface-hover"
        >
          重置
        </button>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto relative">
        <PDFViewer
          file={file}
          pageNumber={pageNumber}
          numPages={numPages}
          scale={scale}
          onDocumentLoaded={({ numPages }) => setNumPages(numPages)}
          onPageChange={setPageNumber}
        />
        <AnnotationLayer
          annotations={annotations}
          currentPage={pageNumber}
          onAddAnnotation={(annotation) => {
            // TODO: Save to backend
            setAnnotations(prev => [...prev, {
              ...annotation,
              id: Date.now().toString(),
              created_at: new Date().toISOString(),
            }]);
          }}
          onDeleteAnnotation={(id) => {
            // TODO: Delete from backend
            setAnnotations(prev => prev.filter(a => a.id !== id));
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat(reader): add PDF viewer with annotation support"
```

---

### Task 9: 创建 Markdown/LaTeX 编辑器

**Files:**
- Create: `src/components/editor/MarkdownEditor.tsx`
- Create: `src/components/editor/PreviewPane.tsx`
- Create: `src/app/editor/[id]/page.tsx`

- [ ] **Step 1: Install dependencies**

```bash
cd src && npm install @monaco-editor/react marked katex
```

- [ ] **Step 2: Create MarkdownEditor.tsx**

```tsx
'use client';

import { useState } from 'react';
import Editor from '@monaco-editor/react';

interface MarkdownEditorProps {
  content: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({ content, onChange }: MarkdownEditorProps) {
  const insertMarkdown = (prefix: string, suffix: string = '') => {
    // TODO: Get selection from Monaco and wrap with prefix/suffix
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-border">
        <button
          onClick={() => insertMarkdown('**', '**')}
          className="px-2 py-1 text-sm rounded bg-surface hover:bg-surface-hover"
          title="粗体"
        >
          B
        </button>
        <button
          onClick={() => insertMarkdown('*', '*')}
          className="px-2 py-1 text-sm rounded bg-surface hover:bg-surface-hover italic"
          title="斜体"
        >
          I
        </button>
        <button
          onClick={() => insertMarkdown('# ')}
          className="px-2 py-1 text-sm rounded bg-surface hover:bg-surface-hover"
          title="标题"
        >
          H1
        </button>
        <button
          onClick={() => insertMarkdown('$', '$')}
          className="px-2 py-1 text-sm rounded bg-surface hover:bg-surface-hover"
          title="行内公式"
        >
          Math
        </button>
        <button
          onClick={() => insertMarkdown('$$\n', '\n$$')}
          className="px-2 py-1 text-sm rounded bg-surface hover:bg-surface-hover"
          title="块级公式"
        >
          Block
        </button>
        <button
          onClick={() => insertMarkdown('`', '`')}
          className="px-2 py-1 text-sm rounded bg-surface hover:bg-surface-hover font-mono"
          title="代码"
        >
          Code
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="markdown"
          value={content}
          onChange={(value) => onChange(value || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            scrollBeyondLastLine: false,
          }}
          theme="vs-dark"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create PreviewPane.tsx**

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { marked } from 'marked';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface PreviewPaneProps {
  content: string;
}

export default function PreviewPane({ content }: PreviewPaneProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!previewRef.current) return;

    // Parse markdown
    let html = marked.parse(content) as string;

    // Render LaTeX (simplified: find $...$ and $$...$$)
    html = html.replace(/\$\$(.*?)\$\$/g, (_, tex) => {
      try {
        return katex.renderToString(tex, { displayMode: true, throwOnError: false });
      } catch {
        return `<span class="text-error">LaTeX Error: ${tex}</span>`;
      }
    });

    html = html.replace(/\$(.*?)\$/g, (_, tex) => {
      try {
        return katex.renderToString(tex, { displayMode: false, throwOnError: false });
      } catch {
        return `<span class="text-error">${tex}</span>`;
      }
    });

    previewRef.current.innerHTML = html;
  }, [content]);

  return (
    <div
      ref={previewRef}
      className="p-6 prose prose-invert max-w-none"
    />
  );
}
```

- [ ] **Step 4: Create editor page**

```tsx
'use client';

import { useState } from 'react';
import MarkdownEditor from '@/components/editor/MarkdownEditor';
import PreviewPane from '@/components/editor/PreviewPane';

export default function EditorPage({ params }: { params: { id: string } }) {
  const [content, setContent] = useState('# Hello World\n\nThis is a **Markdown** editor with $LaTeX$ support.\n\n$$\nE = mc^2\n$$');
  const [showPreview, setShowPreview] = useState(true);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h1 className="text-xl font-semibold">编辑器</h1>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="px-3 py-1 rounded bg-surface hover:bg-surface-hover"
        >
          {showPreview ? '隐藏预览' : '显示预览'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        <div className={`${showPreview ? 'w-1/2' : 'w-full'} border-r border-border`}>
          <MarkdownEditor content={content} onChange={setContent} />
        </div>
        {showPreview && (
          <div className="w-1/2 overflow-auto bg-card">
            <PreviewPane content={content} />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat(editor): add Markdown/LaTeX editor with live preview"
```

---

### Task 10: 创建文献库页面

**Files:**
- Create: `src/components/library/LiteratureList.tsx`
- Create: `src/components/library/LiteratureCard.tsx`
- Create: `src/app/library/page.tsx`

- [ ] **Step 1: Create LiteratureCard.tsx**

```tsx
'use client';

import { Literature } from '@/lib/types';

interface LiteratureCardProps {
  literature: Literature;
  onSelect: (id: string) => void;
}

export default function LiteratureCard({ literature, onSelect }: LiteratureCardProps) {
  const statusColors: Record<string, string> = {
    Unread: 'bg-gray-500',
    Reading: 'bg-blue-500',
    Read: 'bg-green-500',
    ToRead: 'bg-yellow-500',
    Archived: 'bg-purple-500',
  };

  return (
    <div
      className="p-4 bg-card rounded-lg border border-border hover:border-primary cursor-pointer transition-colors"
      onClick={() => onSelect(literature.id)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-primary line-clamp-2">{literature.title}</h3>
        <span className={`px-2 py-0.5 text-xs rounded ${statusColors[literature.read_status] || 'bg-gray-500'}`}>
          {literature.read_status}
        </span>
      </div>

      <p className="text-sm text-secondary mb-2">
        {literature.authors.map(a => a.name).join(', ')}
      </p>

      {literature.abstract_text && (
        <p className="text-sm text-muted line-clamp-2 mb-2">
          {literature.abstract_text}
        </p>
      )}

      <div className="flex items-center gap-2 text-xs text-muted">
        {literature.year && <span>{literature.year}</span>}
        {literature.venue && <span>• {literature.venue}</span>}
        {literature.citation_count && <span>• {literature.citation_count} 引用</span>}
      </div>

      {literature.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {literature.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 text-xs bg-surface rounded">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create LiteratureList.tsx**

```tsx
'use client';

import { useState } from 'react';
import { Literature } from '@/lib/types';
import LiteratureCard from './LiteratureCard';

interface LiteratureListProps {
  onSelect: (id: string) => void;
}

export default function LiteratureList({ onSelect }: LiteratureListProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');

  // TODO: Load from backend
  const literature: Literature[] = [];

  const filtered = literature.filter(lit => {
    const matchesSearch = lit.title.toLowerCase().includes(search.toLowerCase()) ||
      lit.authors.some(a => a.name.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filter === 'all' || lit.read_status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-2xl font-bold mb-4">文献库</h1>

        <div className="flex gap-4">
          <input
            type="text"
            placeholder="搜索文献..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-primary"
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-primary"
          >
            <option value="all">全部</option>
            <option value="Unread">未读</option>
            <option value="Reading">阅读中</option>
            <option value="Read">已读</option>
            <option value="ToRead">待读</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto p-4">
        {filtered.length === 0 ? (
          <div className="text-center text-muted py-8">
            暂无文献。点击"添加文献"开始。
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(lit => (
              <LiteratureCard
                key={lit.id}
                literature={lit}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create library page**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import LiteratureList from '@/components/library/LiteratureList';

export default function LibraryPage() {
  const router = useRouter();

  return (
    <LiteratureList
      onSelect={(id) => router.push(`/reader/${id}`)}
    />
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/
git commit -m "feat(library): add literature library page with search and filter"
```

---

## Phase 5: Agent 集成

### Task 11: 创建 Agent 终端页面

**Files:**
- Create: `src/components/agent/AgentTerminal.tsx`
- Create: `src/components/agent/PersonalitySelector.tsx`
- Create: `src/app/agent/page.tsx`

- [ ] **Step 1: Create AgentTerminal.tsx**

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AgentTerminalProps {
  personality: string;
}

export default function AgentTerminal({ personality }: AgentTerminalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // TODO: Call Tauri backend
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `我是${personality}，正在处理您的请求："${userMessage}"`,
      }]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-2xl font-bold">Agent 终端</h1>
        <p className="text-secondary">当前个性：{personality}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted py-8">
            开始与 Agent 对话吧！
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border p-3 rounded-lg">
              <span className="animate-pulse">思考中...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="输入消息..."
            className="flex-1 px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-primary"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create PersonalitySelector.tsx**

```tsx
'use client';

import { AgentPersonality } from '@/lib/types';

interface PersonalitySelectorProps {
  personalities: AgentPersonality[];
  selected: string;
  onSelect: (id: string) => void;
}

export default function PersonalitySelector({
  personalities,
  selected,
  onSelect,
}: PersonalitySelectorProps) {
  return (
    <div className="p-4 border-b border-border">
      <h2 className="text-sm font-semibold mb-2 text-secondary">选择 Agent 个性</h2>
      <div className="flex gap-2">
        {personalities.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              selected === p.id
                ? 'bg-primary text-white'
                : 'bg-surface hover:bg-surface-hover text-secondary'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create agent page**

```tsx
'use client';

import { useState } from 'react';
import AgentTerminal from '@/components/agent/AgentTerminal';
import PersonalitySelector from '@/components/agent/PersonalitySelector';
import { AgentPersonality } from '@/lib/types';

const defaultPersonalities: AgentPersonality[] = [
  {
    id: '1',
    name: '严谨学者',
    description: '直言不讳，批判性高，追求准确',
    traits: { directness: 70, humor: 20, curiosity: 80, criticalness: 80, patience: 60, creativity: 40 },
    interaction_style: { proactive_questions: true, challenge_assumptions: true, suggest_alternatives: false, use_analogies: false, cite_sources: true },
    system_prompt: '你是一个严谨的学术助手。',
  },
  {
    id: '2',
    name: '激励导师',
    description: '幽默、好奇、鼓励探索',
    traits: { directness: 40, humor: 60, curiosity: 90, criticalness: 30, patience: 80, creativity: 70 },
    interaction_style: { proactive_questions: true, challenge_assumptions: false, suggest_alternatives: true, use_analogies: true, cite_sources: false },
    system_prompt: '你是一个激励型导师。',
  },
  {
    id: '3',
    name: '批判性思考者',
    description: '直接、质疑假设、推动深入思考',
    traits: { directness: 90, humor: 30, curiosity: 90, criticalness: 95, patience: 40, creativity: 60 },
    interaction_style: { proactive_questions: true, challenge_assumptions: true, suggest_alternatives: true, use_analogies: false, cite_sources: true },
    system_prompt: '你是一个批判性思考者。',
  },
];

export default function AgentPage() {
  const [selectedPersonality, setSelectedPersonality] = useState('1');

  const currentPersonality = defaultPersonalities.find(p => p.id === selectedPersonality);

  return (
    <div className="h-full flex flex-col">
      <PersonalitySelector
        personalities={defaultPersonalities}
        selected={selectedPersonality}
        onSelect={setSelectedPersonality}
      />
      <div className="flex-1">
        <AgentTerminal personality={currentPersonality?.name || 'Agent'} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/
git commit -m "feat(agent): add Agent terminal with personality selection"
```

---

### Task 12: 创建 Tauri IPC 命令

**Files:**
- Modify: `src-tauri/src/presentation/commands.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: Add new commands to commands.rs**

```rust
use crate::agent::AgentContext;
use crate::agent::personality::AgentPersonality;
use crate::application::dto::*;
use crate::domain::task_actor::TaskActor;
use tauri::State;

#[tauri::command]
pub async fn run_task(
    topic: String,
    files: Option<Vec<String>>,
    state: State<'_, crate::application::container::AppContainer>,
) -> Result<String, String> {
    let facade = state.facade();
    let task_id = facade.run_task(topic, files).await.map_err(|e| e.to_string())?;
    Ok(task_id.to_string())
}

#[tauri::command]
pub async fn resume_task(
    task_id: String,
    state: State<'_, crate::application::container::AppContainer>,
) -> Result<String, String> {
    let facade = state.facade();
    let task_id = uuid::Uuid::parse_str(&task_id).map_err(|e| e.to_string())?;
    facade.resume_task(task_id).await.map_err(|e| e.to_string())?;
    Ok("resumed".to_string())
}

#[tauri::command]
pub async fn get_task_status(
    task_id: String,
    state: State<'_, crate::application::container::AppContainer>,
) -> Result<String, String> {
    let facade = state.facade();
    let task_id = uuid::Uuid::parse_str(&task_id).map_err(|e| e.to_string())?;
    let status = facade.get_status(task_id).await.map_err(|e| e.to_string())?;
    Ok(serde_json::to_string(&status).map_err(|e| e.to_string())?)
}

// New commands

#[tauri::command]
pub async fn get_agent_context() -> Result<String, String> {
    let config_dir = AgentContext::default_config_dir();
    let context = AgentContext::load_from_path(&config_dir)
        .await
        .map_err(|e| e.to_string())?;
    Ok(serde_json::to_string(&context).map_err(|e| e.to_string())?)
}

#[tauri::command]
pub async fn get_agent_personalities() -> Result<String, String> {
    let personalities = vec![
        AgentPersonality::strict_scholar(),
        AgentPersonality::motivational_mentor(),
        AgentPersonality::critical_thinker(),
    ];
    Ok(serde_json::to_string(&personalities).map_err(|e| e.to_string())?)
}

#[tauri::command]
pub async fn get_current_theme() -> Result<String, String> {
    // TODO: Load from config
    Ok("midnight_scholar".to_string())
}

#[tauri::command]
pub async fn set_theme(theme_id: String) -> Result<(), String> {
    // TODO: Save to config
    Ok(())
}

#[tauri::command]
pub async fn list_plugins() -> Result<String, String> {
    // TODO: Load from plugin manager
    Ok("[]".to_string())
}
```

- [ ] **Step 2: Register commands in lib.rs**

```rust
mod agent;
mod application;
mod domain;
mod presentation;

pub use agent::*;
pub use application::*;
pub use domain::*;
pub use presentation::*;
```

- [ ] **Step 3: Register commands in main.rs**

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt};

fn main() {
    fmt::init();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            presentation::commands::run_task,
            presentation::commands::resume_task,
            presentation::commands::get_task_status,
            presentation::commands::get_agent_context,
            presentation::commands::get_agent_personalities,
            presentation::commands::get_current_theme,
            presentation::commands::set_theme,
            presentation::commands::list_plugins,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 4: Build to verify**

```bash
cd src-tauri && cargo build 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add src-tauri/
git commit -m "feat(tauri): add IPC commands for agent, theme, and plugins"
```

---

## Phase 6: 验证

### Task 13: 全量构建和测试

- [ ] **Step 1: Build all Rust crates**

```bash
cargo build 2>&1 | grep -E "(error|warning:.*unused)" | head -20
```
Expected: 0 errors

- [ ] **Step 2: Run all tests**

```bash
cargo test --workspace
```
Expected: All tests pass

- [ ] **Step 3: Build frontend**

```bash
cd src && npm run build
```
Expected: Build succeeds

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: verify full build and test suite"
```
