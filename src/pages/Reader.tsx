import { useState } from 'react';
import { useParams } from 'react-router-dom';
import PDFViewer from '@/components/reader/PDFViewer';
import AnnotationLayer from '@/components/reader/AnnotationLayer';
import { Annotation } from '@/lib/types';

export default function Reader() {
  const { id } = useParams<{ id: string }>();
  const [file, setFile] = useState<string | ArrayBuffer | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 p-4 border-b border-border">
        <button
          onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
          className="px-3 py-1 rounded bg-surface hover:bg-surface-hover"
        >
          缩小
        </button>
        <span className="text-secondary">{Math.round(scale * 100)}%</span>
        <button
          onClick={() => setScale(s => Math.min(2.0, s + 0.1))}
          className="px-3 py-1 rounded bg-surface hover:bg-surface-hover"
        >
          放大
        </button>
        <button
          onClick={() => setScale(1.0)}
          className="px-3 py-1 rounded bg-surface hover:bg-surface-hover"
        >
          重置
        </button>
      </div>

      <div className="flex-1 overflow-auto relative">
        <PDFViewer
          file={file}
          pageNumber={pageNumber}
          numPages={numPages}
          scale={scale}
          onDocumentLoaded={({ numPages }) => setNumPages(numPages)}
          onPageChange={setPageNumber}
        />
        <AnnotationLayer
          annotations={annotations}
          currentPage={pageNumber}
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
      </div>
    </div>
  );
}
