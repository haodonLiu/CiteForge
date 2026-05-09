import type { AgentEvent } from '@/hooks/useOrchestrator';

interface AgentTraceProps {
  events: AgentEvent[];
}

const sourceColors: Record<string, string> = {
  Orchestrator: 'text-blue-400',
  Researcher: 'text-cyan-400',
  Analyst: 'text-purple-400',
  Writer: 'text-green-400',
  Human: 'text-yellow-400',
  System: 'text-gray-400',
};

function formatEvent(event: AgentEvent): string {
  const p = event.payload as Record<string, any>;
  switch (event.event_type) {
    case 'ResearchStarted':
      return `开始检索: ${p.topic || ''}`;
    case 'ResearchCompleted':
      return `检索完成: 找到 ${p.new_count || 0} 篇文献`;
    case 'AnalysisStarted':
      return '开始分析文献主题...';
    case 'AnalysisCompleted':
      return `分析完成: ${(p.themes as string[])?.join(', ') || ''}`;
    case 'WritingStarted':
      return '开始撰写综述...';
    case 'SectionDrafted':
      return `完成章节: ${p.section || ''} (${p.word_count || 0} 字)`;
    case 'StateTransition':
      return `状态变更: ${p.from} → ${p.to}`;
    case 'CheckpointReached':
      return `等待确认: ${p.phase || ''}`;
    case 'ErrorOccurred':
      return `错误: ${p.message || ''}`;
    default:
      return event.event_type;
  }
}

export default function AgentTrace({ events }: AgentTraceProps) {
  return (
    <div className="flex flex-col gap-1 font-mono text-xs max-h-96 overflow-y-auto">
      {events.map(event => (
        <div key={event.id} className="flex gap-2 border-l-2 pl-2 border-border">
          <span className="text-text-muted shrink-0">
            {event.timestamp.slice(11, 19)}
          </span>
          <span className={`shrink-0 ${sourceColors[event.source] || 'text-text-secondary'}`}>
            [{event.source}]
          </span>
          <span className="text-text-primary">
            {formatEvent(event)}
          </span>
        </div>
      ))}
      {events.length === 0 && (
        <div className="text-text-muted text-center py-4">暂无事件</div>
      )}
    </div>
  );
}
