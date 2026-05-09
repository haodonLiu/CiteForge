import { useState, useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';

interface TextSelectionMenuProps {
  onAddNote: (text: string, pageNumber: number) => void;
  onInsertCitation: (text: string, pageNumber: number) => void;
  onSearchSemantic: (text: string) => void;
}

export default function TextSelectionMenu({
  onAddNote,
  onInsertCitation,
  onSearchSemantic,
}: TextSelectionMenuProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
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
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // 点击菜单外部时关闭
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPosition(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  if (!position || !selectedText) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-card border border-border rounded-lg shadow-lg p-2 min-w-[200px]"
      style={{ left: position.x, top: position.y }}
    >
      <div className="text-xs text-text-muted mb-2 px-2 truncate max-w-[250px]">
        "{selectedText.slice(0, 50)}{selectedText.length > 50 ? '...' : ''}"
      </div>

      <div className="flex flex-col gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="justify-start"
          onClick={() => {
            onAddNote(selectedText, pageNumber);
            setPosition(null);
          }}
        >
          添加到笔记
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
          作为引用插入草稿
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
          在 Semantic Scholar 搜索
        </Button>
      </div>
    </div>
  );
}
