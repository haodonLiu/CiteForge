import { invoke } from '@tauri-apps/api/core';
import type { AppTheme } from './store';

declare global {
  interface Window {
    monaco?: {
      editor: {
        setTheme: (theme: string) => void;
      };
    };
  }
}

export const setTheme = (theme: AppTheme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('citeforge-theme', theme);

  if (window.monaco) {
    const monacoTheme = theme === 'midnight_scholar' ? 'vs-dark' : 'vs';
    window.monaco.editor.setTheme(monacoTheme);
  }

  // Only invoke in Tauri environment
  if (typeof window.__TAURI__ !== 'undefined') {
    invoke('set_setting', { key: 'theme', value: theme }).catch(console.error);
  }
};

export const getStoredTheme = (): AppTheme | null => {
  const stored = localStorage.getItem('citeforge-theme');
  if (stored && ['ivory_press', 'midnight_scholar', 'green_garden', 'high_contrast'].includes(stored)) {
    return stored as AppTheme;
  }
  return null;
};