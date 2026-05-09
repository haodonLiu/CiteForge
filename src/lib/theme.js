var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { isTauri, invoke } from './tauri';
export var setTheme = function (theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('citeforge-theme', theme);
    if (window.monaco) {
        var monacoTheme = theme === 'midnight_scholar' ? 'vs-dark' : 'vs';
        window.monaco.editor.setTheme(monacoTheme);
    }
    if (isTauri) {
        invoke('set_setting', { key: 'theme', value: theme }).catch(console.error);
    }
};
export var getStoredTheme = function () {
    var stored = localStorage.getItem('citeforge-theme');
    if (stored && ['ivory_press', 'midnight_scholar', 'green_garden', 'high_contrast'].includes(stored)) {
        return stored;
    }
    return null;
};
export var fontPresets = [
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
export var defaultFontSettings = {
    font_family: 'system',
    font_size: 14,
    line_height: 1.75,
};
export var applyFontSettings = function (settings) {
    var root = document.documentElement;
    var preset = fontPresets.find(function (p) { return p.value === settings.font_family; });
    var fontStack = (preset === null || preset === void 0 ? void 0 : preset.stack) || settings.font_family;
    root.style.setProperty('--font-sans', fontStack);
    root.style.setProperty('--font-serif', fontStack);
    root.style.setProperty('--font-size-base', "".concat(settings.font_size, "px"));
    root.style.setProperty('--line-height', "".concat(settings.line_height));
};
export var persistFontSettings = function (settings) {
    localStorage.setItem('citeforge-font', JSON.stringify(settings));
    if (isTauri) {
        invoke('set_setting', { key: 'font', value: JSON.stringify(settings) }).catch(console.error);
    }
};
export var getStoredFontSettings = function () {
    var _a, _b, _c;
    try {
        var stored = localStorage.getItem('citeforge-font');
        if (stored) {
            var parsed = JSON.parse(stored);
            return {
                font_family: (_a = parsed.font_family) !== null && _a !== void 0 ? _a : defaultFontSettings.font_family,
                font_size: (_b = parsed.font_size) !== null && _b !== void 0 ? _b : defaultFontSettings.font_size,
                line_height: (_c = parsed.line_height) !== null && _c !== void 0 ? _c : defaultFontSettings.line_height,
            };
        }
    }
    catch (_d) {
        // ignore parse errors
    }
    return __assign({}, defaultFontSettings);
};
