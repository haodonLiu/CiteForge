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

  // Create offscreen canvas - use larger dimensions for complex equations
  const canvas = document.createElement('canvas');
  canvas.width = 1200;  // increased from 800
  canvas.height = 400;  // increased from 200

  try {
    renderLatexToCanvas(latex, canvas, {
      fontSize,
      padding: displayMode ? 16 : 8,
      backgroundColor,
    }, color);
  } catch (error) {
    console.error('RaTeX render error:', error);
    throw new Error(`Failed to render LaTeX: ${latex}`);
  }

  return canvas.toDataURL('image/png');
}

export function isLatexExpression(text: string): boolean {
  return text.includes('$') || text.includes('$$');
}

export function splitByLatexExpressions(content: string): Array<{ type: 'text' | 'latex'; content: string; displayMode: boolean }> {
  const parts: Array<{ type: 'text' | 'latex'; content: string; displayMode: boolean }> = [];

  // Match $$...$$ (display) and $...$ (inline)
  const regex = /(\$\$[\s\S]*?\$\$|\$(?:[^\$\n\\]|\\.)+?\$)/g;
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
