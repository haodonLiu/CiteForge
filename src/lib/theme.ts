import type { AppTheme } from './store';
import type { FontSettings } from './types';
import { isTauri, invoke } from './tauri';

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

// ── Font Presets ─────────────────────────────────────────────

export interface FontPreset {
  value: string;
  label: string;
  stack: string;
}

export const fontPresets: FontPreset[] = [
  {
    value: 'system',
    label: '系统默认',
    stack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  },
  {
    value: 'crimson',
    label: 'Crimson Pro（学术衬线）',
    stack: "'Crimson Pro', 'Crimson Text', Georgia, 'Times New Roman', serif",
  },
  {
    value: 'inter',
    label: 'Inter（现代无衬线）',
    stack: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  {
    value: 'noto-serif-sc',
    label: '思源宋体（中文衬线）',
    stack: "'Noto Serif SC', 'Source Han Serif SC', 'SimSun', serif",
  },
  {
    value: 'noto-sans-sc',
    label: '思源黑体（中文无衬线）',
    stack: "'Noto Sans SC', 'Source Han Sans SC', 'Microsoft YaHei', sans-serif",
  },
  {
    value: 'georgia',
    label: 'Georgia（经典衬线）',
    stack: "Georgia, 'Times New Roman', serif",
  },
];

export const defaultFontSettings: FontSettings = {
  font_family: 'system',
  font_size: 14,
  line_height: 1.75,
};

export const applyFontSettings = (settings: FontSettings) => {
  const root = document.documentElement;
  const preset = fontPresets.find((p) => p.value === settings.font_family);
  const fontStack = preset?.stack || settings.font_family;

  root.style.setProperty('--font-sans', fontStack);
  root.style.setProperty('--font-serif', fontStack);
  root.style.setProperty('--font-size-base', `${settings.font_size}px`);
  root.style.setProperty('--line-height', `${settings.line_height}`);
};

export const persistFontSettings = (settings: FontSettings) => {
  localStorage.setItem('citeforge-font', JSON.stringify(settings));
  if (isTauri) {
    invoke('set_setting', { key: 'font', value: JSON.stringify(settings) }).catch(console.error);
  }
};

export const getStoredFontSettings = (): FontSettings => {
  try {
    const stored = localStorage.getItem('citeforge-font');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        font_family: parsed.font_family ?? defaultFontSettings.font_family,
        font_size: parsed.font_size ?? defaultFontSettings.font_size,
        line_height: parsed.line_height ?? defaultFontSettings.line_height,
      };
    }
  } catch {
    // ignore parse errors
  }
  return { ...defaultFontSettings };
};