import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { invoke } from '@/lib/tauri';
import {
  BookOpen,
  FileEdit,
  Bot,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import { StatusBadge, taskStatusToPhase } from '@/components/ui/StatusBadge';
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
  const phase = taskStatusToPhase(task.status);
  const isRunning =
    task.status === 'Researching' ||
    task.status === 'Analyzing' ||
    task.status === 'Writing' ||
    task.status === 'AnalyzingAndWriting';

  // Determine which workflow step is active based on status
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
          <h1 className="text-lg font-semibold text-text-primary mb-1">
            {task.topic || '未命名项目'}
          </h1>
          <div className="flex items-center gap-3">
            <StatusBadge phase={phase} />
            {isRunning && (
              <span className="flex items-center gap-1 text-xs text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                运行中
              </span>
            )}
            {task.status === 'Completed' && (
              <span className="flex items-center gap-1 text-xs text-success">
                <CheckCircle size={12} />
                已完成
              </span>
            )}
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-text-secondary">总体进度</span>
            <span className="text-sm font-semibold text-primary">{progress}%</span>
          </div>
          <div className="h-2 bg-surface-hover rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>
              {task.currentAgent
                ? `当前阶段: ${task.currentAgent}`
                : task.lastAction || '等待开始'}
            </span>
            <span>{draftWords > 0 ? `${draftWords.toLocaleString()} 字` : '暂无草稿'}</span>
          </div>
        </Card>

        {/* Workflow Steps */}
        <div className="mb-6">
          <h2 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-3">
            工作流
          </h2>
          <div className="space-y-2">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === activeStep;
              const isCompleted = index < activeStep;
              const stepPath = `/task/${taskId}/${step.path}`;

              return (
                <Link
                  key={step.id}
                  to={stepPath}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    isActive
                      ? 'border-primary/30 bg-primary/5'
                      : isCompleted
                      ? 'border-success/20 bg-success/5'
                      : 'border-border bg-card hover:border-primary/20'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : isCompleted
                        ? 'bg-success/10 text-success'
                        : 'bg-surface-hover text-text-muted'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle size={16} />
                    ) : (
                      <Icon size={16} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary">{step.label}</div>
                    <div className="text-xs text-text-muted">{step.desc}</div>
                  </div>
                  {isActive && (
                    <div className="flex items-center gap-1 text-xs text-primary">
                      <Play size={12} />
                      进行中
                    </div>
                  )}
                  {!isActive && !isCompleted && (
                    <span className="text-xs text-text-muted">待开始</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <div className="text-lg font-semibold text-text-primary">{progress}%</div>
            <div className="text-[11px] text-text-muted">完成度</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-lg font-semibold text-text-primary">
              {draftWords.toLocaleString()}
            </div>
            <div className="text-[11px] text-text-muted">草稿字数</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-lg font-semibold text-text-primary">
              {task.status === 'Completed' ? '已完成' : isRunning ? '进行中' : '待开始'}
            </div>
            <div className="text-[11px] text-text-muted">状态</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
