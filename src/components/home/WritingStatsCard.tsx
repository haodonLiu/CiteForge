import { TrendingUp, BookOpen } from 'lucide-react';
import Card from '@/components/ui/Card';

interface WritingStatsCardProps {
  totalWords: number;
  completedCount: number;
  className?: string;
}

export default function WritingStatsCard({
  totalWords,
  completedCount,
  className = '',
}: WritingStatsCardProps) {
  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-md bg-success/10 flex items-center justify-center">
          <TrendingUp size={14} className="text-success" />
        </div>
        <h3 className="text-xs font-medium text-text-secondary">写作产出</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-2xl font-semibold text-text-primary tabular-nums">
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
  );
}
