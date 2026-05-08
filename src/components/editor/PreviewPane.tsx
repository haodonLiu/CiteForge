import { useEffect, useRef } from 'react';
import { marked } from 'marked';
import katex from 'katex';
import DOMPurify from 'dompurify';
import 'katex/dist/katex.min.css';

interface PreviewPaneProps {
  content: string;
}

export default function PreviewPane({ content }: PreviewPaneProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!previewRef.current) return;

    // Parse markdown
    let html = marked.parse(content) as string;

    // Render LaTeX (simplified: find $...$ and $$...$$)
    html = html.replace(/\$\$(.*?)\$\$/g, (_, tex) => {
      try {
        return katex.renderToString(tex, { displayMode: true, throwOnError: false });
      } catch {
        return `<span class="text-error">LaTeX Error: ${tex}</span>`;
      }
    });

    html = html.replace(/\$(.*?)\$/g, (_, tex) => {
      try {
        return katex.renderToString(tex, { displayMode: false, throwOnError: false });
      } catch {
        return `<span class="text-error">${tex}</span>`;
      }
    });

    // Sanitize HTML to prevent XSS
    const clean = DOMPurify.sanitize(html);
    previewRef.current.innerHTML = clean;
  }, [content]);

  return (
    <div
      ref={previewRef}
      className="p-6 prose prose-invert max-w-none"
    />
  );
}