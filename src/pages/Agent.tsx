import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Bot, ArrowLeft, MessageSquare, Users } from 'lucide-react';
import AgentTerminal from '@/components/agent/AgentTerminal';
import AgentDiscussionPanel from '@/components/agent/AgentDiscussionPanel';
import PersonalitySelector from '@/components/agent/PersonalitySelector';
import type { AgentPersonality } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import Button from '@/components/ui/Button';

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
    interactionStyle: {
      proactiveQuestions: true,
      challengeAssumptions: true,
      suggestAlternatives: false,
      useAnalogies: false,
      citeSources: true,
    },
    systemPrompt: '你是一个严谨的学术助手。',
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
    interactionStyle: {
      proactiveQuestions: true,
      challengeAssumptions: false,
      suggestAlternatives: true,
      useAnalogies: true,
      citeSources: false,
    },
    systemPrompt: '你是一个激励型导师。',
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
    interactionStyle: {
      proactiveQuestions: true,
      challengeAssumptions: true,
      suggestAlternatives: true,
      useAnalogies: false,
      citeSources: true,
    },
    systemPrompt: '你是一个批判性思考者。',
  },
];

export default function AgentPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const tasks = useAppStore((s) => s.tasks);
  const task = taskId ? tasks[taskId] : null;

  const [selectedPersonality, setSelectedPersonality] = useState('1');
  const currentPersonality = defaultPersonalities.find((p) => p.id === selectedPersonality);

  const [mode, setMode] = useState<'chat' | 'discussion'>('chat');

  if (!taskId) {
    return (
      <div className="h-full flex items-center justify-center text-text-muted">
        未指定任务
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface/50 shrink-0">
        <div className="flex items-center gap-2">
          <Link
            to={`/task/${taskId}`}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={12} />
            返回概览
          </Link>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <Bot size={14} className="text-primary" />
            <h1 className="text-sm font-semibold text-text-primary">
              {task ? `${task.topic} · ` : ''}Agent 助手
            </h1>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-1">
          <Button
            variant={mode === 'chat' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setMode('chat')}
          >
            <MessageSquare size={12} />
            单Agent聊天
          </Button>
          <Button
            variant={mode === 'discussion' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setMode('discussion')}
          >
            <Users size={12} />
            多Agent讨论
          </Button>
        </div>
      </div>

      {mode === 'chat' && (
        <>
          <PersonalitySelector
            personalities={defaultPersonalities}
            selected={selectedPersonality}
            onSelect={setSelectedPersonality}
          />
          <div className="flex-1 overflow-hidden">
            <AgentTerminal
              taskId={taskId}
              agentName={currentPersonality?.name || 'Agent'}
              personalityName={currentPersonality?.name || 'Agent'}
              personalityPrompt={currentPersonality?.systemPrompt || ''}
            />
          </div>
        </>
      )}

      {mode === 'discussion' && (
        <div className="flex-1 overflow-hidden">
          <AgentDiscussionPanel taskId={taskId} />
        </div>
      )}
    </div>
  );
}
