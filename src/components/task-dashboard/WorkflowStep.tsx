import { Link } from 'react-router-dom';
import { CheckCircle, Play } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface WorkflowStepProps {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  isActive: boolean;
  isCompleted: boolean;
  taskId: string;
  path: string;
}

export default function WorkflowStep({
  label,
  desc,
  icon: Icon,
  isActive,
  isCompleted,
  taskId,
  path,
}: WorkflowStepProps) {
  const stepPath = `/task/${taskId}/${path}`;

  return (
    <Link
      to={stepPath}
      className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
        isActive
          ? 'border-primary/30 bg-primary/5'
          : isCompleted
          ? 'border-success/20 bg-success/5'
          : 'border-border bg-card hover:border-primary/20'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          isActive
            ? 'bg-primary/10 text-primary'
            : isCompleted
            ? 'bg-success/10 text-success'
            : 'bg-surface-hover text-text-muted'
        }`}
      >
        {isCompleted ? <CheckCircle size={18} /> : <Icon size={18} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary">{label}</div>
        <div className="text-xs text-text-muted mt-0.5">{desc}</div>
      </div>

      {isActive && (
        <div className="flex items-center gap-1 text-xs text-primary">
          <Play size={10} />
          进行中
        </div>
      )}

      {!isActive && !isCompleted && (
        <span className="text-xs text-text-muted">待开始</span>
      )}
    </Link>
  );
}
