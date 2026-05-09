import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { listen, isTauri } from '@/lib/tauri';
import type { TaskEvent } from '@/lib/types';

export function useTaskEvents() {
  const updateTaskFromEvent = useAppStore((s) => s.updateTaskFromEvent);

  useEffect(() => {
    if (!isTauri) return;

    const unlisten = listen<TaskEvent>('task-event', (event: { payload: TaskEvent }) => {
      updateTaskFromEvent(event.payload);
    });

    return () => {
      unlisten.then((fn: () => void) => fn());
    };
  }, [updateTaskFromEvent]);
}
