import { useState, useMemo } from 'react';
import { Tag, ChevronDown, ChevronUp, FileText, Layers } from 'lucide-react';
import type { Literature, LiteratureTheme } from '@/lib/types';

interface ThemeViewProps {
  themes: LiteratureTheme[];
  literature: Literature[];
  loading: boolean;
  onSelect: (id: string) => void;
  onFilterByTheme?: (themeId: string | null) => void;
}

export default function ThemeView({
  themes,
  literature,
  loading,
  onSelect,
  onFilterByTheme,
}: ThemeViewProps) {
  const [expandedThemeId, setExpandedThemeId] = useState<string | null>(null);

  const literatureMap = useMemo(() => {
    const map = new Map<string, Literature>();
    literature.forEach((lit) => map.set(lit.id, lit));
    return map;
  }, [literature]);

  const handleToggleExpand = (themeId: string) => {
    setExpandedThemeId((prev) => (prev === themeId ? null : themeId));
  };

  if (loading) {
    return (
      <div className="text-center text-text-muted py-12 text-sm">
        加载主题中...
      </div>
    );
  }

  if (themes.length === 0) {
    return (
      <div className="text-center text-text-muted py-12 text-sm">
        暂无主题数据。等待 Analyst Agent 完成分析...
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {themes.map((theme) => {
        const relatedLiterature = theme.literatureIds
          .map((id) => literatureMap.get(id))
          .filter(Boolean) as Literature[];

        const isExpanded = expandedThemeId === theme.id;

        return (
          <div
            key={theme.id}
            className="bg-card border border-border rounded-lg overflow-hidden transition-all"
          >
            <div
              onClick={() => handleToggleExpand(theme.id)}
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-surface/50 transition-colors"
            >
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Tag size={18} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-text-primary">
                    {theme.name}
                  </h3>
                  <span className="text-xs text-text-muted bg-surface px-1.5 py-0.5 rounded-full">
                    {relatedLiterature.length} 篇文献
                  </span>
                </div>
                {theme.description && (
                  <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
                    {theme.description}
                  </p>
                )}
              </div>

              <div className="shrink-0 text-text-muted">
                {isExpanded ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-border px-4 py-3 space-y-2">
                {relatedLiterature.length === 0 ? (
                  <p className="text-xs text-text-muted">暂无关联文献</p>
                ) : (
                  <div className="space-y-1">
                    {relatedLiterature.map((lit) => (
                      <div
                        key={lit.id}
                        onClick={() => onSelect(lit.id)}
                        className="flex items-center gap-2 p-2 rounded hover:bg-surface cursor-pointer transition-colors"
                      >
                        <FileText
                          size={14}
                          className="text-text-muted shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-text-primary truncate">
                            {lit.title}
                          </p>
                          <p className="text-[10px] text-text-secondary truncate">
                            {lit.authors.map((a) => a.name).join(', ')}
                            {lit.year && ` · ${lit.year}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {onFilterByTheme && (
                  <div className="pt-2 border-t border-border/50 flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFilterByTheme(theme.id);
                      }}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                    >
                      <Layers size={12} />
                      按此主题筛选文献
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
