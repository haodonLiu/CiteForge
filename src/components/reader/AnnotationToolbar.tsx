import Button from '@/components/ui/Button';

interface AnnotationToolbarProps {
  onAddHighlight: () => void;
  onAddUnderline: () => void;
  onAddNote: () => void;
  onClearAll: () => void;
  activeColor: string;
  onColorChange: (color: string) => void;
}

export default function AnnotationToolbar({
  onAddHighlight,
  onAddUnderline,
  onAddNote,
  onClearAll,
  activeColor,
  onColorChange,
}: AnnotationToolbarProps) {
  const colors = [
    { id: 'yellow', color: '#fbbf24', label: '黄色' },
    { id: 'indigo', color: '#6366f1', label: '紫色' },
    { id: 'green', color: '#22c55e', label: '绿色' },
    { id: 'red', color: '#ef4444', label: '红色' },
    { id: 'blue', color: '#3b82f6', label: '蓝色' },
  ];

  return (
    <div className="flex items-center gap-2 p-2 border-b border-border bg-surface">
      <Button size="sm" variant="ghost" onClick={onAddHighlight} title="添加高亮">
        高亮
      </Button>
      <Button size="sm" variant="ghost" onClick={onAddUnderline} title="添加划线">
        划线
      </Button>
      <Button size="sm" variant="ghost" onClick={onAddNote} title="添加笔记">
        笔记
      </Button>

      <div className="w-px h-5 bg-border mx-1" />

      <div className="flex items-center gap-1">
        <span className="text-xs text-text-muted mr-1">颜色:</span>
        {colors.map(({ id, color, label }) => (
          <button
            key={id}
            onClick={() => onColorChange(color)}
            className={`w-5 h-5 rounded-full border-2 transition-all duration-150 ${
              activeColor === color ? 'border-primary scale-110' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
            style={{ backgroundColor: color }}
            title={label}
          />
        ))}
      </div>

      <div className="flex-1" />

      <Button size="sm" variant="ghost" onClick={onClearAll} title="清除所有批注">
        清除全部
      </Button>
    </div>
  );
}
