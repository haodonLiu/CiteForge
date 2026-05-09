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
        return `<span style="color: var(--color-error)">LaTeX Error: ${tex}</span>`;
      }
    });

    html = html.replace(/\$(.*?)\$/g, (_, tex) => {
      try {
        return katex.renderToString(tex, { displayMode: false, throwOnError: false });
      } catch {
        return `<span style="color: var(--color-error)">${tex}</span>`;
      }
    });

    // Sanitize HTML to prevent XSS
    const clean = DOMPurify.sanitize(html);
    previewRef.current.innerHTML = clean;
  }, [content]);

  return (
    <div
      ref={previewRef}
      className="p-6 max-w-none text-text-primary
        [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6
        [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5
        [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4
        [&_p]:mb-3 [&_p]:leading-relaxed
        [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3
        [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3
        [&_li]:mb-1
        [&_code]:bg-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
        [&_pre]:bg-surface [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-4
        [&_pre_code]:bg-transparent [&_pre_code]:p-0
        [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-text-secondary [&_blockquote]:mb-3
        [&_a]:text-primary [&_a]:underline [&_a]:hover:opacity-80
        [&_strong]:font-semibold
        [&_table]:w-full [&_table]:border-collapse [&_table]:mb-4
        [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:bg-surface
        [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2"
    />
  );
}