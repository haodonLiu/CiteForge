import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { invoke } from '@/lib/tauri';
import { BookOpen, FileEdit, Bot, AlertCircle } from 'lucide-react';
import { StatusBadge, taskStatusToPhase } from '@/components/ui/StatusBadge';
import { WorkflowStep, QuickStats, ProgressOverview } from '@/components/task-dashboard';
import { useAppStore } from '@/lib/store';

const workflowSteps = [
  {
    id: 'research',
    label: '文献研究',
    desc: '导入并阅读相关文献',
    icon: BookOpen,
    path: 'literature',
  },
  {
    id: 'analyze',
    label: '分析整理',
    desc: '使用 Agent 分析主题结构',
    icon: Bot,
    path: 'agent',
  },
  {
    id: 'write',
    label: '撰写综述',
    desc: '编辑并完善综述草稿',
    icon: FileEdit,
    path: 'editor',
  },
];

export default function TaskDashboard() {
  const { taskId } = useParams<{ taskId: string }>();
  const tasks = useAppStore((s) => s.tasks);
  const task = taskId ? tasks[taskId] : null;

  const [draftWords, setDraftWords] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      if (!taskId) return;
      try {
        const stats = await invoke<{ total_words: number }>('get_draft_stats', {
          workspace_id: taskId,
        });
        setDraftWords(stats.total_words);
      } catch {
        setDraftWords(0);
      }
    };
    fetchStats();
  }, [taskId]);

  if (!task) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={32} className="text-text-muted mx-auto mb-3" />
          <p className="text-sm text-text-muted">项目不存在或已被删除</p>
          <Link to="/" className="text-xs text-primary mt-2 inline-block hover:underline">
            返回工作台
          </Link>
        </div>
      </div>
    );
  }

  const progress = Math.round((task.progress || 0) * 100);
  const isRunning =
    task.status === 'Researching' ||
    task.status === 'Analyzing' ||
    task.status === 'Writing' ||
    task.status === 'AnalyzingAndWriting';

  const getActiveStep = () => {
    if (task.status === 'Researching' || task.status === 'Pending') return 0;
    if (task.status === 'Analyzing' || task.status === 'AnalyzingAndWriting') return 1;
    if (task.status === 'Writing') return 2;
    if (task.status === 'Completed') return 3;
    return 0;
  };

  const activeStep = getActiveStep();

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-3xl mx-auto">
        {/* Task Header */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-text-primary mb-2">
            {task.topic || '未命名项目'}
          </h1>
          <div className="flex items-center gap-3">
            <StatusBadge phase={taskStatusToPhase(task.status)} />
            {isRunning && (
              <span className="flex items-center gap-1.5 text-xs text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                运行中
              </span>
            )}
            {task.status === 'Completed' && (
              <span className="flex items-center gap-1 text-xs text-success">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                已完成
              </span>
            )}
          </div>
        </div>

        {/* Progress Overview */}
        <ProgressOverview
          progress={progress}
          currentAgent={task.currentAgent}
          lastAction={task.lastAction}
          draftWords={draftWords}
          className="mb-6"
        />

        {/* Workflow Steps */}
        <div className="mb-6">
          <h2 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-3">
            工作流
          </h2>
          <div className="space-y-2">
            {workflowSteps.map((step, index) => (
              <WorkflowStep
                key={step.id}
                id={step.id}
                label={step.label}
                desc={step.desc}
                icon={step.icon}
                isActive={index === activeStep}
                isCompleted={index < activeStep}
                taskId={taskId!}
                path={step.path}
              />
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <QuickStats
          progress={progress}
          draftWords={draftWords}
          status={task.status}
          isRunning={isRunning}
        />
      </div>
    </div>
  );
}
