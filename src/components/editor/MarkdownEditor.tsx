'use client';

import { useState } from 'react';
import Editor from '@monaco-editor/react';

interface MarkdownEditorProps {
  content: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({ content, onChange }: MarkdownEditorProps) {
  const insertMarkdown = (prefix: string, suffix: string = '') => {
    // TODO: Get selection from Monaco and wrap with prefix/suffix
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-border">
        <button
          onClick={() => insertMarkdown('**', '**')}
          className="px-2 py-1 text-sm rounded bg-surface hover:bg-surface-hover"
          title="粗体"
        >
          B
        </button>
        <button
          onClick={() => insertMarkdown('*', '*')}
          className="px-2 py-1 text-sm rounded bg-surface hover:bg-surface-hover italic"
          title="斜体"
        >
          I
        </button>
        <button
          onClick={() => insertMarkdown('# ')}
          className="px-2 py-1 text-sm rounded bg-surface hover:bg-surface-hover"
          title="标题"
        >
          H1
        </button>
        <button
          onClick={() => insertMarkdown('$', '$')}
          className="px-2 py-1 text-sm rounded bg-surface hover:bg-surface-hover"
          title="行内公式"
        >
          Math
        </button>
        <button
          onClick={() => insertMarkdown('$$\n', '\n$$')}
          className="px-2 py-1 text-sm rounded bg-surface hover:bg-surface-hover"
          title="块级公式"
        >
          Block
        </button>
        <button
          onClick={() => insertMarkdown('`', '`')}
          className="px-2 py-1 text-sm rounded bg-surface hover:bg-surface-hover font-mono"
          title="代码"
        >
          Code
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="markdown"
          value={content}
          onChange={(value) => onChange(value || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            scrollBeyondLastLine: false,
          }}
          theme="vs-dark"
        />
      </div>
    </div>
  );
}