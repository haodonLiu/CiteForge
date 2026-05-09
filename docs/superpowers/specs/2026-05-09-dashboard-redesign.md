# Dashboard Redesign Spec (Revised)

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

Three cards in a grid:
- **导入 PDF** — Start from local files
- **Semantic Scholar** — Search and import online
- **新建空白综述** — Create from scratch

```tsx
<div className="grid grid-cols-3 gap-4 mb-8">
  {quickStart.map((item) => (
    <Card key={item.label} clickable className="p-4">
      <div className="text-2xl mb-2">{item.emoji}</div>
      <h3 className="font-medium text-text-primary">{item.label}</h3>
      <p className="text-xs text-text-muted mt-1">{item.desc}</p>
    </Card>
  ))}
</div>
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

**Future**: Migrate to SQLite-backed event log (方案 B) when `events.log` architecture lands.

---

## Stats: Embedded in Home (not standalone page)

### Work Time — Weekly Bar Chart (not GitHub heatmap)

**Why**: Academic writing is episodic, not daily. Blank heatmap cells create anxiety.

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
<div className="flex justify-between mt-2 text-xs text-text-muted">
  <span>今日: 2.5 小时</span>
  <span>本周: 12 小时</span>
</div>
```

### Writing Output — Auto Stats (not manual input)

```tsx
<div className="grid grid-cols-3 gap-4">
  <div>
    <div className="text-2xl font-semibold text-text-primary">8,432</div>
    <div className="text-xs text-text-muted">总字数</div>
  </div>
  <div>
    <div className="text-2xl font-semibold text-text-primary">1,205</div>
    <div className="text-xs text-text-muted">本周新增</div>
  </div>
  <div>
    <div className="text-2xl font-semibold text-text-primary">3</div>
    <div className="text-xs text-text-muted">完成综述</div>
  </div>
</div>
```

**Data Sources**:
- Work time: Frontend activity tracking (mouse/keyboard events, 5-min idle timeout)
- Word count: Rust backend reads `draft.md` and counts words (`invoke('get_draft_stats')`)

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
│      │  周 一 二 三 四 五 六  本周: 12h            │
└──────┴────────────────────────────────────────────┘
```

---

## Architecture Notes

### TitleBar Integration
- Home page shows status (time / task name) in center
- Stats is embedded, not separate page → no TitleBar changes needed

### Theme Adaptation
- Light theme: primary color (green/teal)
- Dark theme: use lower-opacity variants to avoid harsh contrast
- Activity icons: adapt colors per theme

### Real-time Updates
- Task progress bars update via `task-event` Tauri events
- `useTaskEvents` hook already exists, no new infrastructure needed

---

## Component Changes

| File | Change |
|------|--------|
| `Home.tsx` | Full redesign: Quick Start + Active Reviews + Activity + Stats |
| `store.ts` | Add `activities` array + `addActivity` action |
| `Sidebar.tsx` | No change (Stats not in sidebar) |
| `App.tsx` | No change (no new route) |
| `components/ui/ProgressRing.tsx` | New component (optional, can use CSS) |
| `components/ui/StatusBadge.tsx` | New component for phase labels |

## Data Sources

- Tasks: `useAppStore().tasks`
- Activities: `useAppStore().activities` (Zustand, session-only)
- Work time: Frontend activity tracking (existing `recordActivity` + idle detection)
- Word count: `invoke('get_draft_stats')` from Rust backend

## Out of Scope (MVP)

- Persisting activities to SQLite (方案 B)
- Dark theme heatmap optimization
- Mobile responsive layout
