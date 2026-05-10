import { useEffect, useRef, useState, useCallback } from 'react';
import { EditorToolbar } from './index';
import SourceViewer from './SourceViewer';

interface MarkdownEditorProps {
  content: string;
  onChange: (value: string) => void;
}

type BlockType = 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'blockquote' | 'list-item' | 'ordered-list-item' | 'code-block';

interface Block {
  type: BlockType;
  content: string;
}

const getBlockType = (text: string): { type: BlockType; content: string } => {
  if (text.startsWith('# ')) return { type: 'heading1', content: text.slice(2) };
  if (text.startsWith('## ')) return { type: 'heading2', content: text.slice(3) };
  if (text.startsWith('### ')) return { type: 'heading3', content: text.slice(4) };
  if (text.startsWith('> ')) return { type: 'blockquote', content: text.slice(2) };
  if (text.startsWith('- ') || text.startsWith('* ')) return { type: 'list-item', content: text.slice(2) };
  if (text.match(/^\d+\. /)) return { type: 'ordered-list-item', content: text.replace(/^\d+\. /, '') };
  if (text.startsWith('```')) return { type: 'code-block', content: text.replace(/```\w*\n?/g, '') };
  return { type: 'paragraph', content: text };
};

const blockToMarkdown = (blocks: Block[]): string => {
  return blocks.map(block => {
    switch (block.type) {
      case 'heading1': return `# ${block.content}`;
      case 'heading2': return `## ${block.content}`;
      case 'heading3': return `### ${block.content}`;
      case 'blockquote': return `> ${block.content}`;
      case 'list-item': return `- ${block.content}`;
      case 'ordered-list-item': return `1. ${block.content}`;
      case 'code-block': return `\`\`\`\n${block.content}\n\`\`\``;
      default: return block.content;
    }
  }).join('\n');
};

export default function MarkdownEditor({ content, onChange }: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [sourceContent, setSourceContent] = useState(content);
  const [showSource, setShowSource] = useState(false);
  const sourceEditorRef = useRef<HTMLTextAreaElement>(null);

  // Render content when it changes
  useEffect(() => {
    if (!editorRef.current) return;

    const blocks = content.split('\n').map(line => getBlockType(line));
    const selection = window.getSelection();
    const savedRange = selection?.rangeCount ? selection.getRangeAt(0) : null;

    editorRef.current.innerHTML = blocks.map(block => {
      const escaped = block.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      switch (block.type) {
        case 'heading1': return `<h1 class="editor-h1" data-type="heading1">${escaped}</h1>`;
        case 'heading2': return `<h2 class="editor-h2" data-type="heading2">${escaped}</h2>`;
        case 'heading3': return `<h3 class="editor-h3" data-type="heading3">${escaped}</h3>`;
        case 'blockquote': return `<blockquote class="editor-blockquote" data-type="blockquote">${escaped}</blockquote>`;
        case 'list-item': return `<li class="editor-list-item" data-type="list-item">${escaped}</li>`;
        case 'ordered-list-item': return `<li class="editor-ordered-item" data-type="ordered-list-item">${escaped}</li>`;
        case 'code-block': return `<pre class="editor-code-block" data-type="code-block"><code>${escaped}</code></pre>`;
        default: return block.content === '' ? '<br>' : `<p class="editor-p" data-type="paragraph">${escaped}</p>`;
      }
    }).join('');

    if (savedRange) {
      selection?.removeAllRanges();
      selection?.addRange(savedRange);
    }
  }, [content]);

  const getMarkdownFromEditor = useCallback((): string => {
    if (!editorRef.current) return content;

    const blocks: Block[] = [];
    const children = editorRef.current.children;

    for (let i = 0; i < children.length; i++) {
      const el = children[i] as HTMLElement;
      const type = el.dataset.type as BlockType;
      const text = el.textContent || '';

      if (type === 'list-item' || type === 'ordered-list-item') {
        const parent = el.parentElement;
        if (parent && (parent.tagName === 'UL' || parent.tagName === 'OL')) {
          const siblings = Array.from(parent.children);
          const idx = siblings.indexOf(el);
          blocks.push({ type, content: text });
          if (idx === siblings.length - 1) {
            blocks.push({ type: 'paragraph', content: '' });
          }
          continue;
        }
      }

      blocks.push({ type: type || 'paragraph', content: text });
    }

    return blockToMarkdown(blocks);
  }, [content]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.execCommand('insertLineBreak');
    }

    if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      document.execCommand('bold');
    }
    if (e.key === 'i' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      document.execCommand('italic');
    }
  }, []);

  const handleInput = useCallback(() => {
    const md = getMarkdownFromEditor();
    onChange(md);
    setSourceContent(md);
  }, [getMarkdownFromEditor, onChange]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  return (
    <div className="h-full flex flex-col">
      <EditorToolbar
        onExecCommand={execCommand}
        onToggleSource={() => setShowSource(!showSource)}
        showSource={showSource}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 overflow-auto ${showSource ? 'w-1/2' : 'w-full'}`}>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            className="w-full h-full p-6 overflow-auto outline-none editor-content"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '16px',
              lineHeight: '1.8',
              background: 'var(--color-background)',
              color: 'var(--color-text-primary)',
            }}
            data-placeholder="开始写作，或使用 Markdown 语法..."
          />
        </div>

        {showSource && (
          <div className="w-1/2 border-l border-border bg-surface/30">
            <SourceViewer
              ref={sourceEditorRef}
              content={sourceContent}
              onChange={(value) => {
                setSourceContent(value);
                onChange(value);
              }}
            />
          </div>
        )}
      </div>

      <style>{`
        .editor-content [contenteditable]:focus {
          outline: none;
        }
        .editor-content [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: var(--color-text-muted);
          pointer-events: none;
        }
        .editor-content h1.editor-h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin: 1.5rem 0 0.75rem;
          color: var(--color-text-primary);
        }
        .editor-content h2.editor-h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.25rem 0 0.625rem;
          color: var(--color-text-primary);
        }
        .editor-content h3.editor-h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem;
          color: var(--color-text-primary);
        }
        .editor-content blockquote.editor-blockquote {
          border-left: 4px solid var(--color-primary);
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: var(--color-text-secondary);
        }
        .editor-content li {
          margin-left: 1.5rem;
          margin-bottom: 0.25rem;
        }
        .editor-content pre.editor-code-block {
          background: var(--color-code-background);
          padding: 1rem;
          border-radius: 4px;
          overflow-x: auto;
          font-family: var(--font-mono);
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
