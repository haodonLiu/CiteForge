import { Outlet, useParams, useLocation, Link, Navigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import Breadcrumb from './Breadcrumb';
import {
  LayoutDashboard,
  BookOpen,
  FileEdit,
  Bot,
} from 'lucide-react';

const taskNavItems = [
  { id: 'overview', label: '概览', path: '', icon: LayoutDashboard },
  { id: 'literature', label: '文献', path: '/literature', icon: BookOpen },
  { id: 'editor', label: '写作', path: '/editor', icon: FileEdit },
  { id: 'agent', label: 'Agent', path: '/agent', icon: Bot },
];

export default function TaskLayout() {
  const { taskId } = useParams<{ taskId: string }>();
  const { pathname } = useLocation();
  const tasks = useAppStore((s) => s.tasks);
  const setCurrentTask = useAppStore((s) => s.setCurrentTask);

  const task = taskId ? tasks[taskId] : null;

  // Auto-set current task when entering task layout
  if (taskId && task) {
    setCurrentTask(taskId);
  }

  if (!taskId) {
    return <Navigate to="/" replace />;
  }

  const taskName = task?.topic || '未命名项目';
  const basePath = `/task/${taskId}`;

  // Determine active tab from pathname
  const activeTabId = taskNavItems.find((item) => {
    if (item.path === '') {
      // overview: exact match or /task/:id
      return pathname === basePath || pathname === `${basePath}/`;
    }
    // For other tabs, also handle sub-routes (e.g., /editor or /reader/:docId under literature)
    if (item.id === 'literature') {
      return pathname.startsWith(`${basePath}/literature`) || pathname.startsWith(`${basePath}/reader/`);
    }
    return pathname.startsWith(`${basePath}${item.path}`);
  })?.id || 'overview';

  return (
    <div className="h-full flex flex-col">
      {/* Task Header */}
      <div className="shrink-0 px-4 pt-3 pb-2 border-b border-border bg-surface/50">
        <Breadcrumb
          segments={[
            { label: '项目', to: '/' },
            { label: taskName },
          ]}
        />

        {/* Task Nav Tabs */}
        <div className="flex items-center gap-1 mt-2">
          {taskNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeTabId;
            const to = `${basePath}${item.path}`;
            return (
              <Link
                key={item.id}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                }`}
              >
                <Icon size={13} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Task Content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
