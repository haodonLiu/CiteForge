import { memo } from 'react';
import { Bot, User } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AgentMessageProps {
  message: Message;
  isLast: boolean;
}

const AgentMessage = memo(function AgentMessage({ message, isLast }: AgentMessageProps) {
  return (
    <div className="relative pl-6 pb-4">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[9px] top-6 bottom-0 w-px bg-border" />
      )}

      {/* Avatar */}
      <div className={`absolute left-0 top-0 w-5 h-5 rounded-full flex items-center justify-center ${
        message.role === 'assistant' ? 'bg-primary/10' : 'bg-surface'
      }`}>
        {message.role === 'assistant'
          ? <Bot size={12} className="text-primary" />
          : <User size={12} className="text-text-muted" />
        }
      </div>

      {/* Message content */}
      <div className="bg-surface border border-l-2 border-l-primary rounded-md p-3">
        <p className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
      </div>

      {/* Timestamp */}
      <span className="text-[10px] text-text-muted mt-1 block">
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
});

export default AgentMessage;
