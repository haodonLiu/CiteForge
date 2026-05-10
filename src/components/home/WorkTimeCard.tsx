import { Clock } from 'lucide-react';
import Card from '@/components/ui/Card';
import { getWeekData, getWorkTimeForDay } from '@/hooks/useActivityTracker';

interface WorkTimeCardProps {
  className?: string;
}

export default function WorkTimeCard({ className = '' }: WorkTimeCardProps) {
  const today = new Date().toISOString().slice(0, 10);
  const weekData = getWeekData();
  const todayMinutes = getWorkTimeForDay(today);
  const totalWeekMinutes = weekData.reduce((sum, d) => sum + d.minutes, 0);

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
          <Clock size={14} className="text-primary" />
        </div>
        <h3 className="text-xs font-medium text-text-secondary">本周工作时长</h3>
      </div>

      <div className="h-16 flex items-end gap-1">
        {weekData.map((day, i) => {
          const maxMinutes = 240;
          const height = Math.min((day.minutes / maxMinutes) * 100, 100);
          const isToday = day.date === today;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-t transition-all duration-300 ${
                  isToday ? 'bg-primary' : 'bg-primary/30'
                }`}
                style={{ height: `${Math.max(height, 4)}%` }}
              />
              <span className={`text-[10px] ${isToday ? 'text-primary font-medium' : 'text-text-muted'}`}>
                {day.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mt-2 text-xs text-text-muted">
        <span>今日 {formatMinutes(todayMinutes)}</span>
        <span>本周 {formatMinutes(totalWeekMinutes)}</span>
      </div>
    </Card>
  );
}
