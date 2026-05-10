import { useState, useRef, useEffect, useCallback } from 'react';
import { useAgentChat } from '@/hooks/useAgentChat';
import type { AgentConversation } from '@/lib/types';
import AgentTerminalHeader from './AgentTerminalHeader';
import AgentMessageList from './AgentMessageList';
import AgentInput from './AgentInput';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AgentTerminalProps {
  taskId: string;
  agentName: string;
  personalityName: string;
  personalityPrompt: string;
}

function convertToMessage(conv: AgentConversation): Message {
  return {
    id: conv.id,
    role: conv.role === 'user' ? 'user' : 'assistant',
    content: conv.content,
    timestamp: new Date(conv.createdAt),
  };
}

export default function AgentTerminal({
  taskId,
  agentName,
  personalityName,
  personalityPrompt,
}: AgentTerminalProps) {
  const { messages: hookMessages, loading, sendMessage } = useAgentChat(taskId, agentName);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const displayMessages: Message[] = [
    ...hookMessages.map(convertToMessage),
    ...optimisticMessages,
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [displayMessages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    const msgId = `optimistic-${Date.now()}`;

    setInput('');
    setOptimisticMessages((prev) => [
      ...prev,
      {
        id: msgId,
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      },
    ]);

    try {
      await sendMessage(userMessage, personalityPrompt);
      setOptimisticMessages([]);
    } catch (e) {
      console.error('Failed to send message:', e);
    }
  }, [input, loading, sendMessage, personalityPrompt]);

  return (
    <div className="h-full flex flex-col bg-background">
      <AgentTerminalHeader personality={personalityName} />

      <div className="flex-1 overflow-auto">
        <AgentMessageList
          ref={messagesEndRef}
          messages={displayMessages}
          isLoading={loading}
        />
      </div>

      <AgentInput
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        isLoading={loading}
      />
    </div>
  );
}
