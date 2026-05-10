import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import PDFPagination from './PDFPagination';

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
    <div className="pdf-viewer flex flex-col h-full">
      <div className="flex-1 overflow-auto">
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
      </div>

      <PDFPagination
        pageNumber={pageNumber}
        numPages={numPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
