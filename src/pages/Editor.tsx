import { useState, lazy, Suspense, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { MarkdownEditor, PreviewPane, EditorStatusBar, ViewMode } from '@/components/editor';

export default function Editor() {
  const { taskId } = useParams<{ taskId: string }>();
  const tasks = useAppStore((s) => s.tasks);
  const task = taskId ? tasks[taskId] : null;

  const [content, setContent] = useState(
    task?.topic
      ? `# ${task.topic}\n\n`
      : '# 新文档\n\n开始写作...\n'
  );
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [wordCount, setWordCount] = useState({ words: 0, chars: 0 });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate word count when content changes
  useEffect(() => {
    const text = content.replace(/[#*`\[\]()$]/g, '').trim();
    const words = text ? text.split(/\s+/).filter(w => w.length > 0).length : 0;
    const chars = content.length;
    setWordCount({ words, chars });
  }, [content]);

  // Auto-save with debounce
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setIsSaving(true);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      setLastSaved(new Date());
      setIsSaving(false);
    }, 1000);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Editor Content */}
      <div className="flex-1 flex overflow-hidden">
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`flex overflow-hidden ${viewMode === 'split' ? 'w-1/2 border-r border-border' : 'w-full'}`}>
            <Suspense fallback={<div className="p-4 text-text-secondary text-sm">加载编辑器...</div>}>
              <MarkdownEditor content={content} onChange={handleContentChange} />
            </Suspense>
          </div>
        )}

        {viewMode !== 'edit' && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} overflow-auto bg-card`}>
            <Suspense fallback={<div className="p-4 text-text-secondary text-sm">加载预览...</div>}>
              <PreviewPane content={content} />
            </Suspense>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <EditorStatusBar
        wordCount={wordCount.words}
        charCount={wordCount.chars}
        lastSaved={lastSaved}
        isSaving={isSaving}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    </div>
  );
}
