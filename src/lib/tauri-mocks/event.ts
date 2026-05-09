// Mock for @tauri-apps/api/event in browser dev mode
export async function listen<T>(
  _event: string,
  _handler: (event: { payload: T }) => void
): Promise<() => void> {
  console.log(`[MockListen] ${_event}`);
  return () => {};
}