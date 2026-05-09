import { useState } from 'react';
import { Literature } from '@/lib/types';
import LiteratureCard from './LiteratureCard';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

interface LiteratureListProps {
  onSelect: (id: string) => void;
}

export default function LiteratureList({ onSelect }: LiteratureListProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');

  // TODO: Load from backend
  const literature: Literature[] = [];

  const filtered = literature.filter(lit => {
    const matchesSearch = lit.title.toLowerCase().includes(search.toLowerCase()) ||
      lit.authors.some(a => a.name.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filter === 'all' || lit.read_status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary mb-3">文献库</h1>

        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="搜索文献..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">全部</option>
            <option value="Unread">未读</option>
            <option value="Reading">阅读中</option>
            <option value="Read">已读</option>
            <option value="ToRead">待读</option>
          </Select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto p-4">
        {filtered.length === 0 ? (
          <div className="text-center text-text-muted py-12 text-sm">
            暂无文献。点击"添加文献"开始。
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(lit => (
              <LiteratureCard
                key={lit.id}
                literature={lit}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
