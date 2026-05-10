import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface AgentInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

export default function AgentInput({ input, onInputChange, onSend, isLoading }: AgentInputProps) {
  return (
    <div className="p-3 border-t border-border shrink-0">
      <div className="max-w-2xl mx-auto flex gap-2">
        <Input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSend()}
          placeholder="输入消息..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button
          variant="primary"
          onClick={onSend}
          disabled={isLoading || !input.trim()}
          size="md"
        >
          发送
        </Button>
      </div>
    </div>
  );
}
