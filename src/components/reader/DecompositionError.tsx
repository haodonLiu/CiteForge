import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';

interface DecompositionErrorProps {
  error: string | null;
  onRetry: () => void;
}

export default function DecompositionError({ error, onRetry }: DecompositionErrorProps) {
  return (
    <div className="p-4">
      <div className="border border-error/30 bg-error/5 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={16} className="text-error" />
          <h4 className="text-error font-medium text-sm">结构提取失败</h4>
        </div>
        <p className="text-xs text-text-secondary mb-3">{error}</p>
        <div className="flex gap-2">
          <Button size="sm" onClick={onRetry}>
            <RefreshCw size={12} className="mr-1" />
            重试
          </Button>
          <Button size="sm" variant="ghost">
            手动编辑结构
          </Button>
        </div>
      </div>
    </div>
  );
}
