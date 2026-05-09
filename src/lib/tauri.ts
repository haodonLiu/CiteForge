// Tauri API wrapper - uses Vite aliases to redirect to mocks in browser dev mode
import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import { listen as tauriListen } from '@tauri-apps/api/event';
import { getCurrentWindow as tauriGetCurrentWindow } from '@tauri-apps/api/window';
import { open as tauriOpen } from '@tauri-apps/plugin-dialog';

// Detect Tauri environment
export const isTauri = typeof window !== 'undefined' &&
  (window as any).__TAURI_INTERNALS__ !== undefined;

// Re-export with same names - Vite aliases handle the mocking in dev mode
export const invoke = tauriInvoke;
export const listen = tauriListen;
export const getCurrentWindow = tauriGetCurrentWindow;
export const open = tauriOpen;