import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { listen, isTauri } from '@/lib/tauri';
export function useTaskEvents() {
    var updateTaskFromEvent = useAppStore(function (s) { return s.updateTaskFromEvent; });
    useEffect(function () {
        if (!isTauri)
            return;
        var unlisten = listen('task-event', function (event) {
            updateTaskFromEvent(event.payload);
        });
        return function () {
            unlisten.then(function (fn) { return fn(); });
        };
    }, [updateTaskFromEvent]);
}
