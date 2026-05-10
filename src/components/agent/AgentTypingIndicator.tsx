import { Bot } from 'lucide-react';

export default function AgentTypingIndicator() {
  return (
    <div className="relative pl-6 pb-4">
      <div className="absolute left-0 top-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
        <Bot size={12} className="text-primary" />
      </div>
      <div className="bg-surface border border-l-2 border-l-primary/50 rounded-md p-3">
        <span className="text-[13px] text-text-muted">思考中...</span>
      </div>
    </div>
  );
}
