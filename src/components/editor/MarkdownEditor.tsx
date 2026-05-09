import { useEffect, useRef, useState, useCallback } from 'react';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/lib/store';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Code,
  Table,
  Eye,
  Columns,
  FileCode,
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import katex from 'katex';

interface MarkdownEditorProps {
  content: string;
  onChange: (value: string) => void;
}

const renderMath = (text: string): string => {
  const blockRegex = /\$\$([\s\S]*?)\$\$/g;
  const inlineRegex = /\$([^\$\n]+?)\$/g;

  let result = text
    .replace(blockRegex, (_, math) => {
      try {
        return `<div class="katex-block">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
      } catch {
        return `<div class="katex-block error">${math}</div>`;
      }
    })
    .replace(inlineRegex, (_, math) => {
      try {
        return `<span class="katex-inline">${katex.renderToString(math.trim(), { displayMode: false, throwOnError: false })}</span>`;
      } catch {
        return `<span class="katex-inline error">${math}</span>`;
      }
    });

  return result;
};

const parseMarkdown = (md: string): string => {
  let html = marked.parse(md, { async: false }) as string;
  html = renderMath(html);
  return DOMPurify.sanitize(html);
};

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
  const theme = useAppStore((s) => s.theme);
  const editorRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'split' | 'preview'>('split');
  const [showSource, setShowSource] = useState(false);
  const [sourceContent, setSourceContent] = useState(content);
  const [previewHtml, setPreviewHtml] = useState('');
  const sourceEditorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (viewMode !== 'preview') {
      const blocks = content.split('\n').map(line => getBlockType(line));
      if (editorRef.current) {
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
      }
    }
  }, [content, viewMode]);

  useEffect(() => {
    if (viewMode === 'preview' || viewMode === 'split') {
      setPreviewHtml(parseMarkdown(content));
    }
  }, [content, viewMode]);

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

  const toolbarGroups = [
    {
      label: '段落',
      items: [
        { icon: Heading1, title: '标题 1', action: () => execCommand('formatBlock', 'h1') },
        { icon: Heading2, title: '标题 2', action: () => execCommand('formatBlock', 'h2') },
        { icon: Heading3, title: '标题 3', action: () => execCommand('formatBlock', 'h3') },
      ],
    },
    {
      label: '列表',
      items: [
        { icon: List, title: '无序列表', action: () => execCommand('insertUnorderedList') },
        { icon: ListOrdered, title: '有序列表', action: () => execCommand('insertOrderedList') },
      ],
    },
    {
      label: '格式',
      items: [
        { icon: Bold, title: '粗体 (Ctrl+B)', action: () => execCommand('bold') },
        { icon: Italic, title: '斜体 (Ctrl+I)', action: () => execCommand('italic') },
      ],
    },
    {
      label: '插入',
      items: [
        { icon: Quote, title: '引用', action: () => execCommand('formatBlock', 'blockquote') },
        { icon: Link, title: '链接', action: () => {
          const url = prompt('输入链接地址:');
          if (url) execCommand('createLink', url);
        }},
        { icon: Image, title: '图片', action: () => {
          const url = prompt('输入图片地址:');
          if (url) execCommand('insertImage', url);
        }},
        { icon: Code, title: '代码块', action: () => execCommand('formatBlock', 'pre') },
        { icon: Table, title: '表格', action: () => {
          const markdown = '\n| 列1 | 列2 |\n| --- | --- |\n| 内容 | 内容 |\n';
          execCommand('insertText', markdown);
        }},
      ],
    },
    {
      label: '视图',
      items: [
        { icon: Eye, title: '预览', action: () => setViewMode('preview') },
        { icon: Columns, title: '分屏', action: () => setViewMode('split') },
        { icon: FileCode, title: '源码', action: () => setShowSource(!showSource) },
      ],
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="h-10 flex items-center gap-4 px-3 border-b border-border bg-surface shrink-0">
        {toolbarGroups.map((group, groupIdx) => (
          <div key={group.label} className="flex items-center gap-1">
            {groupIdx > 0 && <div className="w-px h-4 bg-border" />}
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.title}
                  size="sm"
                  variant="ghost"
                  onClick={item.action}
                  title={item.title}
                  className="w-7 h-7 p-0"
                >
                  <Icon size={14} />
                </Button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`flex ${viewMode === 'split' ? 'w-1/2' : 'w-full'} ${showSource ? 'w-1/2' : ''}`}>
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              className="flex-1 p-6 overflow-auto outline-none editor-content"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '15px',
                lineHeight: '1.75',
                background: 'var(--color-background)',
                color: 'var(--color-text-primary)',
              }}
              data-placeholder="输入文字，或使用 Markdown 语法..."
            />
          </div>
        )}

        {showSource && (
          <div className="w-1/2 border-l border-border bg-[var(--color-surface)]">
            <textarea
              ref={sourceEditorRef}
              value={sourceContent}
              onChange={(e) => {
                setSourceContent(e.target.value);
                onChange(e.target.value);
              }}
              className="w-full h-full p-4 resize-none outline-none font-mono text-sm"
              style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
              }}
              spellCheck={false}
            />
          </div>
        )}

        {viewMode !== 'edit' && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} border-l border-border overflow-auto`}>
            <div className="p-6 prose-content">
              <div
                className="preview-rendered"
                style={{ fontFamily: 'var(--font-serif)' }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        )}
      </div>

      <style>{`
        .editor-content [contenteditable]:focus {
          outline: none;
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
        .preview-rendered h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin: 1.5rem 0 0.75rem;
        }
        .preview-rendered h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.25rem 0 0.625rem;
        }
        .preview-rendered h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem;
        }
        .preview-rendered blockquote {
          border-left: 4px solid var(--color-primary);
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: var(--color-text-secondary);
        }
        .preview-rendered pre {
          background: var(--color-code-background);
          padding: 1rem;
          border-radius: 4px;
          overflow-x: auto;
        }
        .preview-rendered code {
          font-family: var(--font-mono);
          font-size: 0.875rem;
        }
        .preview-rendered img {
          max-width: 100%;
          height: auto;
        }
        .preview-rendered .katex-block {
          margin: 1rem 0;
          overflow-x: auto;
        }
        .preview-rendered .katex-inline {
          padding: 0 0.25rem;
        }
      `}</style>
    </div>
  );
}