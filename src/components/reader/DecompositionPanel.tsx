import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Layers, AlertTriangle, RefreshCw, ChevronRight, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';

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

interface DecompositionProgress {
  stage: string;
  progress: number;
  message: string;
}

type PanelStatus = 'idle' | 'loading' | 'ready' | 'error';

interface Props {
  filePath: string | null;
  onJumpToPage?: (page: number) => void;
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

export default function DecompositionPanel({ filePath, onJumpToPage }: Props) {
  const [status, setStatus] = useState<PanelStatus>('idle');
  const [structure, setStructure] = useState<PaperStructure | null>(null);
  const [progress, setProgress] = useState<DecompositionProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Listen for decomposition progress events
  useEffect(() => {
    const unlisten = listen<DecompositionProgress>('decomposition-progress', (event) => {
      setProgress(event.payload);
    });
    return () => { unlisten.then(fn => fn()); };
  }, []);

  const analyzeStructure = useCallback(async (path: string) => {
    try {
      setStatus('loading');
      setError(null);
      setProgress(null);

      const result = await invoke<PaperStructure>('analyze_paper_structure', {
        filePath: path,
      });

      setStructure(result);
      setStatus('ready');
    } catch (e) {
      setError(String(e));
      setStatus('error');
    }
  }, []);

  // Auto-analyze when filePath changes
  useEffect(() => {
    if (filePath) {
      analyzeStructure(filePath);
    } else {
      setStatus('idle');
      setStructure(null);
    }
  }, [filePath, analyzeStructure]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Idle state: no paper selected
  if (status === 'idle' && !filePath) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-text-muted">
        <Layers size={32} className="opacity-30" />
        <p className="text-sm">选择一篇论文开始拆解</p>
        <p className="text-xs">或导入 PDF 自动提取结构</p>
      </div>
    );
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-text-muted">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span className="text-sm">{progress?.message || '正在解析论文结构...'}</span>
        {progress && (
          <div className="w-full px-4">
            <div className="w-full h-1.5 bg-surface-hover rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
            <span className="text-xs text-text-muted mt-1 block text-center">
              {progress.stage} — {progress.progress}%
            </span>
          </div>
        )}
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="p-4">
        <div className="border border-error/30 bg-error/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-error" />
            <h4 className="text-error font-medium text-sm">结构提取失败</h4>
          </div>
          <p className="text-xs text-text-secondary mb-3">{error}</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => filePath && analyzeStructure(filePath)}>
              <RefreshCw size={12} className="mr-1" />
              重试
            </Button>
            <Button size="sm" variant="ghost">
              手动编辑结构
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Ready state: display structure
  if (status === 'ready' && structure) {
    return (
      <div className="flex flex-col h-full">
        {/* Paper title */}
        <div className="p-3 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary line-clamp-2">
            {structure.title}
          </h3>
          <div className="text-xs text-text-muted mt-1">
            {structure.total_pages} 页 · {structure.sections.length} 个章节
          </div>
        </div>

        {/* Structure tree */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* Abstract */}
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

          {/* Sections */}
          {structure.sections.map((section) => {
            const isExpanded = expandedSections.has(section.id);
            const hasChildren = structure.sections.some(
              s => s.id !== section.id && s.id.startsWith(section.id + '.')
            );
            const typeColor = SECTION_TYPE_COLORS[section.section_type] || 'text-text-muted';

            return (
              <div key={section.id}>
                <button
                  onClick={() => {
                    onJumpToPage?.(section.page_start);
                    if (hasChildren) toggleSection(section.id);
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

                {/* Section type badge (shown when expanded) */}
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
          })}
        </div>

        {/* Quick stats */}
        <div className="p-3 border-t border-border">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-text-muted">方法论</span>
              <span className="text-text-secondary">
                {structure.sections.filter(s => s.section_type === 'Methodology').length} 节
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">实验</span>
              <span className="text-text-secondary">
                {structure.sections.filter(s => s.section_type === 'Experiment').length} 节
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
