// Mock for @tauri-apps/api/core in browser dev mode
export async function invoke<T>(_cmd: string, _args?: Record<string, unknown>): Promise<T> {
  console.log(`[MockInvoke] ${_cmd}`, _args);
  return null as T;
}

export function transformCallback(_callback: (response: any) => void, _once?: boolean): number {
  console.log('[Mock] transformCallback');
  return 0;
}

export const SERIALIZE_TO_IPC_FN = Symbol('SERIALIZE_TO_IPC_FN');