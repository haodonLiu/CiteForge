import { useState } from 'react';
import { Search, Plus, FileText } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { Note } from '@/lib/types';

interface NoteSelectorProps {
  notes: Note[];
  onSelect: (noteId: string | null, newTitle?: string) => void;
  onCancel: () => void;
}

export default function NoteSelector({ notes, onSelect, onCancel }: NoteSelectorProps) {
  const [search, setSearch] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [mode, setMode] = useState<'select' | 'create'>('select');

  const filtered = notes.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30">
      <div className="bg-card border border-border rounded-xl shadow-xl w-[420px] max-h-[80vh] flex flex-col">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary">添加到笔记</h3>
          <p className="text-xs text-text-muted mt-0.5">选择一个现有笔记或创建新笔记</p>
        </div>

        <div className="flex border-b border-border">
          <button
            onClick={() => setMode('select')}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              mode === 'select'
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            选择笔记
          </button>
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              mode === 'create'
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            新建笔记
          </button>
        </div>

        {mode === 'select' ? (
          <>
            <div className="p-3">
              <div className="relative">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索笔记..."
                  className="pl-7 text-xs"
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto px-3 pb-3 min-h-[200px]">
              {filtered.length === 0 ? (
                <div className="text-center text-text-muted py-8 text-xs">
                  {notes.length === 0 ? '暂无笔记' : '未找到匹配的笔记'}
                </div>
              ) : (
                <div className="space-y-1">
                  {filtered.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => onSelect(note.id)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={13} className="text-text-muted shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-text-primary truncate">
                            {note.title}
                          </div>
                          <div className="text-[10px] text-text-muted line-clamp-1">
                            {note.content.slice(0, 60) || '无内容'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-3 flex-1 min-h-[200px]">
            <Input
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="输入新笔记标题..."
              className="text-xs"
            />
            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                onClick={() => onSelect(null, newNoteTitle.trim())}
                disabled={!newNoteTitle.trim()}
              >
                <Plus size={12} />
                创建并添加
              </Button>
            </div>
          </div>
        )}

        <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onCancel}>
            取消
          </Button>
        </div>
      </div>
    </div>
  );
}
