import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoke, open, isTauri } from '@/lib/tauri';
import { Plus, BookOpen, FolderOpen } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  WorkTimeCard,
  WritingStatsCard,
  ActivityFeed,
  ProjectCard,
  EmptyProjects,
} from '@/components/home';

interface HomeProps {
  recentLiterature?: never[];
}

export default function Home(_props: HomeProps) {
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
      } catch {
        setTotalWords(0);
      }
    };
    fetchDraftStats();
  }, [activeReviews]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const LoadingSpinner = () => (
    <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  const createMockTask = (topic: string, pdfCount: number = 0): string => {
    const mockId = `task-${Date.now()}`;
    const taskName = pdfCount > 0 ? `${topic} (${pdfCount} 个PDF)` : topic;
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

  const handleProjectSelect = (taskId: string) => {
    setCurrentTask(taskId);
    navigate(`/task/${taskId}`);
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Toast */}
        {toast && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm border backdrop-blur-sm ${
              toast.type === 'success'
                ? 'bg-success/10 text-success border-success/20'
                : 'bg-error/10 text-error border-error/20'
            }`}
          >
            {toast.text}
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-text-secondary bg-surface border border-border hover:bg-surface-hover hover:text-text-primary transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BookOpen size={13} />
              {isLoading ? <LoadingSpinner /> : '导入文献'}
            </button>
            <button
              onClick={handleCreateTask}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-primary hover:bg-primary/90 active:bg-primary/80 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isLoading ? <LoadingSpinner /> : <Plus size={13} />}
              {isLoading ? '创建中...' : '新建项目'}
            </button>
          </div>
        </div>

        {/* Active Projects */}
        <div className="mb-6">
          <h2 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <FolderOpen size={12} />
            进行中的项目
          </h2>

          {activeReviews.length === 0 ? (
            <EmptyProjects />
          ) : (
            <div className="space-y-3">
              {activeReviews.map((task) => (
                <ProjectCard
                  key={task.id}
                  task={task}
                  onSelect={handleProjectSelect}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Grid: Stats + Recent Activity */}
        <div className="grid grid-cols-3 gap-4">
          <WorkTimeCard />
          <WritingStatsCard
            totalWords={totalWords}
            completedCount={completedReviews.length}
          />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-info/10 flex items-center justify-center">
                <BookOpen size={14} className="text-info" />
              </div>
              <h3 className="text-xs font-medium text-text-secondary">最近活动</h3>
            </div>
            <ActivityFeed />
          </div>
        </div>
      </div>
    </div>
  );
}
