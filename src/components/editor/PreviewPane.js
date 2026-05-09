import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { marked } from 'marked';
import katex from 'katex';
import DOMPurify from 'dompurify';
import 'katex/dist/katex.min.css';
export default function PreviewPane(_a) {
    var content = _a.content;
    var previewRef = useRef(null);
    useEffect(function () {
        if (!previewRef.current)
            return;
        // Parse markdown
        var html = marked.parse(content);
        // Render LaTeX (simplified: find $...$ and $$...$$)
        html = html.replace(/\$\$(.*?)\$\$/g, function (_, tex) {
            try {
                return katex.renderToString(tex, { displayMode: true, throwOnError: false });
            }
            catch (_a) {
                return "<span style=\"color: var(--color-error)\">LaTeX Error: ".concat(tex, "</span>");
            }
        });
        html = html.replace(/\$(.*?)\$/g, function (_, tex) {
            try {
                return katex.renderToString(tex, { displayMode: false, throwOnError: false });
            }
            catch (_a) {
                return "<span style=\"color: var(--color-error)\">".concat(tex, "</span>");
            }
        });
        // Sanitize HTML to prevent XSS
        var clean = DOMPurify.sanitize(html);
        previewRef.current.innerHTML = clean;
    }, [content]);
    return (_jsx("div", { ref: previewRef, className: "p-6 max-w-none text-text-primary\n        [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6\n        [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5\n        [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4\n        [&_p]:mb-3 [&_p]:leading-relaxed\n        [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3\n        [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3\n        [&_li]:mb-1\n        [&_code]:bg-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono\n        [&_pre]:bg-surface [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-4\n        [&_pre_code]:bg-transparent [&_pre_code]:p-0\n        [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-text-secondary [&_blockquote]:mb-3\n        [&_a]:text-primary [&_a]:underline [&_a]:hover:opacity-80\n        [&_strong]:font-semibold\n        [&_table]:w-full [&_table]:border-collapse [&_table]:mb-4\n        [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:bg-surface\n        [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2" }));
}
