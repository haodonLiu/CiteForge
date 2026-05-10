import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useNotes } from '@/hooks/useNotes';
import NoteEditor from '@/components/notes/NoteEditor';
import type { Note } from '@/lib/types';

export default function Notes() {
  const navigate = useNavigate();
  const { notes, loading, saveNote, deleteNote, searchNotes } = useNotes();
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSave = useCallback(
    async (noteData: Partial<Note> & { title: string; content: string }) => {
      await saveNote(noteData);
      setEditingNote(null);
      setIsCreating(false);
    },
    [saveNote]
  );

  const handleDelete = useCallback(
    async (noteId: string) => {
      if (confirm('确定要删除这条笔记吗？')) {
        await deleteNote(noteId);
        if (editingNote?.id === noteId) {
          setEditingNote(null);
        }
      }
    },
    [deleteNote, editingNote]
  );

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (query.trim()) {
        searchNotes(query);
      }
    },
    [searchNotes]
  );

  const filteredNotes = notes;

  return (
    <div className="h-full flex">
      {/* Sidebar - Note List */}
      <div className="w-72 border-r border-border bg-surface flex flex-col">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-sm font-semibold text-text-primary">笔记</h1>
            <Button size="sm" onClick={() => { setIsCreating(true); setEditingNote(null); }}>
              <Plus size={13} />
              新建
            </Button>
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="搜索笔记..."
              className="pl-7 text-xs"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="text-center text-text-muted py-8 text-xs">加载中...</div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center text-text-muted py-8 text-xs">
              {searchQuery ? '未找到匹配的笔记' : '暂无笔记，点击"新建"开始'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => { setEditingNote(note); setIsCreating(false); }}
                  className={`w-full text-left px-3 py-2.5 transition-colors group ${
                    editingNote?.id === note.id
                      ? 'bg-primary/5 border-l-2 border-l-primary'
                      : 'hover:bg-surface-hover border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-text-primary truncate">
                        {note.title || '无标题'}
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5 line-clamp-1">
                        {note.content.slice(0, 60) || '无内容'}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                      className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-error transition-opacity p-0.5"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-3 py-2 border-t border-border text-[10px] text-text-muted">
          共 {notes.length} 条笔记
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        {isCreating ? (
          <NoteEditor
            onSave={handleSave}
            onCancel={() => setIsCreating(false)}
            existingNotes={notes}
            onLinkClick={(id) => {
              const note = notes.find((n) => n.id === id);
              if (note) setEditingNote(note);
            }}
          />
        ) : editingNote ? (
          <NoteEditor
            note={editingNote}
            onSave={handleSave}
            onCancel={() => setEditingNote(null)}
            existingNotes={notes}
            onLinkClick={(id) => {
              const note = notes.find((n) => n.id === id);
              if (note) setEditingNote(note);
            }}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-text-muted">
            <FileText size={48} className="mb-4 opacity-30" />
            <p className="text-sm">选择一条笔记查看或编辑</p>
            <p className="text-xs mt-1 opacity-60">或者点击"新建"创建笔记</p>
          </div>
        )}
      </div>
    </div>
  );
}
