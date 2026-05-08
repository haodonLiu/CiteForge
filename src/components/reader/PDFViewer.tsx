'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  file: string | ArrayBuffer | null;
  pageNumber: number;
  numPages: number;
  scale: number;
  onDocumentLoaded: ({ numPages }: { numPages: number }) => void;
  onPageChange: (page: number) => void;
}

export default function PDFViewer({
  file,
  pageNumber,
  numPages,
  scale,
  onDocumentLoaded,
  onPageChange,
}: PDFViewerProps) {
  return (
    <div className="pdf-viewer">
      <Document
        file={file}
        onLoadSuccess={onDocumentLoaded}
        loading={<div className="p-8 text-center">加载中...</div>}
        error={<div className="p-8 text-center text-error">加载失败</div>}
      >
        <Page
          pageNumber={pageNumber}
          scale={scale}
          renderTextLayer={true}
          renderAnnotationLayer={true}
        />
      </Document>

      <div className="flex items-center justify-center gap-4 p-4 border-t border-border">
        <button
          onClick={() => onPageChange(Math.max(1, pageNumber - 1))}
          disabled={pageNumber <= 1}
          className="px-3 py-1 rounded bg-surface hover:bg-surface-hover disabled:opacity-50"
        >
          上一页
        </button>
        <span className="text-secondary">
          {pageNumber} / {numPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(numPages, pageNumber + 1))}
          disabled={pageNumber >= numPages}
          className="px-3 py-1 rounded bg-surface hover:bg-surface-hover disabled:opacity-50"
        >
          下一页
        </button>
      </div>
    </div>
  );
}
