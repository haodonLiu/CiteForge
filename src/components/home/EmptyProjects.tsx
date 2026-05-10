import { Sparkles, Plus } from 'lucide-react';
import Card from '@/components/ui/Card';

interface EmptyProjectsProps {
  className?: string;
}

export default function EmptyProjects({ className = '' }: EmptyProjectsProps) {
  return (
    <Card className={`p-8 text-center border-dashed ${className}`}>
      <div className="relative inline-block mb-4">
        <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center">
          <Sparkles size={28} className="text-primary/40" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success/20 rounded-full flex items-center justify-center">
          <Plus size={10} className="text-success" />
        </div>
      </div>
      <p className="text-sm text-text-secondary mb-1">暂无进行中的项目</p>
      <p className="text-xs text-text-muted">
        点击右上角「新建项目」或「导入文献」开始
      </p>
    </Card>
  );
}
