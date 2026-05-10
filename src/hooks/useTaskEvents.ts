import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { listen, isTauri } from '@/lib/tauri';
import type { ApiTaskEvent } from '@/lib/types/api';
import { mapApiTaskEvent } from '@/lib/types/domain';

export function useTaskEvents() {
  const updateTaskFromEvent = useAppStore((s) => s.updateTaskFromEvent);

  useEffect(() => {
    if (!isTauri) return;

    const unlisten = listen<ApiTaskEvent>('task-event', (event: { payload: ApiTaskEvent }) => {
      const domainEvent = mapApiTaskEvent(event.payload);
      updateTaskFromEvent(domainEvent);
    });

    return () => {
      unlisten.then((fn: () => void) => fn());
    };
  }, [updateTaskFromEvent]);
}
