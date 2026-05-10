import { useState, useCallback } from 'react';
import { invoke } from '@/lib/tauri';
import type { TextIndexEntry, OutlineEntry } from '@/lib/types';
import type { ApiTextIndexEntry, ApiOutlineEntry } from '@/lib/types/api';
import { mapApiTextIndexEntry, mapApiOutlineEntry } from '@/lib/types/domain';

export function usePdfIndex() {
  const [textIndex, setTextIndex] = useState<TextIndexEntry[]>([]);
  const [outline, setOutline] = useState<OutlineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<TextIndexEntry[]>([]);

  const generateIndex = useCallback(async (filePath: string) => {
    try {
      setLoading(true);
      const [index, outlineData] = await Promise.all([
        invoke<ApiTextIndexEntry[]>('generate_text_index', { filePath }),
        invoke<ApiOutlineEntry[]>('generate_outline', { filePath }),
      ]);
      setTextIndex((index || []).map(mapApiTextIndexEntry));
      setOutline((outlineData || []).map(mapApiOutlineEntry));
    } catch (e) {
      console.error('failed to generate PDF index:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await invoke<TextIndexEntry[]>('search_text_index', {
        textIndex,
        query,
      });
      setSearchResults(results);
    } catch (e) {
      console.error('failed to search text index:', e);
    }
  }, [textIndex]);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
  }, []);

  return {
    textIndex,
    outline,
    searchResults,
    loading,
    generateIndex,
    search,
    clearSearch,
  };
}
