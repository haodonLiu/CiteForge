import { AgentPersonality } from '@/lib/types';
import Button from '@/components/ui/Button';

interface PersonalitySelectorProps {
  personalities: AgentPersonality[];
  selected: string;
  onSelect: (id: string) => void;
}

export default function PersonalitySelector({
  personalities,
  selected,
  onSelect,
}: PersonalitySelectorProps) {
  return (
    <div className="p-4 border-b border-border">
      <h2 className="text-xs font-semibold mb-2 text-text-muted uppercase tracking-wider">选择 Agent 个性</h2>
      <div className="flex gap-2">
        {personalities.map((p) => (
          <Button
            key={p.id}
            variant={selected === p.id ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onSelect(p.id)}
          >
            {p.name}
          </Button>
        ))}
      </div>
    </div>
  );
}