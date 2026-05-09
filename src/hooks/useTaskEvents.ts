import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { isTauri, tauriListen } from '@/lib/tauri';
import type { TaskEvent } from '@/lib/types';

export function useTaskEvents() {
  const updateTaskFromEvent = useAppStore((s) => s.updateTaskFromEvent);

  useEffect(() => {
    if (!isTauri) return;

    const unlisten = tauriListen<TaskEvent>('task-event', (event) => {
      updateTaskFromEvent(event.payload);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [updateTaskFromEvent]);
}
