import { useEffect, useRef, useCallback } from 'react';

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function useActivityTracker() {
  const lastActiveRef = useRef(Date.now());
  const accumulatedRef = useRef(0);

  const recordActivity = useCallback(() => {
    const now = Date.now();
    const idle = now - lastActiveRef.current;

    if (idle < IDLE_TIMEOUT && idle > 0) {
      accumulatedRef.current += idle;
    }
    lastActiveRef.current = now;
  }, []);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'mousemove', 'touchstart'];
    events.forEach(e => window.addEventListener(e, recordActivity, { passive: true }));

    // Persist every minute
    const interval = setInterval(() => {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const stored = localStorage.getItem(`worktime-${today}`);
      const current = stored ? parseInt(stored, 10) : 0;
      const minutes = Math.floor(accumulatedRef.current / 1000 / 60);
      if (minutes > 0) {
        localStorage.setItem(`worktime-${today}`, String(current + minutes));
        accumulatedRef.current = 0;
      }
    }, 60 * 1000);

    return () => {
      events.forEach(e => window.removeEventListener(e, recordActivity));
      clearInterval(interval);
    };
  }, [recordActivity]);

  return { recordActivity };
}

export function getWorkTimeForDay(date: string): number {
  const stored = localStorage.getItem(`worktime-${date}`);
  return stored ? parseInt(stored, 10) : 0;
}

export function getWeekData(): { date: string; label: string; minutes: number }[] {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  const result = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    result.push({
      date: dateStr,
      label: days[d.getDay()] ?? '',
      minutes: getWorkTimeForDay(dateStr),
    });
  }

  return result;
}
