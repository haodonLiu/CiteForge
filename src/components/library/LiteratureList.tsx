import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, List, LayoutGrid, FileText } from 'lucide-react';
import LiteratureCard from './LiteratureCard';
import ThemeView from './ThemeView';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { useLiterature } from '@/hooks/useLiterature';
import { useThemes } from '@/hooks/useThemes';
import { open, isTauri, invoke } from '@/lib/tauri';
import type { Literature } from '@/lib/types';
import type { ApiLiterature } from '@/lib/types/api';

interface LiteratureListProps {
  onSelect: (id: string) => void;
}

export default function LiteratureList({ onSelect }: LiteratureListProps) {
  const { taskId } = useParams<{ taskId: string }>();
  const { literature, loading, addLiterature, loadLiterature } = useLiterature({ taskId });
  const { themes, loading: themesLoading } = useThemes({ taskId });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [isImporting, setIsImporting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'theme'>('list');
  const [themeFilter, setThemeFilter] = useState<string | null>(null);
  const [showImportMenu, setShowImportMenu] = useState(false);

  const filtered = literature.filter((lit: Literature) => {
    const matchesSearch =
      lit.title.toLowerCase().includes(search.toLowerCase()) ||
      lit.authors.some((a) =>
        a.name.toLowerCase().includes(search.toLowerCase())
      );
    const matchesFilter = filter === 'all' || lit.readStatus === filter;
    const matchesTheme = !themeFilter || (() => {
      const theme = themes.find((t) => t.id === themeFilter);
      return theme ? theme.literatureIds.includes(lit.id) : true;
    })();
    return matchesSearch && matchesFilter && matchesTheme;
  });

  const handleImportPdf = async () => {
    if (!isTauri) return;
    try {
      const selected = await open({
        multiple: true,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });
      if (
        selected &&
        (Array.isArray(selected) ? selected.length > 0 : selected)
      ) {
        const paths = Array.isArray(selected) ? selected : [selected];
        setIsImporting(true);
        await addLiterature(paths);
      }
    } catch (e) {
      console.error('Failed to import PDF:', e);
    } finally {
      setIsImporting(false);
    }
  };

  const handleFilterByTheme = (themeId: string | null) => {
    setThemeFilter(themeId);
    setViewMode('list');
  };

  const handleImportBibtex = useCallback(async () => {
    if (!isTauri || !taskId) return;
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'BibTeX', extensions: ['bib', 'bibtex'] }],
      });
      if (selected && typeof selected === 'string') {
        setIsImporting(true);
        setShowImportMenu(false);
        const content = await invoke<string>('read_text_file', { filePath: selected }).catch(() => '');
        if (content) {
          await invoke<ApiLiterature[]>('import_bibtex', {
            task_id: taskId,
            bibtex_content: content,
          });
          await loadLiterature();
        }
      }
    } catch (e) {
      console.error('Failed to import BibTeX:', e);
    } finally {
      setIsImporting(false);
    }
  }, [taskId, loadLiterature]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-text-primary">文献库</h1>
          <div className="relative">
            <Button
              size="sm"
              onClick={() => setShowImportMenu(!showImportMenu)}
              disabled={isImporting || !taskId}
            >
              <Upload size={13} />
              {isImporting ? '导入中...' : '导入文献'}
            </Button>
            {showImportMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
                <button
                  onClick={() => { setShowImportMenu(false); handleImportPdf(); }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-surface-hover flex items-center gap-2"
                >
                  <FileText size={12} />
                  导入 PDF 文件
                </button>
                <button
                  onClick={handleImportBibtex}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-surface-hover flex items-center gap-2"
                >
                  <FileText size={12} />
                  导入 BibTeX
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mb-3">
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

        {/* View Toggle */}
        <div className="flex bg-surface rounded-md p-0.5 gap-0.5">
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-card text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <List size={14} />
            列表视图
          </button>
          <button
            onClick={() => setViewMode('theme')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded transition-colors ${
              viewMode === 'theme'
                ? 'bg-card text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <LayoutGrid size={14} />
            主题视图
          </button>
        </div>

        {themeFilter && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-text-muted">当前筛选:</span>
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {themes.find((t) => t.id === themeFilter)?.name || '主题'}
            </span>
            <button
              onClick={() => setThemeFilter(null)}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              清除
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'theme' ? (
          <ThemeView
            themes={themes}
            literature={literature}
            loading={themesLoading}
            onSelect={onSelect}
            onFilterByTheme={handleFilterByTheme}
          />
        ) : (
          <div className="p-4">
            {loading ? (
              <div className="text-center text-text-muted py-12 text-sm">
                加载中...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-text-muted py-12 text-sm">
                {literature.length === 0
                  ? '暂无文献。点击"导入文献"开始。'
                  : '没有找到匹配的文献。'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((lit) => (
                  <LiteratureCard
                    key={lit.id}
                    literature={lit}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
