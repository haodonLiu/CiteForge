import { memo } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import Card from '@/components/ui/Card';
import { StatusBadge, taskStatusToPhase } from '@/components/ui/StatusBadge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useAppStore } from '@/lib/store';
import type { Task } from '@/lib/store';

interface ProjectCardProps {
  task: Task;
  onSelect?: (taskId: string) => void;
}

const ProjectCard = memo(function ProjectCard({ task, onSelect }: ProjectCardProps) {
  const setCurrentTask = useAppStore((s) => s.setCurrentTask);
  const phase = taskStatusToPhase(task.status);
  const progress = Math.round((task.progress || 0) * 100);
  const estimate = Math.round((1 - (task.progress || 0)) * 30);

  const handleClick = () => {
    if (onSelect) {
      onSelect(task.id);
    } else {
      setCurrentTask(task.id);
    }
  };

  return (
    <Card
      clickable
      className="p-4 hover:border-primary/20 transition-all duration-200"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="font-medium text-text-primary truncate group-hover:text-primary transition-colors">
            {task.topic || '未命名项目'}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <StatusBadge phase={phase} />
            <span className="text-xs text-text-muted">
              {estimate > 0 ? `预计 ${estimate} 分钟` : '即将完成'}
            </span>
          </div>
        </div>
        <ProgressRing value={progress} size={40} strokeWidth={3} />
      </div>

      <div className="mt-3">
        <div className="h-1 bg-surface-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {task.lastAction && (
          <p className="text-[11px] text-text-muted mt-1.5 truncate">
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
          className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
        >
          继续写作
        </Link>
        <Link
          to={`/task/${task.id}/agent`}
          onClick={(e) => {
            e.stopPropagation();
            setCurrentTask(task.id);
          }}
          className="text-xs px-3 py-1.5 text-text-muted hover:text-text-secondary hover:bg-surface-hover rounded-md transition-colors"
        >
          Agent 助手
        </Link>
      </div>
    </Card>
  );
});

export default ProjectCard;
