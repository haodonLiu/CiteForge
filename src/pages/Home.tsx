import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { invoke, open, isTauri } from '@/lib/tauri';
import {
  FileText,
  Plus,
  BookOpen,
  CheckCircle,
  Clock,
  ArrowRight,
  FolderOpen,
  Sparkles,
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
  const setCurrentTask = useAppStore((s) => s.setCurrentTask);

  const activeReviews = Object.values(tasks).filter(
    (t) => t.status !== 'Completed' && t.status !== 'Failed'
  );
  const completedReviews = Object.values(tasks).filter(
    (t) => t.status === 'Completed'
  );

  const [totalWords, setTotalWords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchDraftStats = async () => {
      if (activeReviews.length === 0) {
        setTotalWords(0);
        return;
      }
      try {
        const workspaceId = activeReviews[0]?.id;
        const stats = await invoke<{ total_words: number }>('get_draft_stats', {
          workspace_id: workspaceId,
        });
        setTotalWords(stats.total_words);
      } catch (e) {
        setTotalWords(0);
      }
    };
    fetchDraftStats();
  }, [activeReviews]);

  const today = new Date().toISOString().slice(0, 10);
  const weekData = getWeekData();
  const todayMinutes = getWorkTimeForDay(today);
  const totalWeekMinutes = weekData.reduce((sum, d) => sum + d.minutes, 0);
  const completedCount = completedReviews.length;

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const createMockTask = (topic: string, pdfCount: number = 0): string => {
    const mockId = `task-${Date.now()}`;
    const taskName = pdfCount > 0 ? `${topic} (${pdfCount} 个PDF)` : topic;
    // @ts-ignore — addTask exists on store but not typed in selector
    useAppStore.getState().addTask({
      id: mockId,
      topic: taskName,
      status: 'Pending',
      progress: 0,
    });
    return mockId;
  };

  const handleCreateTask = async () => {
    setIsLoading(true);
    try {
      if (isTauri) {
        const result = await invoke<{ task_id: string }>('run_task', {
          topic: '新综述',
          pdfPaths: [],
        });
        if (!result?.task_id) {
          throw new Error('后端未返回任务ID');
        }
        // Add task to store so it appears in UI
        // @ts-ignore — addTask exists on store but not typed in selector
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
        showToast('success', '项目创建成功');
      } else {
        // Browser dev mode: create a local mock task
        const mockId = createMockTask('新综述');
        addActivity({
          type: 'task_created',
          description: '创建新综述任务（本地演示）',
          taskId: mockId,
        });
        setCurrentTask(mockId);
        navigate(`/task/${mockId}`);
        showToast('success', '演示项目已创建');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast('error', `创建失败: ${msg}`);
      console.error('Failed to create task:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportPdf = async () => {
    if (isTauri) {
      try {
        const selected = await open({
          multiple: true,
          filters: [{ name: 'PDF', extensions: ['pdf'] }],
        });
        if (selected && (Array.isArray(selected) ? selected.length > 0 : selected)) {
          const paths = Array.isArray(selected) ? selected : [selected];
          setIsLoading(true);
          const result = await invoke<{ task_id: string }>('run_task', {
            topic: '新综述',
            pdfPaths: paths,
          });
          if (result?.task_id) {
            // Add task to store so it appears in UI
            // @ts-ignore — addTask exists on store but not typed in selector
            useAppStore.getState().addTask({
              id: result.task_id,
              topic: `新综述 (${paths.length} 个PDF)`,
              status: 'Pending',
              progress: 0,
            });
            addActivity({
              type: 'task_created',
              description: `导入 ${paths.length} 个 PDF`,
              taskId: result.task_id,
            });
            setCurrentTask(result.task_id);
            navigate(`/task/${result.task_id}`);
            showToast('success', `已导入 ${paths.length} 个PDF`);
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        showToast('error', `导入失败: ${msg}`);
        console.error('Failed to import PDF:', e);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Browser mode: trigger hidden file input
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileNames = Array.from(files).map((f) => f.name);
      const mockId = createMockTask('新综述', fileNames.length);
      addActivity({
        type: 'task_created',
        description: `导入 ${fileNames.length} 个 PDF（本地演示）`,
        taskId: mockId,
      });
      setCurrentTask(mockId);
      navigate(`/task/${mockId}`);
      showToast('success', `已导入 ${fileNames.length} 个PDF（演示）`);
    }
    e.target.value = '';
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Toast */}
        {toast && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm border ${
              toast.type === 'success'
                ? 'bg-success/10 text-success border-success/20'
                : 'bg-error/10 text-error border-error/20'
            }`}
          >
            {toast.text}
          </div>
        )}
        {/* Welcome + Quick Actions */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-text-primary mb-1">工作台</h1>
            <p className="text-sm text-text-muted">
              {activeReviews.length > 0
                ? `${activeReviews.length} 个进行中的项目`
                : '开始你的学术研究之旅'}
            </p>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={handleImportPdf}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-text-secondary bg-surface-hover hover:bg-surface-hover/80 hover:text-text-primary transition-colors border border-border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BookOpen size={13} />
              {isLoading ? '处理中...' : '导入文献'}
            </button>
            <button
              onClick={handleCreateTask}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={13} />
              {isLoading ? '创建中...' : '新建项目'}
            </button>
          </div>
        </div>

        {/* Active Projects */}
        <div className="mb-8">
          <h2 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <FolderOpen size={12} />
            进行中的项目
          </h2>

          {activeReviews.length === 0 ? (
            <Card className="p-8 text-center">
              <Sparkles size={24} className="text-text-muted mx-auto mb-3" />
              <p className="text-sm text-text-muted">暂无进行中的项目</p>
              <p className="text-xs text-text-muted mt-1">
                点击右上角"新建项目"或"导入文献"开始
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeReviews.map((task) => {
                const phase = taskStatusToPhase(task.status);
                const progress = Math.round((task.progress || 0) * 100);
                const estimate = Math.round((1 - (task.progress || 0)) * 30);

                return (
                  <Card
                    key={task.id}
                    clickable
                    className="p-4 group"
                    onClick={() => {
                      setCurrentTask(task.id);
                      navigate(`/task/${task.id}`);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-text-primary truncate">
                          {task.topic || '未命名项目'}
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
                        to={`/task/${task.id}/editor`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentTask(task.id);
                        }}
                        className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                      >
                        继续写作
                      </Link>
                      <Link
                        to={`/task/${task.id}/agent`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentTask(task.id);
                        }}
                        className="text-xs px-3 py-1.5 text-text-muted hover:text-text-secondary transition-colors"
                      >
                        Agent 助手
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Grid: Stats + Recent Activity */}
        <div className="grid grid-cols-3 gap-4">
          {/* Work Time */}
          <Card className="p-4">
            <h3 className="text-xs font-medium text-text-secondary mb-3 flex items-center gap-1.5">
              <Clock size={12} />
              本周工作时长
            </h3>
            <div className="h-20 flex items-end gap-1">
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
                    <span
                      className={`text-[10px] ${
                        isToday ? 'text-primary font-medium' : 'text-text-muted'
                      }`}
                    >
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
                <div className="text-2xl font-semibold text-text-primary">
                  {totalWords.toLocaleString()}
                </div>
                <div className="text-xs text-text-muted">总字数</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-text-primary">{completedCount}</div>
                <div className="text-xs text-text-muted">完成项目</div>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-4">
            <h3 className="text-xs font-medium text-text-secondary mb-3">最近活动</h3>
            <ActivityFeed />
          </Card>
        </div>
      </div>
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const defaultIcon = { icon: Plus, className: 'text-primary' };
  const config: Record<string, { icon: typeof BookOpen; className: string }> = {
    task_created: defaultIcon,
    literature_added: { icon: BookOpen, className: 'text-info' },
    draft_generated: { icon: FileText, className: 'text-success' },
    checkpoint_reached: { icon: CheckCircle, className: 'text-warning' },
  };
  const { icon: Icon, className } = config[type] ?? defaultIcon;
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
            {new Date(a.timestamp).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span className="text-text-secondary truncate">{a.description}</span>
        </div>
      ))}
    </div>
  );
}
