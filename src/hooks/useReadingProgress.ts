import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke, isTauri } from '@/lib/tauri';
import type { ReadingProgress } from '@/lib/types';
import type { ApiReadingProgress } from '@/lib/types/api';
import { mapApiReadingProgress } from '@/lib/types/domain';

interface UseReadingProgressOptions {
  literatureId?: string;
  taskId?: string;
}

export function useReadingProgress({ literatureId, taskId }: UseReadingProgressOptions = {}) {
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadProgress = useCallback(async () => {
    if (!isTauri || !literatureId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await invoke<ApiReadingProgress>('get_reading_progress', {
        literature_id: literatureId,
      });
      if (data) {
        setProgress(mapApiReadingProgress(data));
      }
    } catch (e) {
      console.error('Failed to load reading progress:', e);
    } finally {
      setLoading(false);
    }
  }, [literatureId]);

  const saveProgress = useCallback(
    async (currentPage: number, totalPages: number) => {
      if (!isTauri || !literatureId || !taskId) return;

      const readPercentage = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
      const payload: ApiReadingProgress = {
        literature_id: literatureId,
        task_id: taskId,
        current_page: currentPage,
        total_pages: totalPages,
        read_percentage: readPercentage,
        last_read_at: new Date().toISOString(),
      };

      // Debounce save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await invoke('save_reading_progress', { progress: payload });
          setProgress(mapApiReadingProgress(payload));
        } catch (e) {
          console.error('Failed to save reading progress:', e);
        }
      }, 2000);
    },
    [literatureId, taskId]
  );

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return { progress, loading, loadProgress, saveProgress };
}
