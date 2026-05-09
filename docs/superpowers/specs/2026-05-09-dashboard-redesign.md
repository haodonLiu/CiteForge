# Dashboard Redesign Spec (v3)

## Overview

Transform the home page into a research dashboard that matches academic workflows, not task management conventions.

## Design Principles

1. **Naming reflects academic context** — "Active Reviews" not "TODO List"
2. **Rich progress visualization** — Phase labels + micro progress bars, not 4 dots
3. **Stats embedded, not standalone** — Weekly bar charts (not GitHub heatmap)
4. **Auto data, not manual input** — Word count from draft.md, work time from activity tracking

---

## Page: Home (`/`) — Research Dashboard

### Section 1: Quick Start (Top, always visible for new users)

Three cards in a grid with explicit click behaviors:

| Card | Label | Click Behavior |
|------|-------|----------------|
| 📄 | 导入 PDF | Open system file picker (`dialog.open`), multi-select PDFs, create task, navigate to Library |
| 🌐 | Semantic Scholar | Open search modal or navigate to Library with search focused |
| ➕ | 新建空白综述 | Create empty task, navigate to Editor |

```tsx
// Quick Start click handlers
const handleImportPdf = async () => {
  const selected = await open({ multiple: true, filters: [{ name: 'PDF', extensions: ['pdf'] }] });
  if (selected) {
    const task = await invoke('create_task', { sources: selected });
    navigate(`/library?task=${task.id}`);
  }
};

const handleNewReview = async () => {
  const task = await invoke('create_task', {});
  navigate(`/editor/${task.id}`);
};
```

### Section 2: Active Reviews (Core content)

**Naming**: "进行中的综述" not "TODO List"

Each task displayed as a card with:
- **Review Title** (not "task topic")
- **Phase Badge** — Human-readable label:
  - `researching` → 蓝色 "文献检索中"
  - `analyzing` → 紫色 "分析中"
  - `writing` → 绿色 "写作中"
  - `checkpoint` → 琥珀色 "等待确认"
  - `completed` → 灰色 "已完成"
- **Micro Progress Bar** — Shows细分进度 within current agent
- **Current Action** — e.g., "正在比较论文 #12 和 #23 的相似度..."
- **Estimated Time** — Based on remaining progress
- **Action Buttons** — 继续 / 查看详情

**Progress Ring** (optional): Circular progress indicator in top-right of card.

**Empty State**: "暂无进行中的综述，点击上方开始"

```tsx
// Task card structure
<Card className="p-4">
  <div className="flex items-start justify-between">
    <div>
      <h3 className="font-medium text-text-primary">{task.topic}</h3>
      <div className="flex items-center gap-2 mt-1">
        <StatusBadge phase={task.phase} />
        <span className="text-xs text-text-muted">预计 {estimate} 分钟</span>
      </div>
    </div>
    <ProgressRing value={task.progress * 100} size={40} />
  </div>

  <div className="mt-3">
    <div className="h-1.5 bg-surface rounded-full overflow-hidden">
      <div className="h-full bg-primary transition-all" style={{ width: `${task.progress * 100}%` }} />
    </div>
    <p className="text-[11px] text-text-muted mt-1">{task.currentAction}</p>
  </div>

  <div className="flex gap-2 mt-3">
    <Button size="sm">继续</Button>
    <Button size="sm" variant="ghost">查看详情</Button>
  </div>
</Card>
```

### Section 3: Recent Activity (Bottom)

**Data Source**: Zustand store `activities` array (MVP, session-only)

```ts
// src/lib/store.ts
interface Activity {
  id: string;
  timestamp: number;
  type: 'task_created' | 'literature_added' | 'draft_generated' | 'checkpoint_reached';
  description: string;  // "导入 3 篇 PDF"
  taskId?: string;
}

activities: Activity[];
addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
```

**Rendering**: Icon + HH:MM + description
- 📝 写作 / 📚 文献 / 🤖 Agent / ✅ 完成

```tsx
<div className="space-y-2">
  {activities.map((a) => (
    <div key={a.id} className="flex items-center gap-2 text-xs">
      <ActivityIcon type={a.type} />
      <span className="text-text-muted">{formatTime(a.timestamp)}</span>
      <span className="text-text-secondary">{a.description}</span>
    </div>
  ))}
</div>
```

**Future**: Migrate to SQLite-backed event log when `events.log` architecture lands.

---

## Stats: Embedded in Home (not standalone page)

### Work Time — Weekly Bar Chart (not GitHub heatmap)

**Why**: Academic writing is episodic, not daily. Blank heatmap cells create anxiety.

**Implementation**: `useActivityTracker` hook with localStorage persistence.

```tsx
// src/hooks/useActivityTracker.ts
const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 分钟无操作视为离开

export function useActivityTracker() {
  const lastActive = useRef(Date.now());
  const todayMinutes = useRef(0);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'mousemove'];

    const updateActivity = () => {
      const now = Date.now();
      const idle = now - lastActive.current;
      if (idle < IDLE_TIMEOUT) {
        todayMinutes.current += idle / 1000 / 60;
      }
      lastActive.current = now;
    };

    // 每分钟保存到 localStorage
    const interval = setInterval(() => {
      const today = new Date().toISOString().slice(0, 10);
      const stored = localStorage.getItem(`worktime-${today}`);
      const current = stored ? parseInt(stored, 10) : 0;
      localStorage.setItem(`worktime-${today}`, Math.floor(current + todayMinutes.current));
      todayMinutes.current = 0;
    }, 60 * 1000);

    events.forEach(e => window.addEventListener(e, updateActivity, { passive: true });
    return () => {
      clearInterval(interval);
      events.forEach(e => window.removeEventListener(e, updateActivity));
    };
  }, []);

  return { todayMinutes }; // Pass to Stats component
}
```

**Weekly aggregation**: Sum localStorage entries for the past 7 days.

```tsx
<div className="h-32 flex items-end gap-1">
  {weekData.map((day, i) => (
    <div key={i} className="flex-1 flex flex-col items-center gap-1">
      <div
        className="w-full bg-primary/20 rounded-t hover:bg-primary/40 transition-all"
        style={{ height: `${(day.minutes / 240) * 100}%` }}
      />
      <span className="text-[10px] text-text-muted">{day.label}</span>
    </div>
  ))}
</div>
```

### Writing Output — Auto Stats (not manual input)

```tsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <div className="text-2xl font-semibold text-text-primary">{totalWords.toLocaleString()}</div>
    <div className="text-xs text-text-muted">总字数</div>
  </div>
  <div>
    <div className="text-2xl font-semibold text-text-primary">{completedCount}</div>
    <div className="text-xs text-text-muted">完成综述</div>
  </div>
</div>
```

**"本周新增" deferred**: Requires snapshot history. Will implement when `events.log` architecture lands.

**Data Sources**:
- Work time: `useActivityTracker` hook with localStorage
- Word count: `invoke('get_draft_stats')` from Rust backend
- Completed count: `Object.values(tasks).filter(t => t.status === 'Completed').length`

---

## Rust Backend: New Commands

### `get_draft_stats` command

**File**: `src-tauri/src/presentation/commands.rs`

```rust
#[derive(Serialize)]
pub struct DraftStats {
    pub total_words: u32,
    pub total_chars: u32,
    pub last_modified: Option<u64>,
}

#[tauri::command]
pub async fn get_draft_stats(
    workspace_id: String,
    container: State<'_, Arc<AppContainer>>,
) -> Result<DraftStats, String> {
    let workspace = container.workspace().load(&workspace_id).map_err(|e| e.to_string())?;
    let draft_path = workspace.path().join("draft.md");

    let content = tokio::fs::read_to_string(&draft_path).await.unwrap_or_default();
    let word_count = content.split_whitespace().count() as u32;
    let char_count = content.chars().count() as u32;

    Ok(DraftStats {
        total_words: word_count,
        total_chars: char_count,
        last_modified: draft_path.metadata()
            .ok()
            .and_then(|m| m.modified().ok())
            .map(|t| t.duration_since(std::time::UNIX_EPOCH).unwrap().as_secs()),
    })
}
```

**Frontend call**:

```ts
const [draftStats, setDraftStats] = useState({ total_words: 0, total_chars: 0 });

useEffect(() => {
  if (currentTaskId) {
    invoke<{ total_words: number; total_chars: number }>('get_draft_stats', {
      workspace_id: currentTaskId
    }).then(setDraftStats);
  }
}, [currentTaskId]);
```

---

## TitleBar Integration

TitleBar is a standalone component. Simpler approach: detect route in TitleBar itself.

```tsx
// TitleBar.tsx
const { pathname } = useLocation();

// Show task info only on home page
const showTaskStatus = pathname === '/';
```

No global state needed. Task status in TitleBar comes from existing `useAppStore()`.

---

## Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  CiteForge    [文献] [写作] [Agent]   |  13:42     │  ← TitleBar
├──────┬────────────────────────────────────────────┤
│      │  欢迎回来                                    │
│ 侧边 │  ┌────────┬────────┬────────┐              │
│ 栏   │  │ 📄 导入 │ 🌐 搜索 │ ➕ 新建 │  Quick Start │
│      │  └────────┴────────┴────────┘              │
│ 文献 │                                            │
│ 阅读 │  进行中的综述                                │
│ 编辑 │  ┌──────────────────────────────────────┐  │
│ Agent│  │ LLM Agents 综述           [35%] ⭕    │  │
│ 设置 │  │ 🔵 文献检索中  预计 8 分钟            │  │
│      │  │ ████████░░░░░░░░░░  35%              │  │
│      │  │ 正在比较论文 #12 和 #23 的相似度...   │  │
│      │  │ [继续]  [查看详情]                    │  │
│      │  └──────────────────────────────────────┘  │
│      │                                            │
│      │  最近活动                                   │
│      │  📚 13:42 导入 3 篇文献                    │
│      │  🤖 13:30 Agent 阶段完成                   │
│      │                                            │
│      │  ─────────────────────────────────────    │
│      │  本周工作时长    写作产出                    │
│      │  ▓▓▓▓░░▓▓▓░░    总字数: 8,432             │
│      │  周 一 二 三 四 五 六  本周: 12h             │
└──────┴────────────────────────────────────────────┘
```

---

## Component Changes

| File | Change |
|------|--------|
| `Home.tsx` | Full redesign: Quick Start + Active Reviews + Activity + Stats |
| `store.ts` | Add `activities` array + `addActivity` action |
| `Sidebar.tsx` | No change |
| `App.tsx` | No change |
| `components/ui/StatusBadge.tsx` | New component for phase labels |
| `components/ui/ProgressRing.tsx` | New (optional, can use CSS) |
| `hooks/useActivityTracker.ts` | New - frontend activity tracking |
| `src-tauri/src/presentation/commands.rs` | Add `get_draft_stats` command |

---

## Out of Scope (MVP)

- "本周新增" word count (requires snapshot history)
- Persisting activities to SQLite (方案 B)
- Dark theme heatmap optimization
- Mobile responsive layout
- System idle detection (future: use Rust `onFocusChanged` API)
