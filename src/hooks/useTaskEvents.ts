import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useAppStore } from '@/lib/store';
import type { TaskEvent } from '@/lib/types';

export function useTaskEvents() {
  const updateTaskFromEvent = useAppStore((s) => s.updateTaskFromEvent);

  useEffect(() => {
    const unlisten = listen<TaskEvent>('task-event', (event) => {
      updateTaskFromEvent(event.payload);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [updateTaskFromEvent]);
}
