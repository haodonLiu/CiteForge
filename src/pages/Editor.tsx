import { useState, lazy, Suspense, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileEdit, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/lib/store';

const MarkdownEditor = lazy(() => import('@/components/editor/MarkdownEditor'));
const PreviewPane = lazy(() => import('@/components/editor/PreviewPane'));

export default function Editor() {
  const { taskId, id: legacyId } = useParams<{ taskId: string; id: string }>();
  const effectiveTaskId = taskId || legacyId;
  const tasks = useAppStore((s) => s.tasks);
  const task = effectiveTaskId ? tasks[effectiveTaskId] : null;

  const [content, setContent] = useState(
    '# Hello World\n\nThis is a **Markdown** editor with $LaTeX$ support.\n\n$$\nE = mc^2\n$$'
  );
  const [showPreview, setShowPreview] = useState(true);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface/50 shrink-0">
        <div className="flex items-center gap-2">
          {effectiveTaskId && (
            <Link
              to={`/task/${effectiveTaskId}`}
              className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft size={12} />
              返回概览
            </Link>
          )}
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <FileEdit size={14} className="text-primary" />
            <h1 className="text-sm font-semibold text-text-primary">
              {task ? task.topic : '编辑器'}
            </h1>
          </div>
          {task && (
            <span className="text-[11px] text-text-muted">
              {Math.round((task.progress || 0) * 100)}% 完成
            </span>
          )}
        </div>
        <Button size="sm" onClick={() => setShowPreview(!showPreview)}>
          {showPreview ? '隐藏预览' : '显示预览'}
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`${showPreview ? 'w-1/2' : 'w-full'} border-r border-border overflow-hidden`}>
          <Suspense
            fallback={
              <div className="p-4 text-text-secondary text-sm">Loading editor...</div>
            }
          >
            <MarkdownEditor content={content} onChange={setContent} />
          </Suspense>
        </div>
        {showPreview && (
          <div className="w-1/2 overflow-auto bg-card">
            <Suspense
              fallback={
                <div className="p-4 text-text-secondary text-sm">Loading preview...</div>
              }
            >
              <PreviewPane content={content} />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}
