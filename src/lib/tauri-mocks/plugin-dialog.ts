// Mock for @tauri-apps/plugin-dialog in browser dev mode
export async function open(_options?: any): Promise<string | null> {
  console.log('[Mock] open dialog');
  return null;
}

export async function save(_options?: any): Promise<string | null> {
  console.log('[Mock] save dialog');
  return null;
}

export async function message(_message: string, _options?: any): Promise<void> {
  console.log('[Mock] message:', _message);
}

export async function ask(_message: string, _options?: any): Promise<boolean> {
  console.log('[Mock] ask:', _message);
  return false;
}

export async function confirm(_message: string, _options?: any): Promise<boolean> {
  console.log('[Mock] confirm:', _message);
  return false;
}