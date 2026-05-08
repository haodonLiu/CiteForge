'use client';

import { Literature } from '@/lib/types';

interface LiteratureCardProps {
  literature: Literature;
  onSelect: (id: string) => void;
}

export default function LiteratureCard({ literature, onSelect }: LiteratureCardProps) {
  const statusColors: Record<string, string> = {
    Unread: 'bg-gray-500',
    Reading: 'bg-blue-500',
    Read: 'bg-green-500',
    ToRead: 'bg-yellow-500',
    Archived: 'bg-purple-500',
  };

  return (
    <div
      className="p-4 bg-card rounded-lg border border-border hover:border-primary cursor-pointer transition-colors"
      onClick={() => onSelect(literature.id)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-primary line-clamp-2">{literature.title}</h3>
        <span className={`px-2 py-0.5 text-xs rounded ${statusColors[literature.read_status] || 'bg-gray-500'}`}>
          {literature.read_status}
        </span>
      </div>

      <p className="text-sm text-secondary mb-2">
        {literature.authors.map(a => a.name).join(', ')}
      </p>

      {literature.abstract_text && (
        <p className="text-sm text-muted line-clamp-2 mb-2">
          {literature.abstract_text}
        </p>
      )}

      <div className="flex items-center gap-2 text-xs text-muted">
        {literature.year && <span>{literature.year}</span>}
        {literature.venue && <span>• {literature.venue}</span>}
        {literature.citation_count && <span>• {literature.citation_count} 引用</span>}
      </div>

      {literature.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {literature.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 text-xs bg-surface rounded">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
