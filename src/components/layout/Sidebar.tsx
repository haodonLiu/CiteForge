import { useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Settings,
  ChevronDown,
  Plus,
  Sun,
  Moon,
  FolderOpen,
} from 'lucide-react';
import { useAppStore, type AppTheme } from '@/lib/store';
import { invoke, isTauri } from '@/lib/tauri';

const globalNav = [
  { to: '/', label: '工作台', icon: Home },
  { to: '/library', label: '文献库', icon: BookOpen },
  { to: '/settings', label: '设置', icon: Settings },
];

const themes: { id: AppTheme; icon: typeof Sun; label: string }[] = [
  { id: 'ivory_press', icon: Sun, label: '浅色' },
  { id: 'midnight_scholar', icon: Moon, label: '暗色' },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [recentExpanded, setRecentExpanded] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const tasks = useAppStore((s) => s.tasks);
  const currentTaskId = useAppStore((s) => s.currentTaskId);
  const currentTheme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const setCurrentTask = useAppStore((s) => s.setCurrentTask);
  const addActivity = useAppStore((s) => s.addActivity);

  const recentTasks = Object.values(tasks).slice(0, 5);

  const handleNewProject = useCallback(async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      if (isTauri) {
        const result = await invoke<{ task_id: string }>('run_task', {
          topic: '新综述',
          pdfPaths: [],
        });
        if (result?.task_id) {
          // @ts-ignore — addTask exists on store
          useAppStore.getState().addTask({
            id: result.task_id,
            topic: '新综述',
            status: 'Pending',
            progress: 0,
          });
          addActivity({
            type: 'task_created',
            description: '创建新综述任务',
            taskId: result.task_id,
          });
          setCurrentTask(result.task_id);
          navigate(`/task/${result.task_id}`);
        }
      } else {
        // Browser dev mode: create mock task
        const mockId = `task-${Date.now()}`;
        // @ts-ignore — addTask exists on store
        useAppStore.getState().addTask({
          id: mockId,
          topic: '新综述',
          status: 'Pending',
          progress: 0,
        });
        addActivity({
          type: 'task_created',
          description: '创建新综述任务（本地演示）',
          taskId: mockId,
        });
        setCurrentTask(mockId);
        navigate(`/task/${mockId}`);
      }
    } catch (e) {
      console.error('Failed to create task:', e);
    } finally {
      setIsCreating(false);
    }
  }, [isCreating, navigate, addActivity, setCurrentTask]);

  const statusColors: Record<string, string> = {
    Pending: 'bg-text-muted',
    Researching: 'bg-info',
    Analyzing: 'bg-warning',
    Writing: 'bg-primary',
    AnalyzingAndWriting: 'bg-warning',
    Completed: 'bg-success',
    Failed: 'bg-error',
  };

  return (
    <aside className="w-[220px] h-full bg-surface border-r border-border flex flex-col shrink-0">
      {/* Brand */}
      <div className="h-11 px-4 flex items-center border-b border-border">
        <FolderOpen size={16} className="text-primary mr-2" />
        <h1 className="text-sm font-semibold text-text-primary tracking-tight">CiteForge</h1>
        <span className="ml-2 text-[11px] text-text-muted font-medium">v0.1</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Global Navigation */}
        <div className="p-2">
          <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1.5 px-2">
            全局
          </div>
          <div className="space-y-0.5">
            {globalNav.map((item) => {
              const Icon = item.icon;
              const isActive = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-[13px] transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
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

        {/* Recent Projects */}
        {recentTasks.length > 0 && (
          <div className="px-2 pt-2 pb-1">
            <button
              onClick={() => setRecentExpanded(!recentExpanded)}
              className="flex items-center justify-between w-full text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1.5 px-2 hover:text-text-secondary transition-colors"
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
                  const taskPath = `/task/${task.id}`;
                  return (
                    <Link
                      key={task.id}
                      to={taskPath}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[12px] text-left transition-all ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isActive
                            ? statusColors[task.status] || 'bg-primary'
                            : 'bg-text-muted'
                        }`}
                      />
                      <span className="truncate flex-1">{task.topic || '未命名项目'}</span>
                      <span className="text-[10px] text-text-muted shrink-0">
                        {Math.round((task.progress || 0) * 100)}%
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* New Project Button */}
        <div className="px-4 py-2">
          <button
            onClick={handleNewProject}
            disabled={isCreating}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs text-text-secondary bg-surface-hover hover:bg-surface-hover/80 hover:text-text-primary transition-colors border border-border disabled:opacity-50"
          >
            <Plus size={12} />
            <span>{isCreating ? '创建中...' : '新建项目'}</span>
          </button>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="p-2 border-t border-border">
        <div className="flex gap-1.5 px-2">
          {themes.map((t) => {
            const Icon = t.icon;
            const isActive = currentTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                title={t.label}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[11px] transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'bg-surface-hover text-text-secondary hover:bg-surface-hover/80'
                }`}
              >
                <Icon size={14} />
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
