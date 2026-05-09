import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { TextIndexEntry, OutlineEntry } from '@/lib/types';

export function usePdfIndex() {
  const [textIndex, setTextIndex] = useState<TextIndexEntry[]>([]);
  const [outline, setOutline] = useState<OutlineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<TextIndexEntry[]>([]);

  const generateIndex = useCallback(async (filePath: string) => {
    try {
      setLoading(true);
      const [index, outlineData] = await Promise.all([
        invoke<TextIndexEntry[]>('generate_text_index', { filePath }),
        invoke<OutlineEntry[]>('generate_outline', { filePath }),
      ]);
      setTextIndex(index);
      setOutline(outlineData);
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
