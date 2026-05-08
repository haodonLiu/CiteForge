import { AgentPersonality } from '@/lib/types';

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
      <h2 className="text-sm font-semibold mb-2 text-secondary">选择 Agent 个性</h2>
      <div className="flex gap-2">
        {personalities.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              selected === p.id
                ? 'bg-primary text-white'
                : 'bg-surface hover:bg-surface-hover text-secondary'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}