import { Bot } from 'lucide-react';

interface AgentTerminalHeaderProps {
  personality: string;
}

export default function AgentTerminalHeader({ personality }: AgentTerminalHeaderProps) {
  return (
    <div className="h-12 px-4 flex items-center border-b border-border shrink-0">
      <Bot size={16} className="text-primary mr-2" />
      <h1 className="text-sm font-semibold text-text-primary">Agent 终端</h1>
      <span className="ml-2 text-[11px] text-text-muted">· {personality}</span>
    </div>
  );
}
