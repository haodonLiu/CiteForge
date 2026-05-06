'use client';

interface Citation {
  index: number;
  title: string;
  authors: string[];
  year?: number;
  venue?: string;
}

interface CitationListProps {
  citations: Citation[];
  onCitationClick?: (index: number) => void;
}

export function CitationList({ citations, onCitationClick }: CitationListProps) {
  return (
    <div style={{ fontFamily: 'monospace' }}>
      <h4>Literature Pool ({citations.length} entries)</h4>
      <ol style={{ paddingLeft: '1.5rem', margin: '0' }}>
        {citations.map((cite) => (
          <li
            key={cite.index}
            style={{ marginBottom: '0.5rem', cursor: onCitationClick ? 'pointer' : 'default' }}
            onClick={() => onCitationClick?.(cite.index)}
          >
            <strong>{cite.title}</strong>
            <br />
            {cite.authors.join(', ')}
            {cite.year && ` (${cite.year})`}
            {cite.venue && ` - ${cite.venue}`}
          </li>
        ))}
      </ol>
    </div>
  );
}
