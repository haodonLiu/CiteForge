'use client';

import { useState } from 'react';
import MarkdownEditor from '@/components/editor/MarkdownEditor';
import PreviewPane from '@/components/editor/PreviewPane';

export default function EditorPage({ params }: { params: { id: string } }) {
  const [content, setContent] = useState('# Hello World\n\nThis is a **Markdown** editor with $LaTeX$ support.\n\n$$\nE = mc^2\n$$');
  const [showPreview, setShowPreview] = useState(true);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h1 className="text-xl font-semibold">编辑器</h1>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="px-3 py-1 rounded bg-surface hover:bg-surface-hover"
        >
          {showPreview ? '隐藏预览' : '显示预览'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        <div className={`${showPreview ? 'w-1/2' : 'w-full'} border-r border-border`}>
          <MarkdownEditor content={content} onChange={setContent} />
        </div>
        {showPreview && (
          <div className="w-1/2 overflow-auto bg-card">
            <PreviewPane content={content} />
          </div>
        )}
      </div>
    </div>
  );
}