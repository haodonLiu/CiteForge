import { memo, useCallback } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface SectionNode {
  id: string;
  title: string;
  level: number;
  page_start: number;
  page_end: number;
  section_type: string;
  paragraphs: { text: string; page: number; font_size?: number }[];
}

interface PaperStructure {
  title: string;
  abstract_node: SectionNode | null;
  sections: SectionNode[];
  total_pages: number;
  bibliography_start_page?: number;
}

const SECTION_TYPE_COLORS: Record<string, string> = {
  Abstract: 'text-info',
  Introduction: 'text-success',
  RelatedWork: 'text-text-muted',
  Methodology: 'text-warning',
  Experiment: 'text-primary',
  Discussion: 'text-text-secondary',
  Conclusion: 'text-success',
  Unknown: 'text-text-muted',
};

const SECTION_TYPE_ICONS: Record<string, string> = {
  Abstract: '📄',
  Introduction: '📖',
  RelatedWork: '📚',
  Methodology: '⚙️',
  Experiment: '🧪',
  Discussion: '💬',
  Conclusion: '✅',
  Unknown: '❓',
};

interface SectionButtonProps {
  section: SectionNode;
  isExpanded: boolean;
  hasChildren: boolean;
  onJumpToPage: (page: number) => void;
  onToggle: () => void;
}

const SectionButton = memo(function SectionButton({
  section,
  isExpanded,
  hasChildren,
  onJumpToPage,
  onToggle,
}: SectionButtonProps) {
  const typeColor = SECTION_TYPE_COLORS[section.section_type] || 'text-text-muted';

  return (
    <div>
      <button
        onClick={() => {
          onJumpToPage(section.page_start);
          if (hasChildren) onToggle();
        }}
        className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-surface-hover transition-colors flex items-center gap-1.5"
        style={{ paddingLeft: `${(section.level - 1) * 12 + 8}px` }}
      >
        {hasChildren ? (
          isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />
        ) : (
          <span className="w-[10px]" />
        )}
        <span>{SECTION_TYPE_ICONS[section.section_type] || '❓'}</span>
        <span className={`flex-1 truncate ${typeColor}`}>
          {section.title}
        </span>
        <span className="text-text-muted shrink-0">
          p.{section.page_start}
        </span>
      </button>

      {isExpanded && (
        <div
          className="px-2 py-1 text-[10px] text-text-muted"
          style={{ paddingLeft: `${(section.level - 1) * 12 + 32}px` }}
        >
          <span className="inline-block px-1.5 py-0.5 bg-surface-hover rounded">
            {section.section_type}
          </span>
        </div>
      )}
    </div>
  );
});

interface DecompositionTreeProps {
  structure: PaperStructure;
  expandedSections: Set<string>;
  onToggleSection: (id: string) => void;
  onJumpToPage?: (page: number) => void;
}

export default function DecompositionTree({
  structure,
  expandedSections,
  onToggleSection,
  onJumpToPage,
}: DecompositionTreeProps) {
  const handleJumpToPage = useCallback((page: number) => {
    onJumpToPage?.(page);
  }, [onJumpToPage]);

  const handleToggle = useCallback((id: string) => {
    onToggleSection(id);
  }, [onToggleSection]);

  return (
    <div className="flex-1 overflow-y-auto p-2">
      {structure.abstract_node && (
        <button
          onClick={() => onJumpToPage?.(structure.abstract_node!.page_start)}
          className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-surface-hover transition-colors flex items-center gap-2"
        >
          <span>{SECTION_TYPE_ICONS.Abstract}</span>
          <span className="text-text-secondary">Abstract</span>
          <span className="text-text-muted ml-auto">p.{structure.abstract_node.page_start}</span>
        </button>
      )}

      {structure.sections.map((section) => {
        const isExpanded = expandedSections.has(section.id);
        const hasChildren = structure.sections.some(
          s => s.id !== section.id && s.id.startsWith(section.id + '.')
        );
        return (
          <SectionButton
            key={section.id}
            section={section}
            isExpanded={isExpanded}
            hasChildren={hasChildren}
            onJumpToPage={handleJumpToPage}
            onToggle={() => handleToggle(section.id)}
          />
        );
      })}
    </div>
  );
}
