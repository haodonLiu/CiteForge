import { useEffect, useRef, useCallback } from 'react';
var IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
export function useActivityTracker() {
    var lastActiveRef = useRef(Date.now());
    var accumulatedRef = useRef(0);
    var recordActivity = useCallback(function () {
        var now = Date.now();
        var idle = now - lastActiveRef.current;
        if (idle < IDLE_TIMEOUT && idle > 0) {
            accumulatedRef.current += idle;
        }
        lastActiveRef.current = now;
    }, []);
    useEffect(function () {
        var events = ['mousedown', 'keydown', 'scroll', 'mousemove', 'touchstart'];
        events.forEach(function (e) { return window.addEventListener(e, recordActivity, { passive: true }); });
        // Persist every minute
        var interval = setInterval(function () {
            var today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
            var stored = localStorage.getItem("worktime-".concat(today));
            var current = stored ? parseInt(stored, 10) : 0;
            var minutes = Math.floor(accumulatedRef.current / 1000 / 60);
            if (minutes > 0) {
                localStorage.setItem("worktime-".concat(today), String(current + minutes));
                accumulatedRef.current = 0;
            }
        }, 60 * 1000);
        return function () {
            events.forEach(function (e) { return window.removeEventListener(e, recordActivity); });
            clearInterval(interval);
        };
    }, [recordActivity]);
    return { recordActivity: recordActivity };
}
export function getWorkTimeForDay(date) {
    var stored = localStorage.getItem("worktime-".concat(date));
    return stored ? parseInt(stored, 10) : 0;
}
export function getWeekData() {
    var _a;
    var days = ['日', '一', '二', '三', '四', '五', '六'];
    var result = [];
    for (var i = 6; i >= 0; i--) {
        var d = new Date();
        d.setDate(d.getDate() - i);
        var dateStr = d.toISOString().slice(0, 10);
        result.push({
            date: dateStr,
            label: (_a = days[d.getDay()]) !== null && _a !== void 0 ? _a : '',
            minutes: getWorkTimeForDay(dateStr),
        });
    }
    return result;
}
