import { useState, useRef, useEffect } from 'react';
import { Bot, User } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AgentTerminalProps {
  personality: string;
}

export default function AgentTerminal({ personality }: AgentTerminalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const msgId = `msg-${Date.now()}`;
    setInput('');
    setMessages(prev => [...prev, {
      id: msgId,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    }]);
    setIsLoading(true);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `我是 ${personality}，正在处理您的请求："${userMessage}"`,
        timestamp: new Date(),
      }]);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="h-12 px-4 flex items-center border-b border-border shrink-0">
        <Bot size={16} className="text-primary mr-2" />
        <h1 className="text-sm font-semibold text-text-primary">Agent 终端</h1>
        <span className="ml-2 text-[11px] text-text-muted">· {personality}</span>
      </div>

      {/* Messages - Thread layout */}
      <div className="flex-1 overflow-auto">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Bot size={32} className="text-text-muted mb-3" />
            <p className="text-sm text-text-muted">开始与 Agent 对话</p>
            <p className="text-[11px] text-text-muted mt-1">按 Enter 发送消息</p>
          </div>
        )}

        <div className="max-w-2xl mx-auto py-4 px-4">
          {messages.map((msg, i) => (
            <div key={msg.id} className="relative pl-6 pb-4">
              {/* Timeline line */}
              {i < messages.length - 1 && (
                <div className="absolute left-[9px] top-6 bottom-0 w-px bg-border" />
              )}

              {/* Avatar */}
              <div className={`absolute left-0 top-0 w-5 h-5 rounded-full flex items-center justify-center ${
                msg.role === 'assistant' ? 'bg-primary/10' : 'bg-surface'
              }`}>
                {msg.role === 'assistant'
                  ? <Bot size={12} className="text-primary" />
                  : <User size={12} className="text-text-muted" />
                }
              </div>

              {/* Message content */}
              <div className="bg-surface border border-l-2 border-l-primary rounded-md p-3">
                <p className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>

              {/* Timestamp */}
              <span className="text-[10px] text-text-muted mt-1 block">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="relative pl-6 pb-4">
              <div className="absolute left-0 top-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot size={12} className="text-primary" />
              </div>
              <div className="bg-surface border border-l-2 border-l-primary/50 rounded-md p-3">
                <span className="text-[13px] text-text-muted">思考中...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input - fixed bottom */}
      <div className="p-3 border-t border-border shrink-0">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="输入消息..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            size="md"
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  );
}