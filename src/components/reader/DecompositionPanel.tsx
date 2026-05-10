import { useState, useEffect, useCallback } from 'react';
import { invoke, isTauri, listen } from '@/lib/tauri';
import DecompositionIdle from './DecompositionIdle';
import DecompositionLoading from './DecompositionLoading';
import DecompositionError from './DecompositionError';
import DecompositionTree from './DecompositionTree';
import DecompositionStats from './DecompositionStats';

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

interface CachedSection {
  id: string;
  literature_id: string;
  section_id: string;
  title: string;
  section_type?: string;
  page_start?: number;
  page_end?: number;
  content_summary?: string;
  extracted_at: string;
}

type PanelStatus = 'idle' | 'loading' | 'ready' | 'error';

interface Props {
  literatureId: string | null;
  filePath: string | null;
  onJumpToPage?: (page: number) => void;
}

function cachedSectionsToStructure(cached: CachedSection[]): PaperStructure {
  const abstractSection = cached.find((s) => s.section_type === 'Abstract');
  const abstractNode: SectionNode | null = abstractSection
    ? {
        id: abstractSection.section_id,
        title: abstractSection.title,
        level: abstractSection.section_id.split('.').length,
        page_start: abstractSection.page_start || 0,
        page_end: abstractSection.page_end || 0,
        section_type: abstractSection.section_type || 'Abstract',
        paragraphs: [],
      }
    : null;

  const sections: SectionNode[] = cached
    .filter((s) => s.section_type !== 'Abstract')
    .map((s) => ({
      id: s.section_id,
      title: s.title,
      level: s.section_id.split('.').length,
      page_start: s.page_start || 0,
      page_end: s.page_end || 0,
      section_type: s.section_type || 'Unknown',
      paragraphs: [],
    }));

  const totalPages = cached.reduce((max, s) => Math.max(max, s.page_end || 0), 0);

  return {
    title: '文献结构',
    abstract_node: abstractNode,
    sections,
    total_pages: totalPages,
  };
}

export default function DecompositionPanel({ literatureId, filePath, onJumpToPage }: Props) {
  const [status, setStatus] = useState<PanelStatus>('idle');
  const [structure, setStructure] = useState<PaperStructure | null>(null);
  const [progress, setProgress] = useState<DecompositionProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unlisten = listen<DecompositionProgress>('decomposition-progress', (event: { payload: DecompositionProgress }) => {
      setProgress(event.payload);
    });
    return () => { unlisten.then((fn: () => void) => fn()); };
  }, []);

  const saveSectionsToDb = useCallback(
    async (result: PaperStructure) => {
      if (!isTauri || !literatureId) return;
      try {
        const now = new Date().toISOString();
        const sections: CachedSection[] = result.sections.map((s) => ({
          id: `ls-${literatureId}-${s.id}`,
          literature_id: literatureId,
          section_id: s.id,
          title: s.title,
          section_type: s.section_type,
          page_start: s.page_start,
          page_end: s.page_end,
          content_summary: s.paragraphs.map((p) => p.text).join('\n').slice(0, 500),
          extracted_at: now,
        }));

        if (result.abstract_node) {
          sections.unshift({
            id: `ls-${literatureId}-abstract`,
            literature_id: literatureId,
            section_id: result.abstract_node.id,
            title: result.abstract_node.title,
            section_type: 'Abstract',
            page_start: result.abstract_node.page_start,
            page_end: result.abstract_node.page_end,
            content_summary: result.abstract_node.paragraphs
              .map((p) => p.text)
              .join('\n')
              .slice(0, 500),
            extracted_at: now,
          });
        }

        await invoke('save_literature_sections', {
          literature_id: literatureId,
          sections,
        });
      } catch (e) {
        console.error('Failed to save literature sections:', e);
      }
    },
    [literatureId]
  );

  const analyzeStructure = useCallback(
    async (path: string) => {
      try {
        setStatus('loading');
        setError(null);
        setProgress(null);

        const result = await invoke<PaperStructure>('analyze_paper_structure', {
          filePath: path,
        });

        setStructure(result);
        setStatus('ready');

        // Save to database for caching
        await saveSectionsToDb(result);
      } catch (e) {
        setError(String(e));
        setStatus('error');
      }
    },
    [saveSectionsToDb]
  );

  useEffect(() => {
    if (!literatureId && !filePath) {
      setStatus('idle');
      setStructure(null);
      return;
    }

    const load = async () => {
      // 1. Try cache first if literatureId is available
      if (literatureId && isTauri) {
        try {
          const cached = await invoke<CachedSection[]>('get_literature_sections', {
            literature_id: literatureId,
          });
          if (cached && cached.length > 0) {
            const reconstructed = cachedSectionsToStructure(cached);
            setStructure(reconstructed);
            setStatus('ready');
            return;
          }
        } catch (e) {
          console.error('Failed to load cached sections:', e);
        }
      }

      // 2. Fall back to analysis
      if (filePath) {
        await analyzeStructure(filePath);
      } else {
        setStatus('idle');
      }
    };

    load();
  }, [filePath, literatureId, analyzeStructure]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (status === 'idle' && !filePath && !structure) {
    return <DecompositionIdle />;
  }

  if (status === 'loading') {
    return <DecompositionLoading progress={progress} />;
  }

  if (status === 'error') {
    return <DecompositionError error={error} onRetry={() => filePath && analyzeStructure(filePath)} />;
  }

  if (status === 'ready' && structure) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary line-clamp-2">
            {structure.title}
          </h3>
          <div className="text-xs text-text-muted mt-1">
            {structure.total_pages} 页 · {structure.sections.length} 个章节
          </div>
        </div>

        <DecompositionTree
          structure={structure}
          expandedSections={expandedSections}
          onToggleSection={toggleSection}
          onJumpToPage={onJumpToPage}
        />

        <DecompositionStats structure={structure} />
      </div>
    );
  }

  return null;
}
