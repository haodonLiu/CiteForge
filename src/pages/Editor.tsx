import { useState, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import Button from '@/components/ui/Button';

const MarkdownEditor = lazy(() => import('@/components/editor/MarkdownEditor'));
const PreviewPane = lazy(() => import('@/components/editor/PreviewPane'));

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState('# Hello World\n\nThis is a **Markdown** editor with $LaTeX$ support.\n\n$$\nE = mc^2\n$$');
  const [showPreview, setShowPreview] = useState(true);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary">编辑器</h1>
        <Button size="sm" onClick={() => setShowPreview(!showPreview)}>
          {showPreview ? '隐藏预览' : '显示预览'}
        </Button>
      </div>

      <div className="flex-1 flex">
        <div className={`${showPreview ? 'w-1/2' : 'w-full'} border-r border-border`}>
          <Suspense fallback={<div className="p-4 text-text-secondary text-sm">Loading editor...</div>}>
            <MarkdownEditor content={content} onChange={setContent} />
          </Suspense>
        </div>
        {showPreview && (
          <div className="w-1/2 overflow-auto bg-card">
            <Suspense fallback={<div className="p-4 text-text-secondary text-sm">Loading preview...</div>}>
              <PreviewPane content={content} />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}
