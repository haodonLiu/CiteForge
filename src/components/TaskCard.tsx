import type { TaskState } from '@/lib/types';

interface TaskCardProps {
  id: string;
  topic: string;
  status: TaskState;
  progress: number;
  error?: string;
  onClick?: () => void;
}

export function TaskCard({ id, topic, status, progress, error, onClick }: TaskCardProps) {
  const progressPercent = Math.round(progress * 100);

  return (
    <div
      onClick={onClick}
      className="border border-border rounded-lg p-4 mb-3 bg-card hover:border-primary/30 transition-colors cursor-pointer"
    >
      <h3 className="text-sm font-medium text-text-primary m-0 mb-2">{topic}</h3>
      <p className="text-xs text-text-secondary m-0 mb-2">
        状态: {status}
      </p>
      <div className="w-full h-2 bg-surface-hover rounded overflow-hidden">
        <div
          className={`h-full rounded transition-all duration-300 ${
            status === 'Failed' ? 'bg-error' : 'bg-primary'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      {error && (
        <p className="text-xs text-error mt-2">{error}</p>
      )}
    </div>
  );
}
