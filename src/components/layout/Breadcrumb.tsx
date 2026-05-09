import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbSegment {
  label: string;
  to?: string;
}

interface BreadcrumbProps {
  segments: BreadcrumbSegment[];
}

export default function Breadcrumb({ segments }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-xs text-text-muted">
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-text-primary transition-colors"
      >
        <Home size={12} />
        <span>工作台</span>
      </Link>

      {segments.map((seg, i) => (
        <div key={i} className="flex items-center gap-1">
          <ChevronRight size={12} className="text-text-muted/50" />
          {seg.to ? (
            <Link
              to={seg.to}
              className="hover:text-text-primary transition-colors"
            >
              {seg.label}
            </Link>
          ) : (
            <span className="text-text-secondary font-medium">{seg.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
