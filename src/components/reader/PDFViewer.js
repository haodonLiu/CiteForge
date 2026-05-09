import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
pdfjs.GlobalWorkerOptions.workerSrc = "//cdnjs.cloudflare.com/ajax/libs/pdf.js/".concat(pdfjs.version, "/pdf.worker.min.js");
export default function PDFViewer(_a) {
    var file = _a.file, pageNumber = _a.pageNumber, numPages = _a.numPages, scale = _a.scale, onDocumentLoaded = _a.onDocumentLoaded, onPageChange = _a.onPageChange;
    return (_jsxs("div", { className: "pdf-viewer", children: [_jsx(Document, { file: file, onLoadSuccess: onDocumentLoaded, loading: _jsx("div", { className: "p-8 text-center", children: "\u52A0\u8F7D\u4E2D..." }), error: _jsx("div", { className: "p-8 text-center text-error", children: "\u52A0\u8F7D\u5931\u8D25" }), children: _jsx(Page, { pageNumber: pageNumber, scale: scale, renderTextLayer: true, renderAnnotationLayer: true }) }), _jsxs("div", { className: "flex items-center justify-center gap-4 p-4 border-t border-border", children: [_jsx("button", { onClick: function () { return onPageChange(Math.max(1, pageNumber - 1)); }, disabled: pageNumber <= 1, className: "px-3 py-1 rounded bg-surface hover:bg-surface-hover disabled:opacity-50", children: "\u4E0A\u4E00\u9875" }), _jsxs("span", { className: "text-secondary", children: [pageNumber, " / ", numPages] }), _jsx("button", { onClick: function () { return onPageChange(Math.min(numPages, pageNumber + 1)); }, disabled: pageNumber >= numPages, className: "px-3 py-1 rounded bg-surface hover:bg-surface-hover disabled:opacity-50", children: "\u4E0B\u4E00\u9875" })] })] }));
}
