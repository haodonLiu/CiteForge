import { useState, useEffect, useCallback } from 'react';
import { invoke, isTauri } from '@/lib/tauri';
import type { Literature } from '@/lib/types';
import type { ApiLiterature, ApiSearchResult, ApiInsertCitationRequest } from '@/lib/types/api';
import { mapApiLiterature, mapApiSearchResult, mapInsertCitationRequest } from '@/lib/types/domain';
import type { SearchResult, InsertCitationRequest } from '@/lib/types/domain';

interface UseLiteratureOptions {
  taskId?: string;
}

export function useLiterature({ taskId }: UseLiteratureOptions = {}) {
  const [literature, setLiterature] = useState<Literature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLiterature = useCallback(async () => {
    if (!isTauri) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await invoke<ApiLiterature[]>('get_literature', { taskId });
      setLiterature((data || []).map(mapApiLiterature));
    } catch (e) {
      console.error('Failed to load literature:', e);
      setError(e instanceof Error ? e.message : '加载文献失败');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const addLiterature = useCallback(async (pdfPaths: string[]) => {
    if (!isTauri) return;

    try {
      const imported = await invoke<ApiLiterature[]>('import_pdfs', {
        taskId,
        pdfPaths,
      });
      const newLiterature = (imported || []).map(mapApiLiterature);
      setLiterature(prev => [...prev, ...newLiterature]);
    } catch (e) {
      console.error('Failed to import PDFs:', e);
      throw e;
    }
  }, [taskId]);

  const updateLiteratureStatus = useCallback((id: string, status: Literature['readStatus']) => {
    setLiterature(prev => prev.map(lit =>
      lit.id === id ? { ...lit, readStatus: status } : lit
    ));
  }, []);

  // Search academic papers via Semantic Scholar
  const searchAcademicPapers = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!isTauri) return [];

    try {
      const results = await invoke<ApiSearchResult[]>('search_semantic_scholar', {
        query,
        limit: 20,
      });
      return (results || []).map(mapApiSearchResult);
    } catch (e) {
      console.error('Failed to search papers:', e);
      throw e;
    }
  }, []);

  // Insert a citation manually or from search results
  const insertCitation = useCallback(async (citation: InsertCitationRequest): Promise<Literature> => {
    if (!isTauri) throw new Error('Not in Tauri');

    try {
      const apiRequest = mapInsertCitationRequest(citation);
      const result = await invoke<ApiLiterature>('insert_citation', {
        taskId,
        citation: apiRequest,
      });
      const newLiterature = mapApiLiterature(result);
      setLiterature(prev => [...prev, newLiterature]);
      return newLiterature;
    } catch (e) {
      console.error('Failed to insert citation:', e);
      throw e;
    }
  }, [taskId]);

  // Copy literature from global library to a task
  const copyToTask = useCallback(async (literatureId: string, targetTaskId: string): Promise<Literature> => {
    if (!isTauri) throw new Error('Not in Tauri');

    try {
      const result = await invoke<ApiLiterature>('copy_to_task', {
        literatureId,
        taskId: targetTaskId,
      });
      const newLiterature = mapApiLiterature(result);
      return newLiterature;
    } catch (e) {
      console.error('Failed to copy literature to task:', e);
      throw e;
    }
  }, []);

  useEffect(() => {
    loadLiterature();
  }, [loadLiterature]);

  return {
    literature,
    loading,
    error,
    loadLiterature,
    addLiterature,
    updateLiteratureStatus,
    searchAcademicPapers,
    insertCitation,
    copyToTask,
  };
}
