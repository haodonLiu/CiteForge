import type { Annotation } from '@/lib/types';

interface AnnotationPopupProps {
  selectionRect: DOMRect;
  currentPage: number;
  onAddAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export default function AnnotationPopup({
  selectionRect,
  currentPage,
  onAddAnnotation,
  onClose,
}: AnnotationPopupProps) {
  const createAnnotation = (annotationType: string, color: string, content?: string) => {
    onAddAnnotation({
      documentId: '',
      pageNumber: currentPage,
      annotationType: annotationType as Annotation['annotationType'],
      content,
      color,
      position: {
        x: selectionRect.left / window.innerWidth,
        y: selectionRect.top / window.innerHeight,
        width: selectionRect.width / window.innerWidth,
        height: selectionRect.height / window.innerHeight,
        pageWidth: 1,
        pageHeight: 1,
      },
    });
    onClose();
  };

  return (
    <div
      className="absolute bg-card border border-border rounded shadow-lg p-2 pointer-events-auto z-50"
      style={{
        left: selectionRect.left,
        top: selectionRect.bottom + 8,
      }}
    >
      <div className="flex gap-2">
        <button
          onClick={() => createAnnotation('Highlight', '#fbbf24')}
          className="px-2 py-1 text-sm bg-yellow-200 rounded"
        >
          高亮
        </button>
        <button
          onClick={() => createAnnotation('Underline', '#6366f1')}
          className="px-2 py-1 text-sm bg-indigo-200 rounded"
        >
          划线
        </button>
        <button
          onClick={() => {
            const content = prompt('输入笔记内容：');
            if (content) {
              createAnnotation('Note', '#22c55e', content);
            }
          }}
          className="px-2 py-1 text-sm bg-green-200 rounded"
        >
          笔记
        </button>
      </div>
    </div>
  );
}
