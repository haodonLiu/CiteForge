import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, List, LayoutGrid, FileText, Search, X, Sparkles } from 'lucide-react';
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
import type { SearchResult } from '@/lib/types/domain';

interface LiteratureListProps {
  onSelect: (id: string) => void;
}

export default function LiteratureList({ onSelect }: LiteratureListProps) {
  const { taskId } = useParams<{ taskId: string }>();
  const { literature, loading, addLiterature, loadLiterature, searchAcademicPapers, insertCitation } = useLiterature({ taskId });
  const { themes, loading: themesLoading } = useThemes({ taskId });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [isImporting, setIsImporting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'theme'>('list');
  const [themeFilter, setThemeFilter] = useState<string | null>(null);
  const [showImportMenu, setShowImportMenu] = useState(false);

  // Search academic papers state
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

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

  // Search academic papers
  const handleSearchPapers = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await searchAcademicPapers(searchQuery);
      setSearchResults(results);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : '搜索失败');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFromSearch = async (result: SearchResult) => {
    try {
      await insertCitation({
        paperId: result.paperId,
        title: result.title,
        authors: result.authors,
        abstractText: result.abstractText,
        year: result.year,
        venue: result.venue,
        citationCount: result.citationCount,
        doi: result.doi,
      });
      setShowSearchPanel(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (e) {
      console.error('Failed to add citation:', e);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-text-primary">文献库</h1>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => setShowSearchPanel(!showSearchPanel)}
            >
              <Search size={13} />
              学术搜索
            </Button>
            <div className="relative">
              <Button
                size="sm"
                onClick={() => setShowImportMenu(!showImportMenu)}
                disabled={isImporting}
              >
                <Upload size={13} />
                {isImporting ? '导入中...' : '导入文件'}
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
            <Button
              size="sm"
              variant="ghost"
            >
              <Sparkles size={13} />
              Agent 推荐
            </Button>
          </div>
        </div>

        {/* Search Academic Papers Panel */}
        {showSearchPanel && (
          <div className="mb-3 p-3 bg-surface rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-text-primary">搜索学术论文</h3>
              <button
                onClick={() => { setShowSearchPanel(false); setSearchResults([]); setSearchQuery(''); }}
                className="text-text-muted hover:text-text-primary"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex gap-2 mb-2">
              <Input
                type="text"
                placeholder="输入搜索关键词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchPapers()}
              />
              <Button onClick={handleSearchPapers} disabled={isSearching || !searchQuery.trim()}>
                {isSearching ? '搜索中...' : '搜索'}
              </Button>
            </div>
            {searchError && (
              <div className="text-xs text-error mb-2">{searchError}</div>
            )}
            {searchResults.length > 0 && (
              <div className="max-h-60 overflow-auto border border-border rounded">
                {searchResults.map((result) => (
                  <div key={result.paperId} className="p-2 border-b border-border last:border-b-0 hover:bg-surface-hover">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-text-primary truncate">{result.title}</h4>
                        <p className="text-xs text-text-muted truncate">
                          {result.authors.slice(0, 3).join(', ')}
                          {result.authors.length > 3 && ' et al.'}
                          {result.year && ` (${result.year})`}
                          {result.venue && ` - ${result.venue}`}
                        </p>
                        {result.citationCount !== undefined && (
                          <p className="text-xs text-text-muted">引用: {result.citationCount}</p>
                        )}
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleAddFromSearch(result)}>
                        添加
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!isSearching && searchResults.length === 0 && searchQuery && (
              <div className="text-xs text-text-muted text-center py-2">输入关键词搜索 Semantic Scholar</div>
            )}
          </div>
        )}

        <div className="flex gap-3 mb-3">
          <div className="w-28 shrink-0">
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

          <div className="flex-1">
            <Input
              type="text"
              placeholder="搜索文献..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
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
