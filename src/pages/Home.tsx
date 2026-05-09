import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import {
  FileText,
  Globe,
  Plus,
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle,
  Clock,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import { StatusBadge, taskStatusToPhase } from '@/components/ui/StatusBadge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useAppStore } from '@/lib/store';
import { getWeekData, getWorkTimeForDay } from '@/hooks/useActivityTracker';
import type { Literature } from '@/lib/types';

interface HomeProps {
  recentLiterature?: Literature[];
}

export default function Home({ recentLiterature = [] }: HomeProps) {
  const navigate = useNavigate();
  const tasks = useAppStore((s) => s.tasks);
  const addActivity = useAppStore((s) => s.addActivity);

  const activeReviews = Object.values(tasks);
  const today = new Date().toISOString().slice(0, 10);
  const weekData = getWeekData();
  const todayMinutes = getWorkTimeForDay(today);

  const quickStart = [
    {
      emoji: '📄',
      label: '导入 PDF',
      desc: '从本地文件开始新的综述',
      action: async () => {
        const selected = await open({ multiple: true, filters: [{ name: 'PDF', extensions: ['pdf'] }] });
        if (selected && selected.length > 0) {
          addActivity({ type: 'task_created', description: `导入 ${selected.length} 个 PDF`, taskId: undefined });
          navigate('/library');
        }
      },
    },
    {
      emoji: '🌐',
      label: 'Semantic Scholar',
      desc: '搜索并导入在线文献',
      action: () => navigate('/library'),
    },
    {
      emoji: '➕',
      label: '新建空白综述',
      desc: '从头开始创作',
      action: async () => {
        try {
          const result = await invoke<{ task_id: string }>('run_task', { topic: '新综述', pdfPaths: [] });
          addActivity({ type: 'task_created', description: '创建新综述任务', taskId: result.task_id });
          navigate(`/editor/${result.task_id}`);
        } catch (e) {
          console.error('Failed to create task:', e);
        }
      },
    },
  ];

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const totalWeekMinutes = weekData.reduce((sum, d) => sum + d.minutes, 0);
  const completedCount = activeReviews.filter(t => t.status === 'Completed').length;
  const totalWords = 0; // Will be populated by get_draft_stats

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-text-primary mb-1">欢迎回来</h1>
          <p className="text-sm text-text-muted">
            {activeReviews.length > 0 ? `${activeReviews.length} 个进行中的综述` : '开始你的学术研究之旅'}
          </p>
        </div>

        {/* Quick Start */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {quickStart.map((item) => (
            <Card
              key={item.label}
              clickable
              className="p-4 cursor-pointer hover:border-primary/30 transition-colors"
              onClick={item.action}
            >
              <div className="text-2xl mb-2">{item.emoji}</div>
              <h3 className="font-medium text-text-primary">{item.label}</h3>
              <p className="text-xs text-text-muted mt-1">{item.desc}</p>
            </Card>
          ))}
        </div>

        {/* Active Reviews */}
        <div className="mb-8">
          <h2 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-3">
            进行中的综述
          </h2>

          {activeReviews.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-text-muted">暂无进行中的综述，点击上方开始</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeReviews.map((task) => {
                const phase = taskStatusToPhase(task.status);
                const progress = Math.round((task.progress || 0) * 100);
                const estimate = Math.round((1 - (task.progress || 0)) * 30);

                return (
                  <Card key={task.id} clickable className="p-4 group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-text-primary truncate">
                          {task.topic || '未命名综述'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge phase={phase} />
                          <span className="text-xs text-text-muted">
                            预计 {estimate > 0 ? `${estimate} 分钟` : '即将完成'}
                          </span>
                        </div>
                      </div>
                      <ProgressRing value={progress} size={44} />
                    </div>

                    <div className="mt-3">
                      <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      {task.lastAction && (
                        <p className="text-[11px] text-text-muted mt-1 truncate">
                          {task.lastAction}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Link
                        to={`/editor/${task.id}`}
                        className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                      >
                        继续
                      </Link>
                      <button className="text-xs px-3 py-1.5 text-text-muted hover:text-text-secondary transition-colors">
                        查看详情
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <h2 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-3">
            最近活动
          </h2>
          <Card className="p-3">
            <ActivityFeed />
          </Card>
        </div>

        {/* Stats */}
        <div>
          <h2 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-3">
            写作统计
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Work Time Chart */}
            <Card className="p-4">
              <h3 className="text-xs font-medium text-text-secondary mb-3">本周工作时长</h3>
              <div className="h-24 flex items-end gap-1">
                {weekData.map((day, i) => {
                  const maxMinutes = 240;
                  const height = Math.min((day.minutes / maxMinutes) * 100, 100);
                  const isToday = day.date === today;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-t transition-all hover:bg-primary/40 ${
                          isToday ? 'bg-primary/30' : 'bg-primary/20'
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
                <span>今日: {formatMinutes(todayMinutes)}</span>
                <span>本周: {formatMinutes(totalWeekMinutes)}</span>
              </div>
            </Card>

            {/* Writing Output */}
            <Card className="p-4">
              <h3 className="text-xs font-medium text-text-secondary mb-3">写作产出</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-semibold text-text-primary">{totalWords.toLocaleString()}</div>
                  <div className="text-xs text-text-muted">总字数</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-text-primary">{completedCount}</div>
                  <div className="text-xs text-text-muted">完成综述</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const config: Record<string, { icon: typeof BookOpen; className: string }> = {
    task_created: { icon: Plus, className: 'text-primary' },
    literature_added: { icon: BookOpen, className: 'text-info' },
    draft_generated: { icon: FileText, className: 'text-success' },
    checkpoint_reached: { icon: CheckCircle, className: 'text-warning' },
  };
  const { icon: Icon, className } = config[type] || config.task_created;
  return <Icon size={12} className={className} />;
}

function ActivityFeed() {
  const activities = useAppStore((s) => s.activities);

  if (activities.length === 0) {
    return <p className="text-xs text-text-muted text-center py-2">暂无活动记录</p>;
  }

  return (
    <div className="space-y-2">
      {activities.slice(0, 5).map((a) => (
        <div key={a.id} className="flex items-center gap-2 text-xs">
          <ActivityIcon type={a.type} />
          <span className="text-text-muted shrink-0">
            {new Date(a.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-text-secondary truncate">{a.description}</span>
        </div>
      ))}
    </div>
  );
}
