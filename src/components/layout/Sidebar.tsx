import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  FileText,
  Edit3,
  Bot,
  Settings,
  ChevronDown,
  Plus,
  Sun,
  Moon,
} from 'lucide-react';
import { useAppStore, type AppTheme } from '@/lib/store';

const quickAccess = [
  { to: '/library', label: '文献库', icon: BookOpen },
  { to: '/reader/1', label: '阅读器', icon: FileText },
  { to: '/editor/1', label: '编辑器', icon: Edit3 },
  { to: '/agent', label: 'Agent 对话', icon: Bot },
  { to: '/settings', label: '设置', icon: Settings },
];

const themes: { id: AppTheme; icon: typeof Sun; label: string }[] = [
  { id: 'ivory_press', icon: Sun, label: '浅色' },
  { id: 'midnight_scholar', icon: Moon, label: '暗色' },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const [recentExpanded, setRecentExpanded] = useState(true);
  const tasks = useAppStore((s) => s.tasks);
  const currentTaskId = useAppStore((s) => s.currentTaskId);
  const currentTheme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  const recentTasks = Object.values(tasks).slice(0, 5);
  const activeTask = currentTaskId ? tasks[currentTaskId] : null;

  const statusColors: Record<string, string> = {
    Pending: 'bg-text-muted',
    Researching: 'bg-info',
    Analyzing: 'bg-warning',
    Writing: 'bg-primary',
    AnalyzingAndWriting: 'bg-warning',
    Completed: 'bg-success',
    Failed: 'bg-error',
  };

  const agentLabels: Record<string, string> = {
    Researcher: 'Researcher',
    Analyst: 'Analyst',
    Writer: 'Writer',
  };

  return (
    <aside className="w-[260px] h-screen bg-surface border-r border-border flex flex-col shrink-0">
      <div className="h-12 px-4 flex items-center border-b border-border">
        <h1 className="text-sm font-semibold text-primary tracking-tight">CiteForge</h1>
        <span className="ml-2 text-[11px] text-text-muted font-medium">v0.1</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {recentTasks.length > 0 && (
          <div className="p-3">
            <button
              onClick={() => setRecentExpanded(!recentExpanded)}
              className="flex items-center justify-between w-full text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2 hover:text-text-secondary"
            >
              <span>最近项目</span>
              <ChevronDown
                size={12}
                className={`transition-transform ${recentExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            {recentExpanded && (
              <div className="space-y-0.5">
                {recentTasks.map((task) => {
                  const isActive = task.id === currentTaskId;
                  return (
                    <button
                      key={task.id}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[13px] text-left transition-all ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isActive ? 'bg-primary' : 'bg-text-muted'
                        }`}
                      />
                      <span className="truncate flex-1">{task.topic}</span>
                      <span className="text-[10px] text-text-muted shrink-0">
                        {Math.round(task.progress * 100)}%
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTask && (
          <div className="px-3 pb-3">
            <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">
              当前任务
            </div>
            <div className="p-3 bg-card border border-border rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-1">
                  {[0.25, 0.5, 0.75, 1.0].map((threshold, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        activeTask.progress >= threshold
                          ? statusColors[activeTask.status] || 'bg-primary'
                          : 'bg-surface-hover'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-text-secondary">
                  {agentLabels[activeTask.currentAgent || ''] || activeTask.status}
                </span>
              </div>
              <div className="w-full h-1 bg-surface-hover rounded-full overflow-hidden mb-1">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${activeTask.progress * 100}%` }}
                />
              </div>
              {activeTask.lastAction && (
                <p className="text-[11px] text-text-muted truncate">{activeTask.lastAction}</p>
              )}
            </div>
          </div>
        )}

        <div className="px-3 pb-3">
          <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">
            快速入口
          </div>
          <div className="space-y-0.5">
            {quickAccess.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-[13px] transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-primary' : 'text-text-muted'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-border">
        <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">
          主题切换
        </div>
        <div className="flex gap-2">
          {themes.map((t) => {
            const Icon = t.icon;
            const isActive = currentTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-[12px] transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'bg-surface-hover text-text-secondary hover:bg-surface-hover/80'
                }`}
              >
                <Icon size={12} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}