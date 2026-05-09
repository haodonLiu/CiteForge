import { useRef, useState, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
// @ts-ignore - @tanstack/react-virtual needs to be installed
import { useVirtualizer } from '@tanstack/react-virtual';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfVirtualViewerProps {
  file: string | ArrayBuffer | null;
  scale: number;
  onDocumentLoaded: ({ numPages }: { numPages: number }) => void;
  onVisiblePageChange?: (page: number) => void;
}

export default function PdfVirtualViewer({
  file,
  scale,
  onDocumentLoaded,
  onVisiblePageChange,
}: PdfVirtualViewerProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [documentLoaded, setDocumentLoaded] = useState(false);

  const handleDocumentLoad = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setDocumentLoaded(true);
    onDocumentLoaded({ numPages });
  }, [onDocumentLoaded]);

  // 虚拟列表：只渲染可见页面
  const virtualizer = useVirtualizer({
    count: numPages,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => Math.round(800 * scale), [scale]),
    overscan: 2,
  });

  // 监听可见页面变化
  useEffect(() => {
    if (!documentLoaded || !onVisiblePageChange) return;

    const virtualItems = virtualizer.getVirtualItems();
    if (virtualItems.length > 0) {
      // 取中间的可见页面作为当前页
      const midIndex = Math.floor(virtualItems.length / 2);
      const visiblePage = virtualItems[midIndex]?.index;
      if (visiblePage !== undefined) {
        onVisiblePageChange(visiblePage + 1);
      }
    }
  }, [virtualizer.getVirtualItems(), documentLoaded, onVisiblePageChange]);

  // 滚动到指定页面
  const scrollToPage = useCallback((page: number) => {
    virtualizer.scrollToIndex(page - 1, { align: 'center' });
  }, [virtualizer]);

  // 暴露 scrollToPage 方法给父组件
  useEffect(() => {
    if (parentRef.current) {
      (parentRef.current as any).__scrollToPage = scrollToPage;
    }
  }, [scrollToPage]);

  // 全局键盘事件监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        const currentIndex = virtualizer.getVirtualItems()[0]?.index ?? 0;
        const newPage = Math.max(0, currentIndex - 1);
        virtualizer.scrollToIndex(newPage, { align: 'start' });
      } else if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        const currentIndex = virtualizer.getVirtualItems()[0]?.index ?? 0;
        const newPage = Math.min(numPages - 1, currentIndex + 1);
        virtualizer.scrollToIndex(newPage, { align: 'start' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [virtualizer, numPages]);

  return (
    <div
      ref={parentRef}
      className="h-full overflow-auto bg-surface"
      style={{ contain: 'strict' }}
    >
      <Document
        file={file}
        onLoadSuccess={handleDocumentLoad}
        loading={
          <div className="flex items-center justify-center h-64">
            <div className="text-text-muted">加载 PDF 中...</div>
          </div>
        }
        error={
          <div className="flex items-center justify-center h-64">
            <div className="text-error">PDF 加载失败</div>
          </div>
        }
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((item: any) => (
            <div
              key={item.key}
              data-index={item.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${item.start}px)`,
              }}
            >
              <div className="flex justify-center py-2">
                <div className="relative shadow-lg">
                  <Page
                    pageNumber={item.index + 1}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={false}
                  />
                  {/* 页码标签 */}
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded">
                    {item.index + 1}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Document>
    </div>
  );
}
