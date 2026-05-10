export type ViewMode = 'edit' | 'split' | 'preview';

interface EditorStatusBarProps {
  wordCount: number;
  charCount: number;
  lastSaved: Date | null;
  isSaving: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function EditorStatusBar({
  wordCount,
  charCount,
  lastSaved,
  isSaving,
  viewMode,
  onViewModeChange,
}: EditorStatusBarProps) {
  const formatLastSaved = (date: Date | null) => {
    if (!date) return '未保存';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 5) return '刚刚保存';
    if (diff < 60) return `${diff}秒前保存`;
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前保存`;
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const viewModes: { mode: ViewMode; label: string }[] = [
    { mode: 'edit', label: '编辑' },
    { mode: 'split', label: '分屏' },
    { mode: 'preview', label: '预览' },
  ];

  return (
    <div className="shrink-0 flex items-center justify-between px-4 py-1.5 border-t border-border bg-surface/50 text-[11px] text-text-muted">
      <div className="flex items-center gap-4">
        <span>{wordCount} 字</span>
        <span>{charCount} 字符</span>
      </div>

      <div className="flex items-center gap-3">
        <span className={isSaving ? 'text-warning' : 'text-text-muted'}>
          {isSaving ? '保存中...' : formatLastSaved(lastSaved)}
        </span>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-surface rounded px-1 py-0.5">
          {viewModes.map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={`px-2 py-0.5 rounded transition-colors ${
                viewMode === mode
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-surface-hover'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
