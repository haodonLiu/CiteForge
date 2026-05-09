// Mock for @tauri-apps/api/window in browser dev mode
export function getCurrentWindow() {
  console.log('[Mock] getCurrentWindow');
  return {
    minimize: () => console.log('[Mock] minimize'),
    toggleMaximize: () => console.log('[Mock] toggleMaximize'),
    close: () => console.log('[Mock] close'),
    startDragging: () => console.log('[Mock] startDragging'),
    onResized: () => ({ unlisten: () => Promise.resolve() }),
    onMoved: () => ({ unlisten: () => Promise.resolve() }),
  };
}