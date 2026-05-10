import { Layers } from 'lucide-react';

export default function DecompositionIdle() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-text-muted">
      <Layers size={32} className="opacity-30" />
      <p className="text-sm">选择一篇论文开始拆解</p>
      <p className="text-xs">或导入 PDF 自动提取结构</p>
    </div>
  );
}
