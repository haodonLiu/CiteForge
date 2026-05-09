// Mock for @tauri-apps/api/core in browser dev mode
export async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  console.log(`[MockInvoke] ${cmd}`, args);

  const mocks: Record<string, any> = {
    'get_time_status': {
      is_tracking: false,
      today_minutes: 0,
      active_task: null,
      silent_mode: false,
      silent_threshold_minutes: 5,
    },
    'get_draft_stats': { total_words: 8432, total_chars: 52000 },
    'get_tasks': [],
    'run_task': { task_id: `mock-task-${Date.now()}` },
    'resume_task': { task_id: args?.task_id || `mock-task-${Date.now()}` },
    'get_task_status': { id: args?.task_id, status: 'Pending', progress: 0 },
    'create_task': { id: 'mock-task-123', topic: 'Mock Review' },
    'record_activity': {},
    'set_setting': {},
    'get_settings': {
      llm: { provider: 'Ollama', base_url: 'http://localhost:11434', model: 'llama3' },
      chroma: { url: 'http://localhost:8000', collection: 'citeforge' },
    },
    'save_settings': {},
    'get_events': [],
    'subscribe_events': {},
    'generate_text_index': [],
    'generate_outline': [],
    'search_text_index': [],
    'analyze_paper_structure': null,
    'get_time_records': { entries: {} },
    'get_agent_context': '{}',
    'get_agent_personalities': '[]',
    'get_current_theme': 'midnight_scholar',
    'set_theme': {},
  };

  return (mocks[cmd] ?? null) as T;
}

export function transformCallback(_callback: (response: any) => void, _once?: boolean): number {
  console.log('[Mock] transformCallback');
  return 0;
}

export const SERIALIZE_TO_IPC_FN = Symbol('SERIALIZE_TO_IPC_FN');