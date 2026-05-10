import { Bot } from 'lucide-react';

export default function AgentEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <Bot size={32} className="text-text-muted mb-3" />
      <p className="text-sm text-text-muted">开始与 Agent 对话</p>
      <p className="text-[11px] text-text-muted mt-1">按 Enter 发送消息</p>
    </div>
  );
}
