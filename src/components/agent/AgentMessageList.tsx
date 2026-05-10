import { forwardRef } from 'react';
import AgentEmptyState from './AgentEmptyState';
import AgentMessage from './AgentMessage';
import AgentTypingIndicator from './AgentTypingIndicator';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AgentMessageListProps {
  messages: Message[];
  isLoading: boolean;
}

const AgentMessageList = forwardRef<HTMLDivElement, AgentMessageListProps>(
  ({ messages, isLoading }, ref) => {
    if (messages.length === 0 && !isLoading) {
      return <AgentEmptyState />;
    }

    return (
      <div className="max-w-2xl mx-auto py-4 px-4">
        {messages.map((msg, i) => (
          <AgentMessage
            key={msg.id}
            message={msg}
            isLast={i === messages.length - 1 && !isLoading}
          />
        ))}

        {isLoading && <AgentTypingIndicator />}

        <div ref={ref} />
      </div>
    );
  }
);

AgentMessageList.displayName = 'AgentMessageList';

export default AgentMessageList;
