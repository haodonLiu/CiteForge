import { memo } from 'react';
import type { Annotation } from '@/lib/types';

interface AnnotationItemProps {
  annotation: Annotation;
  onDelete: (id: string) => void;
}

const AnnotationItem = memo(function AnnotationItem({ annotation, onDelete }: AnnotationItemProps) {
  return (
    <div
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
          onDelete(annotation.id);
        }
      }}
      title={annotation.content || annotation.annotationType}
    />
  );
});

export default AnnotationItem;
