import { useState, useEffect, useCallback } from 'react';
import { invoke, isTauri } from '@/lib/tauri';
import type { ApiLiteratureTheme } from '@/lib/types';
import type { LiteratureTheme } from '@/lib/types/domain';
import { mapApiLiteratureTheme } from '@/lib/types/domain';

interface UseThemesOptions {
  taskId?: string;
}

export function useThemes({ taskId }: UseThemesOptions = {}) {
  const [themes, setThemes] = useState<LiteratureTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadThemes = useCallback(async () => {
    if (!isTauri || !taskId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await invoke<ApiLiteratureTheme[]>('get_themes', { task_id: taskId });
      setThemes((data || []).map(mapApiLiteratureTheme));
    } catch (e) {
      console.error('Failed to load themes:', e);
      setError(e instanceof Error ? e.message : '加载主题失败');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const saveThemes = useCallback(async (themesToSave: LiteratureTheme[]) => {
    if (!isTauri || !taskId) return;

    try {
      const apiThemes: ApiLiteratureTheme[] = themesToSave.map(t => ({
        id: t.id,
        task_id: t.taskId,
        name: t.name,
        description: t.description,
        literature_ids: t.literatureIds,
        created_at: t.createdAt,
      }));
      await invoke('save_themes', { task_id: taskId, themes: apiThemes });
      setThemes(themesToSave);
    } catch (e) {
      console.error('Failed to save themes:', e);
      throw e;
    }
  }, [taskId]);

  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  return {
    themes,
    loading,
    error,
    loadThemes,
    saveThemes,
  };
}
