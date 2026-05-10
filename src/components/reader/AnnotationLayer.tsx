import { useState } from 'react';
import type { Annotation } from '@/lib/types';
import AnnotationItem from './AnnotationItem';
import AnnotationPopup from './AnnotationPopup';

interface AnnotationLayerProps {
  annotations: Annotation[];
  currentPage: number;
  onAddAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => void;
  onDeleteAnnotation: (id: string) => void;
}

export default function AnnotationLayer({
  annotations,
  currentPage,
  onAddAnnotation,
  onDeleteAnnotation,
}: AnnotationLayerProps) {
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(selection.toString());
      setSelectionRect(rect);
    }
  };

  const pageAnnotations = annotations.filter(a => a.pageNumber === currentPage);

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      onMouseUp={handleMouseUp}
    >
      {pageAnnotations.map((annotation) => (
        <AnnotationItem
          key={annotation.id}
          annotation={annotation}
          onDelete={onDeleteAnnotation}
        />
      ))}

      {selectedText && selectionRect && (
        <AnnotationPopup
          selectionRect={selectionRect}
          currentPage={currentPage}
          onAddAnnotation={onAddAnnotation}
          onClose={() => {
            setSelectedText('');
            setSelectionRect(null);
          }}
        />
      )}
    </div>
  );
}
