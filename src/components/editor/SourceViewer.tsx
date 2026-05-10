import { forwardRef } from 'react';

interface SourceViewerProps {
  content: string;
  onChange: (content: string) => void;
}

const SourceViewer = forwardRef<HTMLTextAreaElement, SourceViewerProps>(
  ({ content, onChange }, ref) => {
    return (
      <textarea
        ref={ref}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-full p-4 resize-none outline-none font-mono text-sm leading-relaxed"
        style={{
          background: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
        }}
        spellCheck={false}
        placeholder="# Markdown 源码"
      />
    );
  }
);

SourceViewer.displayName = 'SourceViewer';

export default SourceViewer;
