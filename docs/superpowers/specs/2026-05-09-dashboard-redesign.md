# Dashboard Redesign Spec

## Overview

Transform the home page into a two-page dashboard: a task-focused start panel and a statistics panel.

## Pages

### Page 1: Home (`/`) — Start Panel

**TODO List Section**
- Display all tasks as cards with:
  - Progress indicator (4 dots: 25%, 50%, 75%, 100%)
  - Task topic (truncated)
  - Current status/agent label
  - Progress bar

**Recent Activity Section**
- List of recent actions (literature added, status changes, draft generated)
- Format: `HH:MM description`

### Page 2: Stats (`/stats`) — Statistics Panel

**Work Time Statistics (GitHub-style)**
- Contribution heatmap grid (days as rows, weeks as columns)
- Cell intensity based on work duration
- Summary: Today / This Week / This Month
- Manual input word count display

**Literature Statistics**
- Total count
- Recently added count
- Category breakdown (if tags exist)

## Components

| File | Change |
|------|--------|
| `Home.tsx` | Refactor to show task cards + activity feed |
| `Stats.tsx` | New file for statistics page |
| `Sidebar.tsx` | Add "统计" to quickAccess nav |
| `App.tsx` | Add route `/stats` → `<Stats />` |
| `store.ts` | No changes (reuse existing data) |

## Data Sources

- Tasks: `useAppStore().tasks`
- Time tracking: `invoke('get_time_status')`
- Word count: `invoke('get_time_status')` (extend if needed)

## Visual Style

- Consistent with existing UI components (Card, colors from theme)
- Compact layout for information density
- Responsive grid for stats charts
