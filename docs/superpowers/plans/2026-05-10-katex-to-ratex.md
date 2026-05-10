# KaTeX to RaTeX WASM Replacement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace KaTeX with RaTeX WASM for LaTeX rendering in the PreviewPane component.

**Architecture:** RaTeX WASM renders LaTeX to a DisplayList JSON, which is then rendered to Canvas using web-render. Each LaTeX block is rendered to an offscreen canvas, converted to a data URL, and embedded as an image in the HTML preview.

**Tech Stack:** ratex-wasm npm package, Canvas 2D API

---

## File Structure

```
src/
├── lib/
│   └── latex-renderer.ts       # NEW: RaTeX WASM wrapper
├── components/editor/
│   ├── PreviewPane.tsx         # MODIFY: Use RaTeX instead of KaTeX
│   └── MarkdownEditor.tsx     # READ: Understand current editor setup
└── package.json               # MODIFY: Add ratex-wasm, remove katex
```

---

## Task 1: Install ratex-wasm Package

**Files:**
- Modify: `src/package.json`

- [ ] **Step 1: Add ratex-wasm to dependencies**

Run: `cd src && npm install ratex-wasm`

- [ ] **Step 2: Remove katex dependency**

Run: `cd src && npm uninstall katex`

- [ ] **Step 3: Verify package.json changes**

```json
{
  "dependencies": {
    "ratex-wasm": "^0.1.0"
    // katex should be removed
  }
}
```

---

## Task 2: Create RaTeX WASM Wrapper

**Files:**
- Create: `src/lib/latex-renderer.ts`

- [ ] **Step 1: Create the wrapper with init and render functions**

```typescript
// src/lib/latex-renderer.ts
let initialized = false;
let initPromise: Promise<void> | null = null;

export async function initLatexRenderer(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const { initRatex } = await import('ratex-wasm');
    await initRatex();
    initialized = true;
  })();

  return initPromise;
}

export async function renderLatexToDataUrl(
  latex: string,
  options: {
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
    displayMode?: boolean;
  } = {}
): Promise<string> {
  await initLatexRenderer();

  const { renderLatexToCanvas } = await import('ratex-wasm');
  const { fontSize = 20, color = '#000000', backgroundColor = 'transparent', displayMode = false } = options;

  // Create offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 200;

  renderLatexToCanvas(latex, canvas, {
    fontSize,
    padding: displayMode ? 16 : 8,
    backgroundColor,
  }, color);

  return canvas.toDataURL('image/png');
}

export function isLatexExpression(text: string): boolean {
  return text.includes('$') || text.includes('$$');
}

export function splitByLatexExpressions(content: string): Array<{ type: 'text' | 'latex'; content: string; displayMode: boolean }> {
  const parts: Array<{ type: 'text' | 'latex'; content: string; displayMode: boolean }> = [];
  
  // Match $$...$$ (display) and $...$ (inline)
  const regex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex, match.index),
        displayMode: false,
      });
    }

    const latexContent = match[0];
    const displayMode = latexContent.startsWith('$$');
    const latex = latexContent.slice(displayMode ? 2 : 1, displayMode ? -2 : -1);

    parts.push({
      type: 'latex',
      content: latex,
      displayMode,
    });

    lastIndex = match.index + latexContent.length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(lastIndex),
      displayMode: false,
    });
  }

  return parts;
}
```

- [ ] **Step 2: Add TypeScript types reference if needed**

The ratex-wasm package should include types. If not, add a declaration file.

---

## Task 3: Update PreviewPane for RaTeX

**Files:**
- Modify: `src/components/editor/PreviewPane.tsx:1-64`

- [ ] **Step 1: Read current implementation**

Review the current PreviewPane.tsx to understand its structure.

- [ ] **Step 2: Rewrite to use RaTeX**

```tsx
import { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import 'katex/dist/katex.min.css'; // Keep for fallback or remove later
import { initLatexRenderer, renderLatexToDataUrl, splitByLatexExpressions } from '@/lib/latex-renderer';

interface PreviewPaneProps {
  content: string;
}

export default function PreviewPane({ content }: PreviewPaneProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [renderedParts, setRenderedParts] = useState<Array<{
    type: 'text' | 'latex';
    html?: string;
    dataUrl?: string;
    displayMode: boolean;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      if (!previewRef.current) return;

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
```

---

## Task 4: Update CSS for LaTeX Images

**Files:**
- Modify: `src/styles/globals.css` or add to component styles

- [ ] **Step 1: Add CSS for LaTeX rendering**

```css
.latex-display {
  display: block;
  text-align: center;
  margin: 1em 0;
}

.latex-inline {
  display: inline-block;
  vertical-align: middle;
}
```

---

## Task 5: Test the Integration

**Files:**
- None (manual testing)

- [ ] **Step 1: Start the development server**

Run: `cd src && npm run dev`

- [ ] **Step 2: Test display math ($$...$$)**

Enter in editor:
```
$$
\frac{-b \pm \sqrt{b^2-4ac}}{2a}
$$
```

Expected: Centered, larger rendering

- [ ] **Step 3: Test inline math ($...$)**

Enter: `The formula is $E = mc^2$ in the text.`

Expected: Inline rendering

- [ ] **Step 4: Test complex expressions**

```
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

- [ ] **Step 5: Test chemistry notation**

```
$$
\ce{H2SO4 + 2NaOH -> Na2SO4 + 2H2O}
$$
```

---

## Task 6: Build and Verify

**Files:**
- Modify: `src/vite.config.ts` (if needed for WASM support)

- [ ] **Step 1: Run production build**

Run: `cd src && npm run build`

Expected: Successful build with ratex-wasm included

- [ ] **Step 2: Verify no KaTeX references remain**

Run: `grep -r "katex" src/ --include="*.ts" --include="*.tsx"`

Expected: No results (except possibly in comments)

---

## Task 7: Clean Up

**Files:**
- Modify: `src/package.json` (verify katex removed)

- [ ] **Step 1: Remove katex CSS import if no longer needed**

Check if katex CSS is still imported anywhere and remove if not needed.

---

## Subtask Summary

| Task | Description | Status |
|------|-------------|--------|
| 1 | Install ratex-wasm, remove katex | ⬜ |
| 2 | Create latex-renderer.ts wrapper | ⬜ |
| 3 | Update PreviewPane for RaTeX | ⬜ |
| 4 | Add CSS for LaTeX images | ⬜ |
| 5 | Test the integration | ⬜ |
| 6 | Build and verify | ⬜ |
| 7 | Clean up | ⬜ |

---

## Notes

- RaTeX WASM initialization is async and lazy - we handle this in the wrapper
- Each LaTeX block renders to an offscreen canvas, then converted to PNG data URL
- Markdown parsing still uses `marked` for text content
- DisplayList JSON protocol is stable per docs/DISPLAYLIST_JSON_PROTOCOL.md
