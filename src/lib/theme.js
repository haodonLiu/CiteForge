import { invoke } from '@tauri-apps/api/core';
export var setTheme = function (theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('citeforge-theme', theme);
    if (window.monaco) {
        var monacoTheme = theme === 'midnight_scholar' ? 'vs-dark' : 'vs';
        window.monaco.editor.setTheme(monacoTheme);
    }
    invoke('set_setting', { key: 'theme', value: theme }).catch(console.error);
};
export var getStoredTheme = function () {
    var stored = localStorage.getItem('citeforge-theme');
    if (stored && ['ivory_press', 'midnight_scholar', 'green_garden', 'high_contrast'].includes(stored)) {
        return stored;
    }
    return null;
};
