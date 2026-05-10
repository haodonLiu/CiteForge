import { useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAgentDiscussion } from '@/hooks/useAgentChat';
import { useNotes } from '@/hooks/useNotes';
import {
  MessageSquare,
  Users,
  Save,
  Loader2,
  Search,
  Brain,
  PenTool,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { AgentConversation } from '@/lib/types';

interface AgentDiscussionPanelProps {
  taskId: string;
}

const agentConfig: Record<string, { icon: ReactNode; color: string; label: string }> = {
  Researcher: {
    icon: <Search size={12} />,
    color: 'text-cyan-400',
    label: 'Researcher',
  },
  Analyst: {
    icon: <Brain size={12} />,
    color: 'text-purple-400',
    label: 'Analyst',
  },
  Writer: {
    icon: <PenTool size={12} />,
    color: 'text-green-400',
    label: 'Writer',
  },
  user: {
    icon: <Users size={12} />,
    color: 'text-yellow-400',
    label: 'User',
  },
};

function DiscussionMessage({ msg, isLast }: { msg: AgentConversation; isLast: boolean }) {
  const config = agentConfig[msg.agentName] || agentConfig.user;
  const isUser = msg.role === 'user';

  return (
    <div className="relative pl-6 pb-4">
      {(!isLast) && (
        <div className="absolute left-[9px] top-6 bottom-0 w-px bg-border" />
      )}

      <div
        className={`absolute left-0 top-0 w-5 h-5 rounded-full flex items-center justify-center ${
          isUser ? 'bg-surface' : 'bg-primary/10'
        }`}
      >
        <span className={config!.color}>{config!.icon}</span>
      </div>

      <div className="mb-1 flex items-center gap-1.5">
        <span className={`text-xs font-medium ${config!.color}`}>{config!.label}</span>
        <span className="text-[10px] text-text-muted">
          {new Date(msg.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      <div className="bg-surface border border-l-2 border-l-primary rounded-md p-3">
        <p className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap">
          {msg.content}
        </p>
      </div>
    </div>
  );
}

export default function AgentDiscussionPanel({ taskId }: AgentDiscussionPanelProps) {
  const [topic, setTopic] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const { discussion, loading, startDiscussion } = useAgentDiscussion(taskId);
  const { saveNote } = useNotes({ taskId });
  const [saving, setSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [discussion]);

  const handleStart = useCallback(async () => {
    if (!topicInput.trim() || loading) return;
    const t = topicInput.trim();
    setTopic(t);
    await startDiscussion(t);
  }, [topicInput, loading, startDiscussion]);

  const handleSaveNote = useCallback(async () => {
    if (!discussion.length) return;
    setSaving(true);
    try {
      const content = discussion
        .map((d) => `${d.agentName}: ${d.content}`)
        .join('\n\n---\n\n');
      await saveNote({
        title: `Agent讨论: ${topic || '未命名主题'}`,
        content,
      });
    } catch (e) {
      console.error('Failed to save note:', e);
    } finally {
      setSaving(false);
    }
  }, [discussion, topic, saveNote]);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="h-12 px-4 flex items-center border-b border-border shrink-0">
        <Users size={16} className="text-primary mr-2" />
        <h1 className="text-sm font-semibold text-text-primary">多Agent讨论</h1>
        <span className="ml-2 text-[11px] text-text-muted">
          Researcher · Analyst · Writer
        </span>
      </div>

      <div className="p-4 border-b border-border shrink-0">
        <div className="flex gap-2">
          <Input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            placeholder="输入讨论主题..."
            disabled={loading}
            className="flex-1"
          />
          <Button
            variant="primary"
            onClick={handleStart}
            disabled={loading || !topicInput.trim()}
            size="md"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <MessageSquare size={14} />
            )}
            开始讨论
          </Button>
        </div>
        {topic && !loading && (
          <div className="mt-2 text-xs text-text-muted">
            当前主题: <span className="text-text-secondary">{topic}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto py-4 px-4">
          {discussion.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <Users size={32} className="text-text-muted mb-3" />
              <p className="text-sm text-text-muted">输入主题开始多Agent讨论</p>
              <p className="text-[11px] text-text-muted mt-1">
                Researcher、Analyst 和 Writer 将轮流发言
              </p>
            </div>
          )}

          {discussion.map((msg, i) => (
            <DiscussionMessage
              key={msg.id}
              msg={msg}
              isLast={i === discussion.length - 1 && !loading}
            />
          ))}

          {loading && discussion.length === 0 && (
            <div className="relative pl-6 pb-4">
              <div className="absolute left-0 top-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 size={12} className="text-primary animate-spin" />
              </div>
              <div className="bg-surface border border-l-2 border-l-primary/50 rounded-md p-3">
                <span className="text-[13px] text-text-muted">
                  Agents 正在讨论中...
                </span>
              </div>
            </div>
          )}

          {loading && discussion.length > 0 && (
            <div className="relative pl-6 pb-4">
              <div className="absolute left-0 top-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 size={12} className="text-primary animate-spin" />
              </div>
              <div className="bg-surface border border-l-2 border-l-primary/50 rounded-md p-3">
                <span className="text-[13px] text-text-muted">思考中...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {discussion.length > 0 && (
        <div className="p-3 border-t border-border shrink-0">
          <div className="max-w-2xl mx-auto flex justify-end">
            <Button
              variant="secondary"
              onClick={handleSaveNote}
              disabled={saving}
              size="sm"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              保存为笔记
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
