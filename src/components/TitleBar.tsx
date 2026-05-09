import { useEffect, useState, useCallback, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '@/lib/store';

type StatusMode = 'time' | 'task';

interface TitleBarStatus {
  mode: StatusMode;
  task_name?: string;
  silent_mode: boolean;
}

const defaultStatus: TitleBarStatus = {
  mode: 'time',
  silent_mode: false,
};

export function TitleBar() {
  const { pathname } = useLocation();
  const dragRegionRef = useRef<HTMLDivElement>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const silentModeRef = useRef<boolean>(false);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [status, setStatus] = useState<TitleBarStatus>(defaultStatus);
  const [todayMinutes, setTodayMinutes] = useState(0);

  const currentTaskId = useAppStore((s) => s.currentTaskId);
  const tasks = useAppStore((s) => s.tasks);

  const SILENT_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

  // Time update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync task status from store
  useEffect(() => {
    if (currentTaskId && tasks[currentTaskId]) {
      const task = tasks[currentTaskId];
      setStatus({
        mode: 'task',
        task_name: task.topic || '处理中...',
        silent_mode: false,
      });
    } else {
      setStatus({ mode: 'time', silent_mode: false });
    }
  }, [currentTaskId, tasks]);

  // Check silent mode
  useEffect(() => {
    const checkSilent = () => {
      const idle = Date.now() - lastActivityRef.current;
      if (idle >= SILENT_THRESHOLD_MS && !silentModeRef.current) {
        silentModeRef.current = true;
        setStatus(prev => ({ ...prev, silent_mode: true }));
      }
    };
    const interval = setInterval(checkSilent, 10000);
    return () => clearInterval(interval);
  }, []);

  // Record activity
  const recordActivity = useCallback(async () => {
    lastActivityRef.current = Date.now();
    if (silentModeRef.current) {
      silentModeRef.current = false;
      setStatus(prev => ({ ...prev, silent_mode: false }));
    }
    try {
      await invoke('record_activity');
    } catch (e) {
      console.error('Failed to record activity:', e);
    }
  }, []);

  // Setup activity listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, recordActivity, { passive: true });
    });
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, recordActivity);
      });
    };
  }, [recordActivity]);

  // Drag region setup
  useEffect(() => {
    const dragRegion = dragRegionRef.current;
    if (!dragRegion) return;

    const win = getCurrentWindow();
    dragRegion.addEventListener('mousedown', (e) => {
      if (e.buttons === 1) {
        if (e.detail === 2) {
          win.toggleMaximize();
        } else {
          win.startDragging();
        }
      }
    });
  }, []);

  // Window controls
  const handleMinimize = useCallback(() => getCurrentWindow().minimize(), []);
  const handleMaximize = useCallback(() => getCurrentWindow().toggleMaximize(), []);
  const handleClose = useCallback(() => getCurrentWindow().close(), []);

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Format date
  const formatDate = (date: Date) => {
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${date.getMonth() + 1}月${date.getDate()}日 ${dayNames[date.getDay()]}`;
  };

  // Format work time
  const formatWorkTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `今日已工作 ${hours}h${mins}m`;
    }
    return `今日已工作 ${mins}m`;
  };

  // Nav items
  const navItems = [
    { label: '文献', path: '/library' },
    { label: '写作', path: '/editor/1' },
    { label: 'Agent', path: '/agent' },
  ];

  const currentPath = pathname;

  // Status text
  const getStatusText = () => {
    if (status.silent_mode) {
      return '静默模式';
    }
    if (status.mode === 'task' && status.task_name) {
      return status.task_name;
    }
    return `${formatDate(currentTime)} ${formatTime(currentTime)}`;
  };

  const getStatusSubtext = () => {
    if (status.silent_mode) {
      return '5分钟无操作';
    }
    if (status.mode === 'task') {
      return '处理中...';
    }
    return formatWorkTime(todayMinutes);
  };

  return (
    <div className="h-10 flex items-center justify-between bg-background/80 backdrop-blur border-b border-border select-none shrink-0">
      {/* Windows buttons - right side */}
      <div className="flex items-center h-full ml-auto">
        <button
          onClick={handleMinimize}
          className="w-10 h-full flex items-center justify-center hover:bg-surface-hover transition-colors"
          aria-label="最小化"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor" className="text-text-secondary">
            <rect width="10" height="1" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="w-10 h-full flex items-center justify-center hover:bg-surface-hover transition-colors"
          aria-label="最大化"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" className="text-text-secondary">
            <rect x="0.5" y="0.5" width="9" height="9" strokeWidth="1" />
          </svg>
        </button>
        <button
          onClick={handleClose}
          className="w-10 h-full flex items-center justify-center hover:bg-error/20 transition-colors"
          aria-label="关闭"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" className="text-text-secondary">
            <line x1="0" y1="0" x2="10" y2="10" strokeWidth="1.2" />
            <line x1="10" y1="0" x2="0" y2="10" strokeWidth="1.2" />
          </svg>
        </button>
      </div>

      {/* Drag region with status */}
      <div
        ref={dragRegionRef}
        className="flex-1 h-full flex items-center justify-center cursor-default"
        onMouseDown={(e) => {
          if (e.buttons === 1 && e.detail === 2) {
            getCurrentWindow().toggleMaximize();
          }
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-text-primary">CiteForge</span>
          <nav className="flex gap-1">
            {navItems.map((item) => {
              const isActive = currentPath.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-surface text-text-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <span className="text-text-secondary text-xs">|</span>
          <span className={`text-xs ${status.silent_mode ? 'text-muted' : 'text-text-secondary'}`}>
            {getStatusText()}
          </span>
          {status.silent_mode && (
            <span className="text-xs text-muted">{getStatusSubtext()}</span>
          )}
        </div>
      </div>

      {/* Spacer for buttons */}
      <div className="w-[104px]" />
    </div>
  );
}