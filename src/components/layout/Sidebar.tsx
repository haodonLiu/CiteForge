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
  Loader2,
  NotebookPen,
} from 'lucide-react';
import { useAppStore, type AppTheme } from '@/lib/store';
import { invoke, isTauri } from '@/lib/tauri';

const globalNav = [
  { to: '/', label: '工作台', icon: Home },
  { to: '/library', label: '文献库', icon: BookOpen },
  { to: '/notes', label: '笔记', icon: NotebookPen },
  { to: '/settings', label: '设置', icon: Settings },
];

const themes: { id: AppTheme; icon: typeof Sun; label: string }[] = [
  { id: 'ivory_press', icon: Sun, label: '浅色' },
  { id: 'midnight_scholar', icon: Moon, label: '暗色' },
];

const statusColors: Record<string, string> = {
  Pending: 'bg-text-muted',
  Researching: 'bg-info',
  Analyzing: 'bg-warning',
  Writing: 'bg-primary',
  AnalyzingAndWriting: 'bg-warning',
  Completed: 'bg-success',
  Failed: 'bg-error',
};

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
        const mockId = `task-${Date.now()}`;
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

  return (
    <aside className="w-[220px] h-full bg-surface border-r border-border flex flex-col shrink-0">
      {/* Brand */}
      <div className="h-12 px-4 flex items-center border-b border-border">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center mr-2.5">
          <FolderOpen size={15} className="text-primary" />
        </div>
        <h1 className="text-sm font-semibold text-text-primary tracking-tight">CiteForge</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Global Navigation */}
        <div className="p-3">
          <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-2 px-2">
            导航
          </div>
          <div className="space-y-0.5">
            {globalNav.map((item) => {
              const Icon = item.icon;
              const isActive = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`
                    group flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-all duration-150
                    ${isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                    }
                  `}
                >
                  <Icon size={15} className={isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-secondary'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Projects */}
        {recentTasks.length > 0 && (
          <div className="px-3 pt-2 pb-2">
            <button
              onClick={() => setRecentExpanded(!recentExpanded)}
              className="flex items-center justify-between w-full text-[10px] font-medium text-text-muted uppercase tracking-wider mb-2 px-2 hover:text-text-secondary transition-colors"
            >
              <span>最近项目</span>
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${recentExpanded ? 'rotate-180' : ''}`}
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
                      className={`
                        group flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] transition-all duration-150
                        ${isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                        }
                      `}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isActive
                            ? statusColors[task.status] || 'bg-primary'
                            : 'bg-text-muted group-hover:bg-text-secondary'
                        }`}
                      />
                      <span className="truncate flex-1">{task.topic || '未命名项目'}</span>
                      <span className="text-[10px] text-text-muted shrink-0 tabular-nums">
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
        <div className="px-3 pt-1 pb-2">
          <button
            onClick={handleNewProject}
            disabled={isCreating}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-white hover:bg-primary/90 active:bg-primary/80 shadow-sm"
          >
            {isCreating ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Plus size={12} />
            )}
            <span>{isCreating ? '创建中...' : '新建项目'}</span>
          </button>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-1.5 p-1 bg-surface-hover rounded-lg">
          {themes.map((t) => {
            const Icon = t.icon;
            const isActive = currentTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                title={t.label}
                className={`
                  flex-1 flex items-center justify-center py-1.5 rounded-md transition-all duration-150
                  ${isActive
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                  }
                `}
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
