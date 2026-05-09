// Mock for @tauri-apps/api/window in browser dev mode
export function getCurrentWindow() {
    console.log('[Mock] getCurrentWindow');
    return {
        minimize: function () { return console.log('[Mock] minimize'); },
        toggleMaximize: function () { return console.log('[Mock] toggleMaximize'); },
        close: function () { return console.log('[Mock] close'); },
        startDragging: function () { return console.log('[Mock] startDragging'); },
        onResized: function () { return ({ unlisten: function () { return Promise.resolve(); } }); },
        onMoved: function () { return ({ unlisten: function () { return Promise.resolve(); } }); },
    };
}
