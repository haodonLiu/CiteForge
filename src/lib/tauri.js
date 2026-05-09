// Tauri API wrapper - uses Vite aliases to redirect to mocks in browser dev mode
import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import { listen as tauriListen } from '@tauri-apps/api/event';
import { getCurrentWindow as tauriGetCurrentWindow } from '@tauri-apps/api/window';
import { open as tauriOpen } from '@tauri-apps/plugin-dialog';
// Detect Tauri environment
export var isTauri = typeof window !== 'undefined' &&
    window.__TAURI_INTERNALS__ !== undefined;
// Re-export with same names - Vite aliases handle the mocking in dev mode
export var invoke = tauriInvoke;
export var listen = tauriListen;
export var getCurrentWindow = tauriGetCurrentWindow;
export var open = tauriOpen;
