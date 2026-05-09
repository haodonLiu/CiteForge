import { FileText, Globe } from 'lucide-react';
import { Literature } from '@/lib/types';
import Badge from '@/components/ui/Badge';

interface LiteratureCardProps {
  literature: Literature;
  onSelect: (id: string) => void;
}

const statusVariant: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  Unread: 'default',
  Reading: 'primary',
  Read: 'success',
  ToRead: 'warning',
  Archived: 'default',
};

export default function LiteratureCard({ literature, onSelect }: LiteratureCardProps) {
  const isPdf = literature.source === 'pdf' || literature.file_path;

  return (
    <div
      onClick={() => onSelect(literature.id)}
      className="flex items-start gap-3 p-3 bg-card border border-border rounded-md hover:border-primary/30 transition-colors cursor-pointer"
    >
      <div className="w-10 h-10 rounded bg-surface flex items-center justify-center text-text-muted shrink-0">
        {isPdf ? <FileText size={18} /> : <Globe size={18} />}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-text-primary truncate">{literature.title}</h3>
        <p className="text-xs text-text-secondary mt-0.5">
          {literature.authors.map((a) => a.name).join(', ')}
          {literature.year && ` · ${literature.year}`}
          {literature.venue && ` · ${literature.venue}`}
          {literature.citation_count && ` · 被引 ${literature.citation_count} 次`}
        </p>
        <div className="flex gap-1.5 mt-2">
          {literature.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <div
          className={`w-2 h-2 rounded-full ${
            literature.read_status === 'Read'
              ? 'bg-success'
              : literature.read_status === 'Reading'
              ? 'bg-warning'
              : 'bg-text-muted'
          }`}
          title={literature.read_status}
        />
        {literature.read_progress > 0 && literature.read_progress < 1 && (
          <span className="text-[10px] text-text-muted">
            {Math.round(literature.read_progress * 100)}%
          </span>
        )}
      </div>
    </div>
  );
}