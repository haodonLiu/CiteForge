import { useState, useRef, useCallback, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Annotation, OutlineEntry } from '@/lib/types';
import { usePdfIndex } from '@/hooks/usePdfIndex';

const PdfVirtualViewer = lazy(() => import('@/components/reader/PdfVirtualViewer'));
import AnnotationLayer from '@/components/reader/AnnotationLayer';
import TextSelectionMenu from '@/components/reader/TextSelectionMenu';
import DecompositionPanel from '@/components/reader/DecompositionPanel';

export default function Reader() {
  const { id } = useParams<{ id: string }>();
  const [filePath, setFilePath] = useState<string | null>(null);
  const [file, setFile] = useState<string | ArrayBuffer | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'outline' | 'structure'>('outline');
  const containerRef = useRef<HTMLDivElement>(null);
  const [notes, setNotes] = useState<{ text: string; page: number; timestamp: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOutline, setShowOutline] = useState(true);

  const { outline, searchResults, loading: indexLoading, generateIndex, search, clearSearch } = usePdfIndex();

  const handleVisiblePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleAddNote = useCallback((text: string, page: number) => {
    setNotes(prev => [...prev, {
      text,
      page,
      timestamp: new Date().toISOString(),
    }]);
  }, []);

  const handleInsertCitation = useCallback((text: string, page: number) => {
    // TODO: 与 Writer Agent 集成，将选中文本作为引用插入草稿
    console.log('Insert citation:', { text, page });
  }, []);

  const handleSearchSemantic = useCallback((text: string) => {
    // TODO: 调用 Semantic Scholar API 搜索
    console.log('Search semantic scholar:', text);
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      await search(query);
    } else {
      clearSearch();
    }
  }, [search, clearSearch]);

  const jumpToPage = useCallback((page: number) => {
    setCurrentPage(page);
    const container = containerRef.current;
    if (container) {
      const scrollToPage = (container as any).__scrollToPage;
      if (scrollToPage) {
        scrollToPage(page);
      }
    }
  }, []);

  const scrollToPage = useCallback((page: number) => {
    const container = containerRef.current;
    if (container) {
      const scrollToPage = (container as any).__scrollToPage;
      if (scrollToPage) {
        scrollToPage(page);
      }
    }
  }, []);

  // 键盘快捷键
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      setCurrentPage(p => Math.max(1, p - 1));
      scrollToPage(Math.max(1, currentPage - 1));
    } else if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      setCurrentPage(p => Math.min(numPages, p + 1));
      scrollToPage(Math.min(numPages, currentPage + 1));
    }
  }, [currentPage, numPages, scrollToPage]);

  return (
    <div className="h-full flex flex-col" tabIndex={0} onKeyDown={handleKeyDown}>
      <div className="h-10 flex items-center justify-between px-3 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setCurrentPage(p => Math.max(1, p - 1));
                scrollToPage(Math.max(1, currentPage - 1));
              }}
              disabled={currentPage <= 1}
              className="w-7 h-7 p-0"
            >
              ◀
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setCurrentPage(p => Math.min(numPages, p + 1));
                scrollToPage(Math.min(numPages, currentPage + 1));
              }}
              disabled={currentPage >= numPages}
              className="w-7 h-7 p-0"
            >
              ▶
            </Button>
          </div>

          <div className="w-px h-4 bg-border" />

          <Select
            value={`${Math.round(scale * 100)}%`}
            onChange={(e) => {
              const val = parseInt(e.target.value) / 100;
              setScale(val);
            }}
            className="w-20 h-7 text-xs"
          >
            <option value="50%">50%</option>
            <option value="75%">75%</option>
            <option value="100%">100%</option>
            <option value="125%">125%</option>
            <option value="150%">150%</option>
            <option value="200%">200%</option>
          </Select>

          <div className="w-px h-4 bg-border" />

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setScale(1.0)}
            className="h-7 px-2 text-xs"
            title="适应页面"
          >
            ⬜
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="搜索..."
              className="h-7 w-40 pl-7 pr-2 text-xs bg-surface-hover border border-border rounded focus:outline-none focus:border-primary"
            />
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted">🔍</span>
          </div>

          <div className="w-px h-4 bg-border" />

          <Button
            size="sm"
            variant={showSidebar ? 'primary' : 'ghost'}
            onClick={() => setShowSidebar(!showSidebar)}
            className="h-7 px-2 text-xs"
          >
            📑 目录
          </Button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* PDF 查看器 */}
        <div ref={containerRef} className="flex-1 overflow-hidden relative">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="text-text-muted">加载 PDF 查看器...</div>
            </div>
          }>
            <PdfVirtualViewer
              file={file}
              scale={scale}
              onDocumentLoaded={({ numPages }) => setNumPages(numPages)}
              onVisiblePageChange={handleVisiblePageChange}
            />
          </Suspense>

          {/* 批注层 */}
          <AnnotationLayer
            annotations={annotations}
            currentPage={currentPage}
            onAddAnnotation={(annotation) => {
              setAnnotations(prev => [...prev, {
                ...annotation,
                id: Date.now().toString(),
                created_at: new Date().toISOString(),
              }]);
            }}
            onDeleteAnnotation={(id) => {
              setAnnotations(prev => prev.filter(a => a.id !== id));
            }}
          />

          {/* 文本选择菜单 */}
          <TextSelectionMenu
            onAddNote={handleAddNote}
            onInsertCitation={handleInsertCitation}
            onSearchSemantic={handleSearchSemantic}
          />
        </div>

        {/* 侧边栏 */}
        {showSidebar && (
          <div className="w-72 border-l border-border bg-surface flex flex-col overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-border shrink-0">
              <button
                onClick={() => setSidebarTab('outline')}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                  sidebarTab === 'outline'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                目录
              </button>
              <button
                onClick={() => setSidebarTab('structure')}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                  sidebarTab === 'structure'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                结构分析
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-auto">
              {sidebarTab === 'outline' && (
                <>
                  {/* 搜索框 */}
                  <div className="p-3 border-b border-border">
                    <Input
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="搜索文档内容..."
                      className="w-full"
                    />
                    {searchResults.length > 0 && (
                      <div className="mt-2 text-xs text-text-muted">
                        找到 {searchResults.length} 个结果
                      </div>
                    )}
                  </div>

                  {/* 搜索结果 */}
                  {searchResults.length > 0 && (
                    <div className="p-3 border-b border-border">
                      <h3 className="text-sm font-semibold text-text-primary mb-2">搜索结果</h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {searchResults.slice(0, 20).map((result, idx) => (
                          <button
                            key={idx}
                            onClick={() => jumpToPage(result.page)}
                            className="w-full text-left p-2 text-xs rounded hover:bg-surface-hover transition-colors"
                          >
                            <div className="text-text-muted mb-1">第 {result.page} 页</div>
                            <div className="text-text-primary line-clamp-2">{result.text}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 大纲目录 */}
                  {outline.length > 0 && (
                    <div className="p-3 border-b border-border">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-text-primary">目录</h3>
                        <button
                          onClick={() => setShowOutline(!showOutline)}
                          className="text-xs text-text-muted hover:text-text-primary"
                        >
                          {showOutline ? '收起' : '展开'}
                        </button>
                      </div>
                      {showOutline && (
                        <div className="space-y-1">
                          {outline.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => jumpToPage(item.page)}
                              className="w-full text-left text-xs py-1 hover:text-primary transition-colors"
                              style={{ paddingLeft: `${(item.level - 1) * 12 + 4}px` }}
                            >
                              <span className="text-text-secondary">{item.title}</span>
                              <span className="text-text-muted ml-2">p.{item.page}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 文档信息 */}
                  <div className="p-3 border-b border-border">
                    <h3 className="text-sm font-semibold text-text-primary mb-2">文档信息</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-muted">总页数</span>
                        <span className="text-text-primary">{numPages}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">当前页</span>
                        <span className="text-text-primary">{currentPage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">缩放</span>
                        <span className="text-text-primary">{Math.round(scale * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* 快捷键 */}
                  <div className="p-3 border-b border-border">
                    <h3 className="text-sm font-semibold text-text-primary mb-2">快捷键</h3>
                    <div className="space-y-1 text-xs text-text-secondary">
                      <div>↑/PageUp: 上一页</div>
                      <div>↓/PageDown/空格: 下一页</div>
                      <div>Ctrl+F: 搜索</div>
                    </div>
                  </div>

                  {/* 批注统计 */}
                  <div className="p-3 border-b border-border">
                    <h3 className="text-sm font-semibold text-text-primary mb-2">批注统计</h3>
                    <div className="text-sm text-text-secondary">
                      共 {annotations.length} 条批注
                    </div>
                  </div>

                  {/* 笔记 */}
                  {notes.length > 0 && (
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-text-primary mb-2">笔记</h3>
                      <div className="space-y-2">
                        {notes.map((note, idx) => (
                          <div key={idx} className="text-xs p-2 bg-surface rounded border border-border">
                            <div className="text-text-muted mb-1">第 {note.page} 页</div>
                            <div className="text-text-primary line-clamp-3">{note.text}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {sidebarTab === 'structure' && (
                <DecompositionPanel
                  filePath={filePath}
                  onJumpToPage={jumpToPage}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
