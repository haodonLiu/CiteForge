// Tauri API wrapper - provides stubs when not in Tauri environment

export const isTauri = typeof window.__TAURI__ !== 'undefined';

export const tauriInvoke = async <T>(cmd: string, args?: Record<string, unknown>): Promise<T> => {
  if (!isTauri) {
    throw new Error('Not in Tauri environment');
  }
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(cmd, args);
};

export const tauriGetWindow = () => {
  if (!isTauri) {
    return {
      minimize: () => {},
      toggleMaximize: () => {},
      close: () => {},
      startDragging: () => {},
    };
  }
  // Use static import - it's OK since we're in a function, not module top-level
  // The error only happens when the module itself tries to call Tauri APIs at load time
  return window.__TAURI__.window.getCurrentWindow();
};

export async function tauriListen<T>(event: string, handler: (event: { payload: T }) => void) {
  if (!isTauri) {
    return () => {};
  }
  const { listen } = await import('@tauri-apps/api/event');
  return listen<T>(event, handler);
}
