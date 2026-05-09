import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useAppStore } from '@/lib/store';
import type { TaskEvent } from '@/lib/types';

export function useTaskEvents() {
  const updateTaskFromEvent = useAppStore((s) => s.updateTaskFromEvent);

  useEffect(() => {
    // Only run in Tauri environment
    if (typeof window.__TAURI__ === 'undefined') return;

    const unlisten = listen<TaskEvent>('task-event', (event) => {
      updateTaskFromEvent(event.payload);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [updateTaskFromEvent]);
}
