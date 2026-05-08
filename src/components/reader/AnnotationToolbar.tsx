'use client';

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
      <button
        onClick={onAddHighlight}
        className="px-3 py-1 text-sm rounded bg-yellow-200 hover:bg-yellow-300"
        title="添加高亮"
      >
        高亮
      </button>
      <button
        onClick={onAddUnderline}
        className="px-3 py-1 text-sm rounded bg-indigo-200 hover:bg-indigo-300"
        title="添加划线"
      >
        划线
      </button>
      <button
        onClick={onAddNote}
        className="px-3 py-1 text-sm rounded bg-green-200 hover:bg-green-300"
        title="添加笔记"
      >
        笔记
      </button>

      <div className="w-px h-6 bg-border mx-2" />

      <div className="flex items-center gap-1">
        <span className="text-sm text-secondary mr-1">颜色:</span>
        {colors.map(({ id, color, label }) => (
          <button
            key={id}
            onClick={() => onColorChange(color)}
            className={`w-6 h-6 rounded border-2 ${
              activeColor === color ? 'border-primary' : 'border-transparent'
            }`}
            style={{ backgroundColor: color }}
            title={label}
          />
        ))}
      </div>

      <div className="flex-1" />

      <button
        onClick={onClearAll}
        className="px-3 py-1 text-sm rounded bg-surface-hover hover:bg-error hover:text-white"
        title="清除所有批注"
      >
        清除全部
      </button>
    </div>
  );
}
