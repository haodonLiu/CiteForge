import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
// @ts-ignore - @tanstack/react-virtual needs to be installed
import { useVirtualizer } from '@tanstack/react-virtual';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
pdfjs.GlobalWorkerOptions.workerSrc = "//cdnjs.cloudflare.com/ajax/libs/pdf.js/".concat(pdfjs.version, "/pdf.worker.min.js");
export default function PdfVirtualViewer(_a) {
    var file = _a.file, scale = _a.scale, onDocumentLoaded = _a.onDocumentLoaded, onVisiblePageChange = _a.onVisiblePageChange;
    var parentRef = useRef(null);
    var _b = useState(0), numPages = _b[0], setNumPages = _b[1];
    var _c = useState(false), documentLoaded = _c[0], setDocumentLoaded = _c[1];
    var handleDocumentLoad = useCallback(function (_a) {
        var numPages = _a.numPages;
        setNumPages(numPages);
        setDocumentLoaded(true);
        onDocumentLoaded({ numPages: numPages });
    }, [onDocumentLoaded]);
    // 虚拟列表：只渲染可见页面
    var virtualizer = useVirtualizer({
        count: numPages,
        getScrollElement: function () { return parentRef.current; },
        estimateSize: useCallback(function () { return Math.round(800 * scale); }, [scale]),
        overscan: 2,
    });
    // 监听可见页面变化
    useEffect(function () {
        var _a;
        if (!documentLoaded || !onVisiblePageChange)
            return;
        var virtualItems = virtualizer.getVirtualItems();
        if (virtualItems.length > 0) {
            // 取中间的可见页面作为当前页
            var midIndex = Math.floor(virtualItems.length / 2);
            var visiblePage = (_a = virtualItems[midIndex]) === null || _a === void 0 ? void 0 : _a.index;
            if (visiblePage !== undefined) {
                onVisiblePageChange(visiblePage + 1);
            }
        }
    }, [virtualizer.getVirtualItems(), documentLoaded, onVisiblePageChange]);
    // 滚动到指定页面
    var scrollToPage = useCallback(function (page) {
        virtualizer.scrollToIndex(page - 1, { align: 'center' });
    }, [virtualizer]);
    // 暴露 scrollToPage 方法给父组件
    useEffect(function () {
        if (parentRef.current) {
            parentRef.current.__scrollToPage = scrollToPage;
        }
    }, [scrollToPage]);
    // 全局键盘事件监听
    useEffect(function () {
        var handleKeyDown = function (e) {
            var _a, _b, _c, _d;
            if (e.key === 'ArrowUp' || e.key === 'PageUp') {
                e.preventDefault();
                var currentIndex = (_b = (_a = virtualizer.getVirtualItems()[0]) === null || _a === void 0 ? void 0 : _a.index) !== null && _b !== void 0 ? _b : 0;
                var newPage = Math.max(0, currentIndex - 1);
                virtualizer.scrollToIndex(newPage, { align: 'start' });
            }
            else if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
                e.preventDefault();
                var currentIndex = (_d = (_c = virtualizer.getVirtualItems()[0]) === null || _c === void 0 ? void 0 : _c.index) !== null && _d !== void 0 ? _d : 0;
                var newPage = Math.min(numPages - 1, currentIndex + 1);
                virtualizer.scrollToIndex(newPage, { align: 'start' });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return function () { return window.removeEventListener('keydown', handleKeyDown); };
    }, [virtualizer, numPages]);
    return (_jsx("div", { ref: parentRef, className: "h-full overflow-auto bg-surface", style: { contain: 'strict' }, children: _jsx(Document, { file: file, onLoadSuccess: handleDocumentLoad, loading: _jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "text-text-muted", children: "\u52A0\u8F7D PDF \u4E2D..." }) }), error: _jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "text-error", children: "PDF \u52A0\u8F7D\u5931\u8D25" }) }), children: _jsx("div", { style: {
                    height: "".concat(virtualizer.getTotalSize(), "px"),
                    width: '100%',
                    position: 'relative',
                }, children: virtualizer.getVirtualItems().map(function (item) { return (_jsx("div", { "data-index": item.index, ref: virtualizer.measureElement, style: {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: "translateY(".concat(item.start, "px)"),
                    }, children: _jsx("div", { className: "flex justify-center py-2", children: _jsxs("div", { className: "relative shadow-lg", children: [_jsx(Page, { pageNumber: item.index + 1, scale: scale, renderTextLayer: true, renderAnnotationLayer: false }), _jsx("div", { className: "absolute bottom-2 right-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded", children: item.index + 1 })] }) }) }, item.key)); }) }) }) }));
}
