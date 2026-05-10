import { FileText } from 'lucide-react';
import type { Literature } from '@/lib/types';

interface CitationListProps {
  citations: Literature[];
  onCitationClick?: (index: number) => void;
}

export function CitationList({ citations, onCitationClick }: CitationListProps) {
  if (citations.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText size={24} className="text-text-muted mx-auto mb-2" />
        <p className="text-sm text-text-muted">暂无引用文献</p>
      </div>
    );
  }

  return (
    <div className="font-mono text-sm">
      <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
        文献引用 ({citations.length})
      </h4>
      <ol className="list-decimal list-inside space-y-2 text-text-secondary">
        {citations.map((cite, idx) => (
          <li
            key={cite.id}
            onClick={() => onCitationClick?.(idx)}
            className={onCitationClick ? 'cursor-pointer hover:text-primary transition-colors' : ''}
          >
            <span className="text-text-primary font-medium">{cite.title}</span>
            <br />
            <span className="text-xs">
              {cite.authors.map(a => a.name).join(', ')}
              {cite.year && ` (${cite.year})`}
              {cite.venue && ` - ${cite.venue}`}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
