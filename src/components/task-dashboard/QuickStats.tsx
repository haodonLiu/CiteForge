import { BarChart3, FileEdit, CheckCircle, Play } from 'lucide-react';
import Card from '@/components/ui/Card';

interface QuickStatsProps {
  progress: number;
  draftWords: number;
  status: string;
  isRunning: boolean;
  className?: string;
}

export default function QuickStats({
  progress,
  draftWords,
  status,
  isRunning,
  className = '',
}: QuickStatsProps) {
  const isCompleted = status === 'Completed';

  return (
    <div className={`grid grid-cols-3 gap-3 ${className}`}>
      <Card className="p-4 text-center">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
          <BarChart3 size={18} className="text-primary" />
        </div>
        <div className="text-xl font-semibold text-text-primary">{progress}%</div>
        <div className="text-[11px] text-text-muted mt-0.5">完成度</div>
      </Card>

      <Card className="p-4 text-center">
        <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-2">
          <FileEdit size={18} className="text-success" />
        </div>
        <div className="text-xl font-semibold text-text-primary">
          {draftWords > 0 ? draftWords.toLocaleString() : '-'}
        </div>
        <div className="text-[11px] text-text-muted mt-0.5">草稿字数</div>
      </Card>

      <Card className="p-4 text-center">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 ${
            isCompleted
              ? 'bg-success/10'
              : isRunning
              ? 'bg-primary/10'
              : 'bg-surface-hover'
          }`}
        >
          {isCompleted ? (
            <CheckCircle size={18} className="text-success" />
          ) : isRunning ? (
            <Play size={18} className="text-primary" />
          ) : (
            <ClockIcon size={18} className="text-text-muted" />
          )}
        </div>
        <div className="text-[11px] text-text-muted mt-0.5">
          {isCompleted ? '已完成' : isRunning ? '进行中' : '待开始'}
        </div>
      </Card>
    </div>
  );
}

function ClockIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  );
}
