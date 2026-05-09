# Dashboard v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Home page into a research dashboard with Quick Start cards, Active Reviews with phase badges + micro progress bars, Recent Activity feed, and embedded Stats (work time + word count).

**Architecture:** Frontend-only MVP (Zustand store, React hooks) with one new Rust command for draft stats. Stats embedded in Home (not standalone route). Activity tracking via localStorage.

**Tech Stack:** React, Zustand, Tailwind CSS, Tauri IPC

---

## File Map

| File | Action |
|------|--------|
| `src/lib/store.ts` | Modify - add `activities` array + `addActivity` action |
| `src/hooks/useActivityTracker.ts` | Create - frontend activity tracking with localStorage |
| `src/components/ui/StatusBadge.tsx` | Create - phase badge component |
| `src/components/ui/ProgressRing.tsx` | Create - circular progress (CSS-based) |
| `src/pages/Home.tsx` | Modify - full redesign |
| `src-tauri/src/presentation/commands.rs` | Modify - add `get_draft_stats` command |

---

## Task 1: Zustand Store - Add Activities

**Files:**
- Modify: `src/lib/store.ts`
- Test: Manual - verify activity appears in Home

- [ ] **Step 1: Add Activity interface and store slice**

Find `interface AppStore` in store.ts and add:

```typescript
interface Activity {
  id: string;
  timestamp: number;
  type: 'task_created' | 'literature_added' | 'draft_generated' | 'checkpoint_reached';
  description: string;
  taskId?: string;
}
```

Find the store implementation and add:

```typescript
activities: Activity[];
addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
```

- [ ] **Step 2: Implement addActivity action**

In the `create<AppStore>((set) => ({` block, add:

```typescript
activities: [],

addActivity: (activity) =>
  set((state) => ({
    activities: [
      {
        ...activity,
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
      },
      ...state.activities.slice(0, 19), // Keep last 20
    ],
  })),
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/store.ts
git commit -m "feat(store): add activities array and addActivity action"
```

---

## Task 2: useActivityTracker Hook

**Files:**
- Create: `src/hooks/useActivityTracker.ts`
- Test: Verify localStorage entries

- [ ] **Step 1: Create hook file**

Create `src/hooks/useActivityTracker.ts`:

```typescript
import { useEffect, useRef, useCallback } from 'react';

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function useActivityTracker() {
  const lastActiveRef = useRef(Date.now());
  const accumulatedRef = useRef(0);

  const recordActivity = useCallback(() => {
    const now = Date.now();
    const idle = now - lastActiveRef.current;

    if (idle < IDLE_TIMEOUT && idle > 0) {
      accumulatedRef.current += idle;
    }
    lastActiveRef.current = now;
  }, []);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'mousemove', 'touchstart'];
    events.forEach(e => window.addEventListener(e, recordActivity, { passive: true }));

    // Persist every minute
    const interval = setInterval(() => {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const stored = localStorage.getItem(`worktime-${today}`);
      const current = stored ? parseInt(stored, 10) : 0;
      const minutes = Math.floor(accumulatedRef.current / 1000 / 60);
      if (minutes > 0) {
        localStorage.setItem(`worktime-${today}`, String(current + minutes));
        accumulatedRef.current = 0;
      }
    }, 60 * 1000);

    return () => {
      events.forEach(e => window.removeEventListener(e, recordActivity));
      clearInterval(interval);
    };
  }, [recordActivity]);

  return { recordActivity };
}

export function getWorkTimeForDay(date: string): number {
  const stored = localStorage.getItem(`worktime-${date}`);
  return stored ? parseInt(stored, 10) : 0;
}

export function getWeekData(): { date: string; label: string; minutes: number }[] {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  const result = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    result.push({
      date: dateStr,
      label: days[d.getDay()],
      minutes: getWorkTimeForDay(dateStr),
    });
  }

  return result;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useActivityTracker.ts
git commit -m "feat(hooks): add useActivityTracker with localStorage persistence"
```

---

## Task 3: StatusBadge Component

**Files:**
- Create: `src/components/ui/StatusBadge.tsx`
- Test: Import in Home, verify renders

- [ ] **Step 1: Create StatusBadge component**

Create `src/components/ui/StatusBadge.tsx`:

```typescript
import { type FC } from 'react';

type Phase = 'researching' | 'analyzing' | 'writing' | 'checkpoint' | 'completed' | 'pending';

interface StatusBadgeProps {
  phase: Phase;
  size?: 'sm' | 'md';
}

const phaseConfig: Record<Phase, { label: string; className: string }> = {
  researching: { label: '文献检索中', className: 'bg-info/20 text-info' },
  analyzing: { label: '分析中', className: 'bg-purple-500/20 text-purple-400' },
  writing: { label: '写作中', className: 'bg-success/20 text-success' },
  checkpoint: { label: '等待确认', className: 'bg-warning/20 text-warning' },
  completed: { label: '已完成', className: 'bg-text-muted/20 text-text-muted' },
  pending: { label: '待开始', className: 'bg-surface-hover text-text-muted' },
};

export const StatusBadge: FC<StatusBadgeProps> = ({ phase, size = 'md' }) => {
  const config = phaseConfig[phase] || phaseConfig.pending;
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span className={`inline-flex items-center rounded ${config.className} ${sizeClass}`}>
      {config.label}
    </span>
  );
};

// Helper to map task status to phase
export function taskStatusToPhase(status: string): Phase {
  const map: Record<string, Phase> = {
    Pending: 'pending',
    Researching: 'researching',
    Analyzing: 'analyzing',
    Writing: 'writing',
    AnalyzingAndWriting: 'writing',
    Completed: 'completed',
    Failed: 'pending',
  };
  return map[status] || 'pending';
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/StatusBadge.tsx
git commit -m "feat(ui): add StatusBadge component for phase labels"
```

---

## Task 4: ProgressRing Component (CSS-based)

**Files:**
- Create: `src/components/ui/ProgressRing.tsx`
- Test: Import in Home

- [ ] **Step 1: Create CSS-based ProgressRing**

Create `src/components/ui/ProgressRing.tsx`:

```typescript
import { type FC } from 'react';

interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
}

export const ProgressRing: FC<ProgressRingProps> = ({
  value,
  size = 40,
  strokeWidth = 3,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-surface-hover"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-primary transition-all duration-500"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <span className="absolute text-[10px] font-medium text-text-secondary">
        {Math.round(value)}%
      </span>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/ProgressRing.tsx
git commit -m "feat(ui): add CSS-based ProgressRing component"
```

---

## Task 5: Home.tsx Redesign

**Files:**
- Modify: `src/pages/Home.tsx`
- Test: Run `npm run dev`, verify layout

- [ ] **Step 1: Replace Home.tsx content**

Replace the entire content of `src/pages/Home.tsx` with:

```typescript
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import {
  FileText,
  Globe,
  Plus,
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle,
  Clock,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import { StatusBadge, taskStatusToPhase } from '@/components/ui/StatusBadge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useAppStore } from '@/lib/store';
import { getWeekData, getWorkTimeForDay } from '@/hooks/useActivityTracker';
import type { Literature } from '@/lib/types';

interface HomeProps {
  recentLiterature?: Literature[];
}

export default function Home({ recentLiterature = [] }: HomeProps) {
  const navigate = useNavigate();
  const tasks = useAppStore((s) => s.tasks);
  const addActivity = useAppStore((s) => s.addActivity);

  const activeReviews = Object.values(tasks);
  const today = new Date().toISOString().slice(0, 10);
  const weekData = getWeekData();
  const todayMinutes = getWorkTimeForDay(today);

  const quickStart = [
    {
      emoji: '📄',
      label: '导入 PDF',
      desc: '从本地文件开始新的综述',
      action: async () => {
        const selected = await open({ multiple: true, filters: [{ name: 'PDF', extensions: ['pdf'] }] });
        if (selected && selected.length > 0) {
          addActivity({ type: 'task_created', description: `导入 ${selected.length} 个 PDF`, taskId: undefined });
          navigate('/library');
        }
      },
    },
    {
      emoji: '🌐',
      label: 'Semantic Scholar',
      desc: '搜索并导入在线文献',
      action: () => navigate('/library'),
    },
    {
      emoji: '➕',
      label: '新建空白综述',
      desc: '从头开始创作',
      action: async () => {
        try {
          const result = await invoke<{ task_id: string }>('run_task', { topic: '新综述', pdfPaths: [] });
          addActivity({ type: 'task_created', description: '创建新综述任务', taskId: result.task_id });
          navigate(`/editor/${result.task_id}`);
        } catch (e) {
          console.error('Failed to create task:', e);
        }
      },
    },
  ];

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const totalWeekMinutes = weekData.reduce((sum, d) => sum + d.minutes, 0);
  const completedCount = activeReviews.filter(t => t.status === 'Completed').length;
  const totalWords = 0; // Will be populated by get_draft_stats

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-text-primary mb-1">欢迎回来</h1>
          <p className="text-sm text-text-muted">
            {activeReviews.length > 0 ? `${activeReviews.length} 个进行中的综述` : '开始你的学术研究之旅'}
          </p>
        </div>

        {/* Quick Start */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {quickStart.map((item) => (
            <Card
              key={item.label}
              clickable
              className="p-4 cursor-pointer hover:border-primary/30 transition-colors"
              onClick={item.action}
            >
              <div className="text-2xl mb-2">{item.emoji}</div>
              <h3 className="font-medium text-text-primary">{item.label}</h3>
              <p className="text-xs text-text-muted mt-1">{item.desc}</p>
            </Card>
          ))}
        </div>

        {/* Active Reviews */}
        <div className="mb-8">
          <h2 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-3">
            进行中的综述
          </h2>

          {activeReviews.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-text-muted">暂无进行中的综述，点击上方开始</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeReviews.map((task) => {
                const phase = taskStatusToPhase(task.status);
                const progress = Math.round((task.progress || 0) * 100);
                const estimate = Math.round((1 - (task.progress || 0)) * 30);

                return (
                  <Card key={task.id} clickable className="p-4 group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-text-primary truncate">
                          {task.topic || '未命名综述'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge phase={phase} />
                          <span className="text-xs text-text-muted">
                            预计 {estimate > 0 ? `${estimate} 分钟` : '即将完成'}
                          </span>
                        </div>
                      </div>
                      <ProgressRing value={progress} size={44} />
                    </div>

                    <div className="mt-3">
                      <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      {task.lastAction && (
                        <p className="text-[11px] text-text-muted mt-1 truncate">
                          {task.lastAction}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Link
                        to={`/editor/${task.id}`}
                        className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                      >
                        继续
                      </Link>
                      <button className="text-xs px-3 py-1.5 text-text-muted hover:text-text-secondary transition-colors">
                        查看详情
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <h2 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-3">
            最近活动
          </h2>
          <Card className="p-3">
            <ActivityFeed />
          </Card>
        </div>

        {/* Stats */}
        <div>
          <h2 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-3">
            写作统计
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Work Time Chart */}
            <Card className="p-4">
              <h3 className="text-xs font-medium text-text-secondary mb-3">本周工作时长</h3>
              <div className="h-24 flex items-end gap-1">
                {weekData.map((day, i) => {
                  const maxMinutes = 240;
                  const height = Math.min((day.minutes / maxMinutes) * 100, 100);
                  const isToday = day.date === today;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-t transition-all hover:bg-primary/40 ${
                          isToday ? 'bg-primary/30' : 'bg-primary/20'
                        }`}
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                      <span className={`text-[10px] ${isToday ? 'text-primary font-medium' : 'text-text-muted'}`}>
                        {day.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-text-muted">
                <span>今日: {formatMinutes(todayMinutes)}</span>
                <span>本周: {formatMinutes(totalWeekMinutes)}</span>
              </div>
            </Card>

            {/* Writing Output */}
            <Card className="p-4">
              <h3 className="text-xs font-medium text-text-secondary mb-3">写作产出</h3>
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
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const config: Record<string, { icon: typeof BookOpen; className: string }> = {
    task_created: { icon: Plus, className: 'text-primary' },
    literature_added: { icon: BookOpen, className: 'text-info' },
    draft_generated: { icon: FileText, className: 'text-success' },
    checkpoint_reached: { icon: CheckCircle, className: 'text-warning' },
  };
  const { icon: Icon, className } = config[type] || config.task_created;
  return <Icon size={12} className={className} />;
}

function ActivityFeed() {
  const activities = useAppStore((s) => s.activities);

  if (activities.length === 0) {
    return <p className="text-xs text-text-muted text-center py-2">暂无活动记录</p>;
  }

  return (
    <div className="space-y-2">
      {activities.slice(0, 5).map((a) => (
        <div key={a.id} className="flex items-center gap-2 text-xs">
          <ActivityIcon type={a.type} />
          <span className="text-text-muted shrink-0">
            {new Date(a.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-text-secondary truncate">{a.description}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat(home): full redesign with Quick Start, Active Reviews, Activity, Stats"
```

---

## Task 6: Rust Command - get_draft_stats

**Files:**
- Modify: `src-tauri/src/presentation/commands.rs`
- Test: `cargo check`, then test via frontend

- [ ] **Step 1: Add DraftStats struct and command**

Add after the existing imports in `commands.rs`:

```rust
#[derive(Debug, Serialize)]
pub struct DraftStats {
    pub total_words: u32,
    pub total_chars: u32,
    pub last_modified: Option<u64>,
}
```

Find the `get_task_status` command and add after it:

```rust
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

    let last_modified = draft_path
        .metadata()
        .ok()
        .and_then(|m| m.modified().ok())
        .map(|t| t.duration_since(std::time::UNIX_EPOCH).unwrap().as_secs());

    Ok(DraftStats {
        total_words: word_count,
        total_chars: char_count,
        last_modified,
    })
}
```

- [ ] **Step 2: Register command in lib.rs**

Check `src-tauri/src/lib.rs` and ensure `get_draft_stats` is exported:

```rust
pub use presentation::commands::{run_task, resume_task, get_task_status, get_draft_stats};
```

- [ ] **Step 3: Verify compilation**

```bash
cd /mnt/c/Users/10954/Desktop/Projects/CiteForge
cargo check
```

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src-tauri/src/presentation/commands.rs src-tauri/src/lib.rs
git commit -m "feat(commands): add get_draft_stats for word count"
```

---

## Task 7: Integrate Word Count in Home

**Files:**
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Add get_draft_stats call**

In Home.tsx, add state and effect:

```typescript
const [totalWords, setTotalWords] = useState(0);

useEffect(() => {
  const fetchDraftStats = async () => {
    try {
      const currentTaskId = Object.keys(tasks)[0]; // First task as example
      if (currentTaskId) {
        const stats = await invoke<{ total_words: number }>('get_draft_stats', {
          workspace_id: currentTaskId
        });
        setTotalWords(stats.total_words);
      }
    } catch (e) {
      console.error('Failed to fetch draft stats:', e);
    }
  };
  fetchDraftStats();
}, [tasks]);
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat(home): integrate get_draft_stats for word count display"
```

---

## Verification Checklist

After all tasks complete:

- [ ] `npm run dev` starts without errors
- [ ] Home page shows Quick Start cards (3 cards in grid)
- [ ] Active Reviews section shows tasks with StatusBadge + ProgressRing
- [ ] Recent Activity shows when triggered
- [ ] Stats section shows weekly bar chart
- [ ] `cargo check` passes with no errors
- [ ] `get_draft_stats` command works (check via Tauri devtools)

---

## Spec Coverage Check

| Spec Section | Task(s) |
|--------------|---------|
| Quick Start cards | Task 5 |
| Active Reviews with phase badges | Tasks 3, 5 |
| Progress Ring | Task 4 |
| Recent Activity feed | Tasks 1, 5 |
| Weekly bar chart | Tasks 2, 5 |
| Writing output stats | Task 5, 7 |
| get_draft_stats command | Task 6 |
| Zustand activities store | Task 1 |
| useActivityTracker | Task 2 |

---

## Execution Options

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks

**2. Inline Execution** - Execute tasks in this session using executing-plans

Which approach?
