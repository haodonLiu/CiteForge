import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { getCurrentWindow, invoke, isTauri } from '@/lib/tauri';

type StatusMode = 'time' | 'task';

interface TitleBarStatus {
  mode: StatusMode;
  task_name?: string;
  silent_mode: boolean;
}

interface TimeStatusResponse {
  is_tracking: boolean;
  today_minutes: number;
  active_task: string | null;
  silent_mode: boolean;
  silent_threshold_minutes: number;
}

const defaultStatus: TitleBarStatus = {
  mode: 'time',
  silent_mode: false,
};

export function TitleBar() {
  const { pathname } = useLocation();
  const lastActivityRef = useRef<number>(Date.now());
  const silentModeRef = useRef<boolean>(false);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [status, setStatus] = useState<TitleBarStatus>(defaultStatus);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [silentThresholdMs, setSilentThresholdMs] = useState(5 * 60 * 1000);

  const currentTaskId = useAppStore((s) => s.currentTaskId);
  const tasks = useAppStore((s) => s.tasks);

  // Derive location label from pathname
  const getLocationLabel = () => {
    if (pathname === '/') return '工作台';
    if (pathname === '/library') return '文献库';
    if (pathname === '/settings') return '设置';
    if (pathname.startsWith('/task/')) {
      const parts = pathname.split('/');
      const taskId = parts[2];
      const task = taskId ? tasks[taskId] : null;
      const subRoute = parts[3];
      const subLabels: Record<string, string> = {
        literature: '文献',
        reader: '阅读',
        editor: '写作',
        agent: 'Agent',
      };
      const subLabel = subRoute ? (subLabels[subRoute] || '') : '概览';
      return `${task?.topic || '项目'} · ${subLabel}`;
    }
    if (pathname.startsWith('/reader/')) return '阅读器';
    if (pathname.startsWith('/editor/')) return '编辑器';
    if (pathname === '/agent') return 'Agent';
    return '';
  };

  // Fetch time status including silent threshold from backend
  useEffect(() => {
    if (!isTauri) return;

    const fetchTimeStatus = async () => {
      try {
        const response = await invoke<TimeStatusResponse>('get_time_status');
        setSilentThresholdMs(response.silent_threshold_minutes * 60 * 1000);
        setTodayMinutes(response.today_minutes);
      } catch (e) {
        console.error('Failed to fetch time status:', e);
      }
    };
    fetchTimeStatus();
  }, []);

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
      if (idle >= silentThresholdMs && !silentModeRef.current) {
        silentModeRef.current = true;
        setStatus(prev => ({ ...prev, silent_mode: true }));
      }
    };
    const interval = setInterval(checkSilent, 10000);
    return () => clearInterval(interval);
  }, [silentThresholdMs]);

  // Record activity
  const recordActivity = useCallback(async () => {
    lastActivityRef.current = Date.now();
    if (silentModeRef.current) {
      silentModeRef.current = false;
      setStatus(prev => ({ ...prev, silent_mode: false }));
    }
    if (!isTauri) return;
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

  // Window controls - only available in Tauri
  const handleMinimize = useCallback(() => {
    if (isTauri) getCurrentWindow().minimize();
  }, []);
  const handleMaximize = useCallback(() => {
    if (isTauri) getCurrentWindow().toggleMaximize();
  }, []);
  const handleClose = useCallback(() => {
    if (isTauri) getCurrentWindow().close();
  }, []);

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Format work time
  const formatWorkTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins}m`;
    }
    return `${mins}m`;
  };

  // Status text
  const getStatusText = () => {
    if (status.silent_mode) {
      return '静默模式';
    }
    if (status.mode === 'task' && status.task_name) {
      return status.task_name;
    }
    return formatTime(currentTime);
  };

  const getStatusSubtext = () => {
    if (status.silent_mode) {
      return `${silentThresholdMs / 60000}分钟无操作`;
    }
    if (status.mode === 'task') {
      return '处理中...';
    }
    return `今日已工作 ${formatWorkTime(todayMinutes)}`;
  };

  return (
    <div
      className="h-10 flex items-center justify-between bg-background/80 backdrop-blur border-b border-border select-none shrink-0"
      data-tauri-drag-region
    >
      {/* Left: location label */}
      <div className="flex items-center h-full px-4" data-tauri-drag-region>
        <span className="text-xs font-medium text-text-secondary">
          {getLocationLabel()}
        </span>
      </div>

      {/* Center: drag region with status */}
      <div className="flex-1 h-full flex items-center justify-center" data-tauri-drag-region>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${status.silent_mode ? 'text-muted' : 'text-text-secondary'}`}>
            {getStatusText()}
          </span>
          {status.silent_mode && (
            <span className="text-xs text-muted">{getStatusSubtext()}</span>
          )}
        </div>
      </div>

      {/* Right: window controls */}
      <div className="flex items-center h-full" data-tauri-drag-region="false">
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
    </div>
  );
}
