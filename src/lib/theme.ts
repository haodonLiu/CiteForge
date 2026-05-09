import type { AppTheme } from './store';
import { isTauri, tauriInvoke } from './tauri';

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

  if (isTauri) {
    tauriInvoke('set_setting', { key: 'theme', value: theme }).catch(console.error);
  }
};

export const getStoredTheme = (): AppTheme | null => {
  const stored = localStorage.getItem('citeforge-theme');
  if (stored && ['ivory_press', 'midnight_scholar', 'green_garden', 'high_contrast'].includes(stored)) {
    return stored as AppTheme;
  }
  return null;
};