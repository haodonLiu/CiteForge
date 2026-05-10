import { useState, useEffect, useCallback } from 'react';
import { invoke, isTauri } from '@/lib/tauri';
import type { Note, NoteLink, LiteratureNote } from '@/lib/types';
import type {
  ApiNote,
  ApiNoteLink,
  ApiLiteratureNote,
} from '@/lib/types/api';
import {
  mapApiNote,
  mapApiNoteLink,
  mapApiLiteratureNote,
} from '@/lib/types/domain';

interface UseNotesOptions {
  taskId?: string;
}

export function useNotes({ taskId }: UseNotesOptions = {}) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    if (!isTauri) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await invoke<ApiNote[]>('get_notes', { task_id: taskId });
      setNotes((data || []).map(mapApiNote));
    } catch (e) {
      console.error('Failed to load notes:', e);
      setError(e instanceof Error ? e.message : '加载笔记失败');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const saveNote = useCallback(
    async (note: Partial<Note> & { title: string; content: string }) => {
      if (!isTauri) return null;
      const now = new Date().toISOString();
      const payload: ApiNote = {
        id: note.id || `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        task_id: note.taskId || taskId,
        title: note.title,
        content: note.content,
        created_at: note.createdAt || now,
        updated_at: now,
      };
      try {
        const saved = await invoke<ApiNote>('save_note', { note: payload });
        const mapped = mapApiNote(saved);
        setNotes((prev) => {
          const existing = prev.findIndex((n) => n.id === mapped.id);
          if (existing >= 0) {
            const next = [...prev];
            next[existing] = mapped;
            return next;
          }
          return [mapped, ...prev];
        });
        return mapped;
      } catch (e) {
        console.error('Failed to save note:', e);
        throw e;
      }
    },
    [taskId]
  );

  const deleteNote = useCallback(async (noteId: string) => {
    if (!isTauri) return;
    try {
      await invoke('delete_note', { note_id: noteId });
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (e) {
      console.error('Failed to delete note:', e);
      throw e;
    }
  }, []);

  const searchNotes = useCallback(async (query: string) => {
    if (!isTauri || !query.trim()) {
      loadNotes();
      return;
    }
    try {
      setLoading(true);
      const data = await invoke<ApiNote[]>('search_notes', { query });
      setNotes((data || []).map(mapApiNote));
    } catch (e) {
      console.error('Failed to search notes:', e);
    } finally {
      setLoading(false);
    }
  }, [loadNotes]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  return {
    notes,
    loading,
    error,
    loadNotes,
    saveNote,
    deleteNote,
    searchNotes,
  };
}

export function useNoteLinks(noteId?: string) {
  const [links, setLinks] = useState<NoteLink[]>([]);
  const [backlinks, setBacklinks] = useState<NoteLink[]>([]);

  const loadLinks = useCallback(async () => {
    if (!isTauri || !noteId) return;
    try {
      const [fwd, back] = await Promise.all([
        invoke<ApiNoteLink[]>('get_note_links', { note_id: noteId }),
        invoke<ApiNoteLink[]>('get_note_backlinks', { note_id: noteId }),
      ]);
      setLinks((fwd || []).map(mapApiNoteLink));
      setBacklinks((back || []).map(mapApiNoteLink));
    } catch (e) {
      console.error('Failed to load note links:', e);
    }
  }, [noteId]);

  const createLink = useCallback(
    async (targetNoteId: string, linkType?: string) => {
      if (!isTauri || !noteId) return;
      try {
        await invoke('create_note_link', {
          source_note_id: noteId,
          target_note_id: targetNoteId,
          link_type: linkType,
        });
        await loadLinks();
      } catch (e) {
        console.error('Failed to create link:', e);
        throw e;
      }
    },
    [noteId, loadLinks]
  );

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  return { links, backlinks, loadLinks, createLink };
}

export function useLiteratureNotes(literatureId?: string) {
  const [litNotes, setLitNotes] = useState<LiteratureNote[]>([]);

  const loadLiteratureNotes = useCallback(async () => {
    if (!isTauri || !literatureId) return;
    try {
      const data = await invoke<ApiLiteratureNote[]>('get_notes_by_literature', {
        literature_id: literatureId,
      });
      setLitNotes((data || []).map(mapApiLiteratureNote));
    } catch (e) {
      console.error('Failed to load literature notes:', e);
    }
  }, [literatureId]);

  const linkNote = useCallback(
    async (noteId: string, pageNumber?: number, selectionText?: string) => {
      if (!isTauri || !literatureId) return;
      const now = new Date().toISOString();
      try {
        await invoke('link_note_to_literature', {
          link: {
            id: `ln-${Date.now()}`,
            note_id: noteId,
            literature_id: literatureId,
            page_number: pageNumber,
            selection_text: selectionText,
            created_at: now,
          },
        });
        await loadLiteratureNotes();
      } catch (e) {
        console.error('Failed to link note:', e);
        throw e;
      }
    },
    [literatureId, loadLiteratureNotes]
  );

  useEffect(() => {
    loadLiteratureNotes();
  }, [loadLiteratureNotes]);

  return { litNotes, loadLiteratureNotes, linkNote };
}
