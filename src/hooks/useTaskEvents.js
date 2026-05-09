import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useAppStore } from '@/lib/store';
export function useTaskEvents() {
    var updateTaskFromEvent = useAppStore(function (s) { return s.updateTaskFromEvent; });
    useEffect(function () {
        var unlisten = listen('task-event', function (event) {
            updateTaskFromEvent(event.payload);
        });
        return function () {
            unlisten.then(function (fn) { return fn(); });
        };
    }, [updateTaskFromEvent]);
}
