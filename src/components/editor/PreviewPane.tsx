import { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { initLatexRenderer, renderLatexToDataUrl, splitByLatexExpressions } from '@/lib/latex-renderer';

interface PreviewPaneProps {
  content: string;
}

export default function PreviewPane({ content }: PreviewPaneProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [renderedParts, setRenderedParts] = useState<Array<{
    type: 'text' | 'latex';
    content: string;
    html?: string;
    dataUrl?: string;
    displayMode: boolean;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      if (!previewRef.current || cancelled) return;

      try {
        await initLatexRenderer();

        if (cancelled) return;

        // Split content by LaTeX expressions
        const parts = splitByLatexExpressions(content);

        // Render each part
        const rendered = await Promise.all(
          parts.map(async (part) => {
            if (part.type === 'text') {
              // Parse markdown for text parts
              const html = DOMPurify.sanitize(await marked.parse(part.content) as string);
              return { ...part, html };
            } else {
              // Render LaTeX to image
              const dataUrl = await renderLatexToDataUrl(part.content, {
                fontSize: part.displayMode ? 24 : 18,
                color: 'currentColor',
                backgroundColor: 'transparent',
                displayMode: part.displayMode,
              });
              return { ...part, dataUrl };
            }
          })
        );

        if (cancelled) return;

        setRenderedParts(rendered);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to render preview:', error);
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [content]);

  return (
    <div
      ref={previewRef}
      className="p-6 max-w-none text-text-primary"
      data-loading={isLoading}
    >
      {isLoading ? (
        <div className="text-text-muted">渲染中...</div>
      ) : (
        <>
          {renderedParts.map((part, index) => {
            if (part.type === 'text' && part.html) {
              return (
                <div
                  key={index}
                  className="prose-content"
                  dangerouslySetInnerHTML={{ __html: part.html }}
                />
              );
            } else if (part.type === 'latex' && part.dataUrl) {
              const className = part.displayMode ? 'latex-display' : 'latex-inline';
              return (
                <span key={index} className={`${className} inline-block align-middle`}>
                  <img
                    src={part.dataUrl}
                    alt={part.content}
                    className="max-w-full h-auto"
                  />
                </span>
              );
            }
            return null;
          })}
        </>
      )}
    </div>
  );
}
