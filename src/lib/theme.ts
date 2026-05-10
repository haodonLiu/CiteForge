import type { AppTheme } from './store';
import type { FontSettings } from './types/domain';
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

// Snake_case for localStorage/API compatibility
interface StoredFontSettings {
  font_family: string;
  font_size: number;
  line_height: number;
}

export const defaultFontSettings: FontSettings = {
  fontFamily: 'system',
  fontSize: 14,
  lineHeight: 1.75,
};

const defaultStoredFontSettings: StoredFontSettings = {
  font_family: 'system',
  font_size: 14,
  line_height: 1.75,
};

export const applyFontSettings = (settings: FontSettings) => {
  const root = document.documentElement;
  const preset = fontPresets.find((p) => p.value === settings.fontFamily);
  const fontStack = preset?.stack || settings.fontFamily;

  root.style.setProperty('--font-sans', fontStack);
  root.style.setProperty('--font-serif', fontStack);
  root.style.setProperty('--font-size-base', `${settings.fontSize}px`);
  root.style.setProperty('--line-height', `${settings.lineHeight}`);
};

export const persistFontSettings = (settings: FontSettings) => {
  const stored: StoredFontSettings = {
    font_family: settings.fontFamily,
    font_size: settings.fontSize,
    line_height: settings.lineHeight,
  };
  localStorage.setItem('citeforge-font', JSON.stringify(stored));
  if (isTauri) {
    invoke('set_setting', { key: 'font', value: JSON.stringify(stored) }).catch(console.error);
  }
};

export const getStoredFontSettings = (): FontSettings => {
  try {
    const stored = localStorage.getItem('citeforge-font');
    if (stored) {
      const parsed: StoredFontSettings = JSON.parse(stored);
      return {
        fontFamily: parsed.font_family ?? defaultFontSettings.fontFamily,
        fontSize: parsed.font_size ?? defaultFontSettings.fontSize,
        lineHeight: parsed.line_height ?? defaultFontSettings.lineHeight,
      };
    }
  } catch {
    // ignore parse errors
  }
  return { ...defaultFontSettings };
};
