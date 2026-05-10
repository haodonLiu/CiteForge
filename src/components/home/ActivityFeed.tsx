import { memo } from 'react';
import { Plus, BookOpen, FileText, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';

const ActivityIcon = memo(function ActivityIcon({ type }: { type: string }) {
  const defaultIcon = { icon: Plus, className: 'text-primary' };
  const config: Record<string, { icon: typeof BookOpen; className: string }> = {
    task_created: defaultIcon,
    literature_added: { icon: BookOpen, className: 'text-info' },
    draft_generated: { icon: FileText, className: 'text-success' },
    checkpoint_reached: { icon: CheckCircle, className: 'text-warning' },
  };
  const { icon: Icon, className } = config[type] ?? defaultIcon;
  return <Icon size={12} className={className} />;
});

interface ActivityFeedProps {
  className?: string;
}

const ActivityFeed = memo(function ActivityFeed({ className = '' }: ActivityFeedProps) {
  const activities = useAppStore((s) => s.activities);

  if (activities.length === 0) {
    return (
      <p className="text-xs text-text-muted text-center py-3">暂无活动记录</p>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {activities.slice(0, 4).map((a) => (
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
});

export default ActivityFeed;
