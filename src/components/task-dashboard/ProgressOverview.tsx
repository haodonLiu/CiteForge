import Card from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/ProgressRing';

interface ProgressOverviewProps {
  progress: number;
  currentAgent?: string;
  lastAction?: string;
  draftWords: number;
  className?: string;
}

export default function ProgressOverview({
  progress,
  currentAgent,
  lastAction,
  draftWords,
  className = '',
}: ProgressOverviewProps) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-center gap-6">
        <ProgressRing value={progress} size={72} strokeWidth={5} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-secondary">总体进度</span>
            <span className="text-lg font-semibold text-primary">{progress}%</span>
          </div>
          <div className="h-2 bg-surface-hover rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>
              {currentAgent
                ? `当前阶段: ${currentAgent}`
                : lastAction || '等待开始'}
            </span>
            <span>{draftWords > 0 ? `${draftWords.toLocaleString()} 字` : '暂无草稿'}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
