import { useState, useEffect, useCallback } from 'react';
import { invoke, isTauri } from '@/lib/tauri';
import type { Literature } from '@/lib/types';
import type { ApiLiterature } from '@/lib/types/api';
import { mapApiLiterature } from '@/lib/types/domain';

interface UseLiteratureOptions {
  taskId?: string;
}

export function useLiterature({ taskId }: UseLiteratureOptions = {}) {
  const [literature, setLiterature] = useState<Literature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLiterature = useCallback(async () => {
    if (!isTauri || !taskId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await invoke<ApiLiterature[]>('get_literature', { task_id: taskId });
      setLiterature((data || []).map(mapApiLiterature));
    } catch (e) {
      console.error('Failed to load literature:', e);
      setError(e instanceof Error ? e.message : '加载文献失败');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const addLiterature = useCallback(async (pdfPaths: string[]) => {
    if (!isTauri || !taskId) return;

    try {
      const imported = await invoke<ApiLiterature[]>('import_pdfs', {
        task_id: taskId,
        pdf_paths: pdfPaths,
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
  };
}
