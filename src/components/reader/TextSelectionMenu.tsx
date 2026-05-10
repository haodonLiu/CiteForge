import { useState, useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Note } from '@/lib/types';

interface TextSelectionMenuProps {
  notes: Note[];
  onCreateNote: (text: string, pageNumber: number, title: string) => Promise<void>;
  onAddToNote: (text: string, pageNumber: number, noteId: string) => Promise<void>;
  onInsertCitation: (text: string, pageNumber: number) => void;
  onSearchSemantic: (text: string) => void;
}

export default function TextSelectionMenu({
  notes,
  onCreateNote,
  onAddToNote,
  onInsertCitation,
  onSearchSemantic,
}: TextSelectionMenuProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [showNotePanel, setShowNotePanel] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length > 0) {
        // 获取选中位置
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();

        if (rect) {
          // 尝试获取页码（从父元素的 data-page-number 属性）
          let page = 1;
          let parent = range?.startContainer.parentElement;
          while (parent && !parent.dataset.pageNumber) {
            parent = parent.parentElement;
          }
          if (parent?.dataset.pageNumber) {
            page = parseInt(parent.dataset.pageNumber, 10);
          }

          setSelectedText(text);
          setPageNumber(page);
          setPosition({ x: rect.left, y: rect.bottom + 8 });
          setShowNotePanel(false);
          setNewNoteTitle(`摘录 - 第${page}页`);
          setSelectedNoteId('');
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // 点击菜单外部时关闭
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPosition(null);
        setShowNotePanel(false);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onCreateNote(selectedText, pageNumber, newNoteTitle.trim());
      setPosition(null);
      setShowNotePanel(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToExisting = async () => {
    if (!selectedNoteId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddToNote(selectedText, pageNumber, selectedNoteId);
      setPosition(null);
      setShowNotePanel(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!position || !selectedText) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-card border border-border rounded-lg shadow-lg p-2 min-w-[220px]"
      style={{ left: position.x, top: position.y }}
    >
      <div className="text-xs text-text-muted mb-2 px-2 truncate max-w-[250px]">
        "{selectedText.slice(0, 50)}{selectedText.length > 50 ? '...' : ''}"
      </div>

      {!showNotePanel ? (
        <div className="flex flex-col gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="justify-start"
            onClick={() => setShowNotePanel(true)}
          >
            📝 添加到笔记
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="justify-start"
            onClick={() => {
              onInsertCitation(selectedText, pageNumber);
              setPosition(null);
            }}
          >
            📎 作为引用插入草稿
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="justify-start"
            onClick={() => {
              onSearchSemantic(selectedText);
              setPosition(null);
            }}
          >
            🔬 在 Semantic Scholar 搜索
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="text-xs font-medium text-text-secondary px-1">选择笔记</div>

          {notes.length > 0 && (
            <select
              value={selectedNoteId}
              onChange={(e) => setSelectedNoteId(e.target.value)}
              className="w-full h-7 px-2 text-xs bg-surface border border-border rounded focus:outline-none focus:border-primary"
            >
              <option value="">-- 新建笔记 --</option>
              {notes.map((note) => (
                <option key={note.id} value={note.id}>
                  {note.title}
                </option>
              ))}
            </select>
          )}

          {!selectedNoteId && (
            <Input
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="新笔记标题..."
              className="w-full"
            />
          )}

          <div className="flex gap-1 mt-1">
            <Button
              size="sm"
              variant="ghost"
              className="flex-1"
              onClick={() => setShowNotePanel(false)}
            >
              返回
            </Button>
            {selectedNoteId ? (
              <Button
                size="sm"
                variant="primary"
                className="flex-1"
                onClick={handleAddToExisting}
                disabled={isSubmitting}
              >
                添加
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                className="flex-1"
                onClick={handleCreateNote}
                disabled={!newNoteTitle.trim() || isSubmitting}
              >
                创建
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
