import { useState, useCallback, useRef, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { Note } from '@/lib/types';

interface NoteEditorProps {
  note?: Note | null;
  onSave: (note: Partial<Note> & { title: string; content: string }) => void;
  onCancel?: () => void;
  existingNotes?: Note[];
  onLinkClick?: (noteId: string) => void;
}

function parseNoteLinks(content: string): Array<{ text: string; raw: string; start: number; end: number }> {
  const regex = /\[\[([^\]]+)\]\]/g;
  const matches: Array<{ text: string; raw: string; start: number; end: number }> = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const text = match[1];
    if (!text) continue;
    matches.push({
      text: text.trim(),
      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return matches;
}

export function NoteLinkPreview({
  content,
  existingNotes = [],
  onLinkClick,
}: {
  content: string;
  existingNotes?: Note[];
  onLinkClick?: (noteId: string) => void;
}) {
  const links = parseNoteLinks(content);
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {links.map((link, idx) => {
        const targetNote = existingNotes.find(
          (n) => n.title === link.text || n.id === link.text
        );
        return (
          <button
            key={idx}
            onClick={() => targetNote && onLinkClick?.(targetNote.id)}
            className={`text-xs px-2 py-0.5 rounded border ${
              targetNote
                ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                : 'bg-surface-hover border-border text-text-muted'
            }`}
            title={targetNote ? `跳转到: ${targetNote.title}` : '未找到的笔记'}
          >
            {link.text}
          </button>
        );
      })}
    </div>
  );
}

export default function NoteEditor({ note, onSave, onCancel, existingNotes = [], onLinkClick }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [showPreview, setShowPreview] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [suggestions, setSuggestions] = useState<Note[]>([]);
  const [suggestionPos, setSuggestionPos] = useState<{ top: number; left: number } | null>(null);

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setContent(value);

      // Check for [[ autocomplete
      const cursorPos = e.target.selectionStart;
      const beforeCursor = value.slice(0, cursorPos);
      const lastOpen = beforeCursor.lastIndexOf('[[');
      const lastClose = beforeCursor.lastIndexOf(']]');

      if (lastOpen > lastClose && lastOpen >= 0) {
        const query = beforeCursor.slice(lastOpen + 2).toLowerCase();
        const matched = existingNotes
          .filter((n) => n.title.toLowerCase().includes(query) || n.id.toLowerCase().includes(query))
          .slice(0, 5);
        setSuggestions(matched);
        setSuggestionIndex(-1);

        // Position suggestion box near cursor
        if (textareaRef.current) {
          const lines = beforeCursor.split('\n');
          const currentLine = lines[lines.length - 1] || '';
          const lineHeight = 20;
          const charWidth = 8;
          setSuggestionPos({
            top: lines.length * lineHeight + 8,
            left: Math.min(currentLine.length * charWidth, 200),
          });
        }
      } else {
        setSuggestions([]);
        setSuggestionPos(null);
      }
    },
    [existingNotes]
  );

  const insertSuggestion = useCallback(
    (suggestedNote: Note) => {
      if (!textareaRef.current) return;
      const cursorPos = textareaRef.current.selectionStart;
      const beforeCursor = content.slice(0, cursorPos);
      const lastOpen = beforeCursor.lastIndexOf('[[');
      if (lastOpen < 0) return;
      const afterCursor = content.slice(cursorPos);
      const newContent =
        content.slice(0, lastOpen) + `[[${suggestedNote.title}]]` + afterCursor;
      setContent(newContent);
      setSuggestions([]);
      setSuggestionPos(null);
      textareaRef.current.focus();
    },
    [content]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (suggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSuggestionIndex((prev) => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          if (suggestionIndex >= 0 && suggestions[suggestionIndex]) {
            insertSuggestion(suggestions[suggestionIndex]);
          }
        } else if (e.key === 'Escape') {
          setSuggestions([]);
        }
      }
    },
    [suggestions, suggestionIndex, insertSuggestion]
  );

  const handleSave = useCallback(() => {
    if (!title.trim()) return;
    onSave({
      id: note?.id,
      taskId: note?.taskId,
      title: title.trim(),
      content: content.trim(),
      createdAt: note?.createdAt,
    });
  }, [title, content, note, onSave]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border bg-surface/50 shrink-0">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="笔记标题..."
          className="text-sm font-semibold"
        />
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border shrink-0">
        <Button
          size="sm"
          variant={showPreview ? 'ghost' : 'primary'}
          onClick={() => setShowPreview(false)}
        >
          编辑
        </Button>
        <Button
          size="sm"
          variant={showPreview ? 'primary' : 'ghost'}
          onClick={() => setShowPreview(true)}
        >
          预览
        </Button>
        <div className="flex-1" />
        <span className="text-xs text-text-muted">
          支持 [[笔记标题]] 超链接
        </span>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {showPreview ? (
          <div className="h-full overflow-auto p-4 prose prose-sm max-w-none">
            <NotePreview
              content={content}
              existingNotes={existingNotes}
              onLinkClick={onLinkClick}
            />
          </div>
        ) : (
          <div className="h-full relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              placeholder="开始写笔记... 使用 [[笔记标题]] 创建链接"
              className="w-full h-full resize-none p-4 text-sm bg-transparent focus:outline-none font-mono leading-relaxed"
              spellCheck={false}
            />
            {suggestions.length > 0 && suggestionPos && (
              <div
                className="absolute z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[160px]"
                style={{ top: suggestionPos.top, left: suggestionPos.left }}
              >
                {suggestions.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => insertSuggestion(s)}
                    className={`w-full text-left px-3 py-1.5 text-xs ${
                      idx === suggestionIndex
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-surface-hover'
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 p-3 border-t border-border shrink-0">
        {onCancel && (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            取消
          </Button>
        )}
        <Button size="sm" onClick={handleSave} disabled={!title.trim()}>
          保存
        </Button>
      </div>
    </div>
  );
}

function NotePreview({
  content,
  existingNotes,
  onLinkClick,
}: {
  content: string;
  existingNotes: Note[];
  onLinkClick?: (noteId: string) => void;
}) {
  // Simple markdown-like rendering
  const renderContent = useCallback(() => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCode = false;
    let codeContent = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';

      if (line.startsWith('```')) {
        if (inCode) {
          elements.push(
            <pre key={`code-${i}`} className="bg-surface-hover p-3 rounded text-xs overflow-x-auto my-2">
              <code>{codeContent}</code>
            </pre>
          );
          codeContent = '';
        }
        inCode = !inCode;
        continue;
      }

      if (inCode) {
        codeContent += line + '\n';
        continue;
      }

      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={i} className="text-xl font-bold mt-4 mb-2">{renderInline(line.slice(2), existingNotes, onLinkClick)}</h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={i} className="text-lg font-semibold mt-3 mb-2">{renderInline(line.slice(3), existingNotes, onLinkClick)}</h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={i} className="text-base font-medium mt-2 mb-1">{renderInline(line.slice(4), existingNotes, onLinkClick)}</h3>
        );
      } else if (line.startsWith('- ')) {
        elements.push(
          <li key={i} className="ml-4 list-disc">{renderInline(line.slice(2), existingNotes, onLinkClick)}</li>
        );
      } else if (line.trim() === '') {
        elements.push(<div key={i} className="h-2" />);
      } else {
        elements.push(
          <p key={i} className="text-sm leading-relaxed mb-1">{renderInline(line, existingNotes, onLinkClick)}</p>
        );
      }
    }

    return elements;
  }, [content, existingNotes, onLinkClick]);

  return <div>{renderContent()}</div>;
}

function renderInline(
  text: string,
  existingNotes: Note[],
  onLinkClick?: (noteId: string) => void
): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const linkRegex = /\[\[([^\]]+)\]\]/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }

    const linkTextRaw = match[1];
    if (!linkTextRaw) continue;
    const linkText = linkTextRaw.trim();
    const targetNote = existingNotes.find(
      (n) => n.title === linkText || n.id === linkText
    );

    parts.push(
      <button
        key={key++}
        onClick={() => targetNote && onLinkClick?.(targetNote.id)}
        className={`inline underline-offset-2 ${
          targetNote
            ? 'text-primary underline hover:text-primary/80'
            : 'text-text-muted underline decoration-dotted'
        }`}
        title={targetNote ? `跳转到: ${targetNote.title}` : '未找到的笔记'}
      >
        {linkText}
      </button>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : [text];
}
