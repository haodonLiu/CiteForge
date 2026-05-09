import { Link } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  Edit3,
  Bot,
  Upload,
  Globe,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import { useAppStore } from '@/lib/store';
import type { Literature } from '@/lib/types';

interface HomeProps {
  recentLiterature?: Literature[];
}

export default function Home({ recentLiterature = [] }: HomeProps) {
  const tasks = useAppStore((s) => s.tasks);
  const currentTaskId = useAppStore((s) => s.currentTaskId);

  const recentTasks = Object.values(tasks).slice(0, 3);
  const activeTask = currentTaskId ? tasks[currentTaskId] : null;

  const quickStart = [
    { to: '/library', icon: Upload, label: '导入 PDF', desc: '从本地文件导入' },
    { to: '/library', icon: Globe, label: '从 Semantic Scholar', desc: '在线搜索导入' },
    { to: '/agent', icon: Bot, label: '新建综述任务', desc: 'AI 协作写作' },
  ];

  const getTimeEstimate = (progress: number) => {
    const remaining = (1 - progress) * 30;
    if (remaining < 1) return '即将完成';
    return `预计 ${Math.round(remaining)} 分钟`;
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-text-primary mb-1">欢迎回来</h1>
          <p className="text-sm text-text-secondary">
            {activeTask ? '你有一个进行中的任务' : '开始你的学术研究之旅'}
          </p>
        </div>

        {activeTask && (
          <div className="mb-8">
            <h2 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-3">
              继续写作
            </h2>
            <Card clickable className="group">
              <Link to="/editor/1" className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-text-primary truncate mb-1">
                    {activeTask.topic}
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      {activeTask.currentAgent && (
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                          {activeTask.currentAgent}
                        </span>
                      )}
                      <span className="text-xs text-text-muted">
                        {activeTask.status}
                      </span>
                    </div>
                    <span className="text-xs text-text-muted">
                      {getTimeEstimate(activeTask.progress)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-hover rounded-full overflow-hidden mt-3">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${activeTask.progress * 100}%` }}
                    />
                  </div>
                </div>
                <ArrowRight
                  size={18}
                  className="text-text-muted ml-4 group-hover:text-primary transition-colors"
                />
              </Link>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-8">
          {quickStart.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} to={item.to}>
                <Card clickable className="h-full group">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[14px] font-medium text-text-primary block">
                        {item.label}
                      </span>
                      <span className="text-[12px] text-text-muted">{item.desc}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {recentLiterature.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                最近文献
              </h2>
              <Link
                to="/library"
                className="text-xs text-primary hover:underline"
              >
                查看全部
              </Link>
            </div>
            <div className="space-y-2">
              {recentLiterature.slice(0, 5).map((lit) => (
                <Card key={lit.id} clickable className="group">
                  <Link to={`/reader/${lit.id}`} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-surface flex items-center justify-center shrink-0">
                      <FileText size={14} className="text-text-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-medium text-text-primary truncate">
                        {lit.title}
                      </h4>
                      <p className="text-[11px] text-text-muted">
                        {lit.authors[0]?.name || 'Unknown'} · {lit.year || 'n.d.'}
                        {lit.citation_count ? ` · 被引 ${lit.citation_count} 次` : ''}
                      </p>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        )}

        {recentTasks.length > 0 && !activeTask && (
          <div>
            <h2 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-3">
              最近任务
            </h2>
            <div className="space-y-2">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 bg-surface border border-border rounded-md"
                >
                  <Clock size={14} className="text-text-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-text-primary truncate">{task.topic}</p>
                    <p className="text-[11px] text-text-muted">{task.status}</p>
                  </div>
                  <div className="w-16 h-1.5 bg-surface-hover rounded-full overflow-hidden shrink-0">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${task.progress * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}