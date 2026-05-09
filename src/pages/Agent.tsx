import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Bot, ArrowLeft } from 'lucide-react';
import AgentTerminal from '@/components/agent/AgentTerminal';
import PersonalitySelector from '@/components/agent/PersonalitySelector';
import { AgentPersonality } from '@/lib/types';
import { useAppStore } from '@/lib/store';

const defaultPersonalities: AgentPersonality[] = [
  {
    id: '1',
    name: '严谨学者',
    description: '直言不讳，批判性高，追求准确',
    traits: {
      directness: 70,
      humor: 20,
      curiosity: 80,
      criticalness: 80,
      patience: 60,
      creativity: 40,
    },
    interaction_style: {
      proactive_questions: true,
      challenge_assumptions: true,
      suggest_alternatives: false,
      use_analogies: false,
      cite_sources: true,
    },
    system_prompt: '你是一个严谨的学术助手。',
  },
  {
    id: '2',
    name: '激励导师',
    description: '幽默、好奇、鼓励探索',
    traits: {
      directness: 40,
      humor: 60,
      curiosity: 90,
      criticalness: 30,
      patience: 80,
      creativity: 70,
    },
    interaction_style: {
      proactive_questions: true,
      challenge_assumptions: false,
      suggest_alternatives: true,
      use_analogies: true,
      cite_sources: false,
    },
    system_prompt: '你是一个激励型导师。',
  },
  {
    id: '3',
    name: '批判性思考者',
    description: '直接、质疑假设、推动深入思考',
    traits: {
      directness: 90,
      humor: 30,
      curiosity: 90,
      criticalness: 95,
      patience: 40,
      creativity: 60,
    },
    interaction_style: {
      proactive_questions: true,
      challenge_assumptions: true,
      suggest_alternatives: true,
      use_analogies: false,
      cite_sources: true,
    },
    system_prompt: '你是一个批判性思考者。',
  },
];

export default function AgentPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const tasks = useAppStore((s) => s.tasks);
  const task = taskId ? tasks[taskId] : null;

  const [selectedPersonality, setSelectedPersonality] = useState('1');
  const currentPersonality = defaultPersonalities.find((p) => p.id === selectedPersonality);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface/50 shrink-0">
        <div className="flex items-center gap-2">
          {taskId && (
            <Link
              to={`/task/${taskId}`}
              className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft size={12} />
              返回概览
            </Link>
          )}
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <Bot size={14} className="text-primary" />
            <h1 className="text-sm font-semibold text-text-primary">
              {task ? `${task.topic} · ` : ''}Agent 助手
            </h1>
          </div>
        </div>
      </div>

      <PersonalitySelector
        personalities={defaultPersonalities}
        selected={selectedPersonality}
        onSelect={setSelectedPersonality}
      />
      <div className="flex-1 overflow-hidden">
        <AgentTerminal personality={currentPersonality?.name || 'Agent'} />
      </div>
    </div>
  );
}
