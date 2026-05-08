'use client';

import { useState } from 'react';
import { Annotation } from '@/lib/types';

interface AnnotationLayerProps {
  annotations: Annotation[];
  currentPage: number;
  onAddAnnotation: (annotation: Omit<Annotation, 'id' | 'created_at'>) => void;
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

  const pageAnnotations = annotations.filter(a => a.page_number === currentPage);

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      onMouseUp={handleMouseUp}
    >
      {pageAnnotations.map((annotation) => (
        <div
          key={annotation.id}
          className="absolute pointer-events-auto cursor-pointer"
          style={{
            left: `${annotation.position.x * 100}%`,
            top: `${annotation.position.y * 100}%`,
            width: `${annotation.position.width * 100}%`,
            height: `${annotation.position.height * 100}%`,
            backgroundColor: annotation.color,
            opacity: 0.3,
          }}
          onClick={() => {
            if (confirm('删除此批注？')) {
              onDeleteAnnotation(annotation.id);
            }
          }}
          title={annotation.content || annotation.annotation_type}
        />
      ))}

      {selectedText && selectionRect && (
        <div
          className="absolute bg-card border border-border rounded shadow-lg p-2 pointer-events-auto z-50"
          style={{
            left: selectionRect.left,
            top: selectionRect.bottom + 8,
          }}
        >
          <div className="flex gap-2">
            <button
              onClick={() => {
                onAddAnnotation({
                  document_id: '',
                  page_number: currentPage,
                  annotation_type: 'Highlight',
                  color: '#fbbf24',
                  position: {
                    x: selectionRect.left / window.innerWidth,
                    y: selectionRect.top / window.innerHeight,
                    width: selectionRect.width / window.innerWidth,
                    height: selectionRect.height / window.innerHeight,
                    page_width: 1,
                    page_height: 1,
                  },
                });
                setSelectedText('');
                setSelectionRect(null);
              }}
              className="px-2 py-1 text-sm bg-yellow-200 rounded"
            >
              高亮
            </button>
            <button
              onClick={() => {
                onAddAnnotation({
                  document_id: '',
                  page_number: currentPage,
                  annotation_type: 'Underline',
                  color: '#6366f1',
                  position: {
                    x: selectionRect.left / window.innerWidth,
                    y: selectionRect.top / window.innerHeight,
                    width: selectionRect.width / window.innerWidth,
                    height: selectionRect.height / window.innerHeight,
                    page_width: 1,
                    page_height: 1,
                  },
                });
                setSelectedText('');
                setSelectionRect(null);
              }}
              className="px-2 py-1 text-sm bg-indigo-200 rounded"
            >
              划线
            </button>
            <button
              onClick={() => {
                const content = prompt('输入笔记内容：');
                if (content) {
                  onAddAnnotation({
                    document_id: '',
                    page_number: currentPage,
                    annotation_type: 'Note',
                    content,
                    color: '#22c55e',
                    position: {
                      x: selectionRect.left / window.innerWidth,
                      y: selectionRect.top / window.innerHeight,
                      width: selectionRect.width / window.innerWidth,
                      height: selectionRect.height / window.innerHeight,
                      page_width: 1,
                      page_height: 1,
                    },
                  });
                }
                setSelectedText('');
                setSelectionRect(null);
              }}
              className="px-2 py-1 text-sm bg-green-200 rounded"
            >
              笔记
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
