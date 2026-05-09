import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState, useCallback } from 'react';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/lib/store';
import { Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Link, Image, Code, Table, Eye, Columns, FileCode, } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import katex from 'katex';
var renderMath = function (text) {
    var blockRegex = /\$\$([\s\S]*?)\$\$/g;
    var inlineRegex = /\$([^\$\n]+?)\$/g;
    var result = text
        .replace(blockRegex, function (_, math) {
        try {
            return "<div class=\"katex-block\">".concat(katex.renderToString(math.trim(), { displayMode: true, throwOnError: false }), "</div>");
        }
        catch (_a) {
            return "<div class=\"katex-block error\">".concat(math, "</div>");
        }
    })
        .replace(inlineRegex, function (_, math) {
        try {
            return "<span class=\"katex-inline\">".concat(katex.renderToString(math.trim(), { displayMode: false, throwOnError: false }), "</span>");
        }
        catch (_a) {
            return "<span class=\"katex-inline error\">".concat(math, "</span>");
        }
    });
    return result;
};
var parseMarkdown = function (md) {
    var html = marked.parse(md, { async: false });
    html = renderMath(html);
    return DOMPurify.sanitize(html);
};
var getBlockType = function (text) {
    if (text.startsWith('# '))
        return { type: 'heading1', content: text.slice(2) };
    if (text.startsWith('## '))
        return { type: 'heading2', content: text.slice(3) };
    if (text.startsWith('### '))
        return { type: 'heading3', content: text.slice(4) };
    if (text.startsWith('> '))
        return { type: 'blockquote', content: text.slice(2) };
    if (text.startsWith('- ') || text.startsWith('* '))
        return { type: 'list-item', content: text.slice(2) };
    if (text.match(/^\d+\. /))
        return { type: 'ordered-list-item', content: text.replace(/^\d+\. /, '') };
    if (text.startsWith('```'))
        return { type: 'code-block', content: text.replace(/```\w*\n?/g, '') };
    return { type: 'paragraph', content: text };
};
var blockToMarkdown = function (blocks) {
    return blocks.map(function (block) {
        switch (block.type) {
            case 'heading1': return "# ".concat(block.content);
            case 'heading2': return "## ".concat(block.content);
            case 'heading3': return "### ".concat(block.content);
            case 'blockquote': return "> ".concat(block.content);
            case 'list-item': return "- ".concat(block.content);
            case 'ordered-list-item': return "1. ".concat(block.content);
            case 'code-block': return "```\n".concat(block.content, "\n```");
            default: return block.content;
        }
    }).join('\n');
};
export default function MarkdownEditor(_a) {
    var content = _a.content, onChange = _a.onChange;
    var theme = useAppStore(function (s) { return s.theme; });
    var editorRef = useRef(null);
    var _b = useState('split'), viewMode = _b[0], setViewMode = _b[1];
    var _c = useState(false), showSource = _c[0], setShowSource = _c[1];
    var _d = useState(content), sourceContent = _d[0], setSourceContent = _d[1];
    var _e = useState(''), previewHtml = _e[0], setPreviewHtml = _e[1];
    var sourceEditorRef = useRef(null);
    useEffect(function () {
        if (viewMode !== 'preview') {
            var blocks = content.split('\n').map(function (line) { return getBlockType(line); });
            if (editorRef.current) {
                var selection = window.getSelection();
                var savedRange = (selection === null || selection === void 0 ? void 0 : selection.rangeCount) ? selection.getRangeAt(0) : null;
                editorRef.current.innerHTML = blocks.map(function (block) {
                    var escaped = block.content
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                    switch (block.type) {
                        case 'heading1': return "<h1 class=\"editor-h1\" data-type=\"heading1\">".concat(escaped, "</h1>");
                        case 'heading2': return "<h2 class=\"editor-h2\" data-type=\"heading2\">".concat(escaped, "</h2>");
                        case 'heading3': return "<h3 class=\"editor-h3\" data-type=\"heading3\">".concat(escaped, "</h3>");
                        case 'blockquote': return "<blockquote class=\"editor-blockquote\" data-type=\"blockquote\">".concat(escaped, "</blockquote>");
                        case 'list-item': return "<li class=\"editor-list-item\" data-type=\"list-item\">".concat(escaped, "</li>");
                        case 'ordered-list-item': return "<li class=\"editor-ordered-item\" data-type=\"ordered-list-item\">".concat(escaped, "</li>");
                        case 'code-block': return "<pre class=\"editor-code-block\" data-type=\"code-block\"><code>".concat(escaped, "</code></pre>");
                        default: return block.content === '' ? '<br>' : "<p class=\"editor-p\" data-type=\"paragraph\">".concat(escaped, "</p>");
                    }
                }).join('');
                if (savedRange) {
                    selection === null || selection === void 0 ? void 0 : selection.removeAllRanges();
                    selection === null || selection === void 0 ? void 0 : selection.addRange(savedRange);
                }
            }
        }
    }, [content, viewMode]);
    useEffect(function () {
        if (viewMode === 'preview' || viewMode === 'split') {
            setPreviewHtml(parseMarkdown(content));
        }
    }, [content, viewMode]);
    var getMarkdownFromEditor = useCallback(function () {
        if (!editorRef.current)
            return content;
        var blocks = [];
        var children = editorRef.current.children;
        for (var i = 0; i < children.length; i++) {
            var el = children[i];
            var type = el.dataset.type;
            var text = el.textContent || '';
            if (type === 'list-item' || type === 'ordered-list-item') {
                var parent_1 = el.parentElement;
                if (parent_1 && (parent_1.tagName === 'UL' || parent_1.tagName === 'OL')) {
                    var siblings = Array.from(parent_1.children);
                    var idx = siblings.indexOf(el);
                    blocks.push({ type: type, content: text });
                    if (idx === siblings.length - 1) {
                        blocks.push({ type: 'paragraph', content: '' });
                    }
                    continue;
                }
            }
            blocks.push({ type: type || 'paragraph', content: text });
        }
        return blockToMarkdown(blocks);
    }, [content]);
    var handleKeyDown = useCallback(function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.execCommand('insertLineBreak');
        }
        if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            document.execCommand('bold');
        }
        if (e.key === 'i' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            document.execCommand('italic');
        }
    }, []);
    var handleInput = useCallback(function () {
        var md = getMarkdownFromEditor();
        onChange(md);
        setSourceContent(md);
    }, [getMarkdownFromEditor, onChange]);
    var execCommand = function (command, value) {
        var _a;
        document.execCommand(command, false, value);
        (_a = editorRef.current) === null || _a === void 0 ? void 0 : _a.focus();
        handleInput();
    };
    var toolbarGroups = [
        {
            label: '段落',
            items: [
                { icon: Heading1, title: '标题 1', action: function () { return execCommand('formatBlock', 'h1'); } },
                { icon: Heading2, title: '标题 2', action: function () { return execCommand('formatBlock', 'h2'); } },
                { icon: Heading3, title: '标题 3', action: function () { return execCommand('formatBlock', 'h3'); } },
            ],
        },
        {
            label: '列表',
            items: [
                { icon: List, title: '无序列表', action: function () { return execCommand('insertUnorderedList'); } },
                { icon: ListOrdered, title: '有序列表', action: function () { return execCommand('insertOrderedList'); } },
            ],
        },
        {
            label: '格式',
            items: [
                { icon: Bold, title: '粗体 (Ctrl+B)', action: function () { return execCommand('bold'); } },
                { icon: Italic, title: '斜体 (Ctrl+I)', action: function () { return execCommand('italic'); } },
            ],
        },
        {
            label: '插入',
            items: [
                { icon: Quote, title: '引用', action: function () { return execCommand('formatBlock', 'blockquote'); } },
                { icon: Link, title: '链接', action: function () {
                        var url = prompt('输入链接地址:');
                        if (url)
                            execCommand('createLink', url);
                    } },
                { icon: Image, title: '图片', action: function () {
                        var url = prompt('输入图片地址:');
                        if (url)
                            execCommand('insertImage', url);
                    } },
                { icon: Code, title: '代码块', action: function () { return execCommand('formatBlock', 'pre'); } },
                { icon: Table, title: '表格', action: function () {
                        var markdown = '\n| 列1 | 列2 |\n| --- | --- |\n| 内容 | 内容 |\n';
                        execCommand('insertText', markdown);
                    } },
            ],
        },
        {
            label: '视图',
            items: [
                { icon: Eye, title: '预览', action: function () { return setViewMode('preview'); } },
                { icon: Columns, title: '分屏', action: function () { return setViewMode('split'); } },
                { icon: FileCode, title: '源码', action: function () { return setShowSource(!showSource); } },
            ],
        },
    ];
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsx("div", { className: "h-10 flex items-center gap-4 px-3 border-b border-border bg-surface shrink-0", children: toolbarGroups.map(function (group, groupIdx) { return (_jsxs("div", { className: "flex items-center gap-1", children: [groupIdx > 0 && _jsx("div", { className: "w-px h-4 bg-border" }), group.items.map(function (item) {
                            var Icon = item.icon;
                            return (_jsx(Button, { size: "sm", variant: "ghost", onClick: item.action, title: item.title, className: "w-7 h-7 p-0", children: _jsx(Icon, { size: 14 }) }, item.title));
                        })] }, group.label)); }) }), _jsxs("div", { className: "flex-1 flex overflow-hidden", children: [(viewMode === 'edit' || viewMode === 'split') && (_jsx("div", { className: "flex ".concat(viewMode === 'split' ? 'w-1/2' : 'w-full', " ").concat(showSource ? 'w-1/2' : ''), children: _jsx("div", { ref: editorRef, contentEditable: true, suppressContentEditableWarning: true, onKeyDown: handleKeyDown, onInput: handleInput, className: "flex-1 p-6 overflow-auto outline-none editor-content", style: {
                                fontFamily: 'var(--font-serif)',
                                fontSize: '15px',
                                lineHeight: '1.75',
                                background: 'var(--color-background)',
                                color: 'var(--color-text-primary)',
                            }, "data-placeholder": "\u8F93\u5165\u6587\u5B57\uFF0C\u6216\u4F7F\u7528 Markdown \u8BED\u6CD5..." }) })), showSource && (_jsx("div", { className: "w-1/2 border-l border-border bg-[var(--color-surface)]", children: _jsx("textarea", { ref: sourceEditorRef, value: sourceContent, onChange: function (e) {
                                setSourceContent(e.target.value);
                                onChange(e.target.value);
                            }, className: "w-full h-full p-4 resize-none outline-none font-mono text-sm", style: {
                                background: 'var(--color-surface)',
                                color: 'var(--color-text-primary)',
                            }, spellCheck: false }) })), viewMode !== 'edit' && (_jsx("div", { className: "".concat(viewMode === 'split' ? 'w-1/2' : 'w-full', " border-l border-border overflow-auto"), children: _jsx("div", { className: "p-6 prose-content", children: _jsx("div", { className: "preview-rendered", style: { fontFamily: 'var(--font-serif)' }, dangerouslySetInnerHTML: { __html: previewHtml } }) }) }))] }), _jsx("style", { children: "\n        .editor-content [contenteditable]:focus {\n          outline: none;\n        }\n        .editor-content h1.editor-h1 {\n          font-size: 1.875rem;\n          font-weight: 700;\n          margin: 1.5rem 0 0.75rem;\n          color: var(--color-text-primary);\n        }\n        .editor-content h2.editor-h2 {\n          font-size: 1.5rem;\n          font-weight: 600;\n          margin: 1.25rem 0 0.625rem;\n          color: var(--color-text-primary);\n        }\n        .editor-content h3.editor-h3 {\n          font-size: 1.25rem;\n          font-weight: 600;\n          margin: 1rem 0 0.5rem;\n          color: var(--color-text-primary);\n        }\n        .editor-content blockquote.editor-blockquote {\n          border-left: 4px solid var(--color-primary);\n          padding-left: 1rem;\n          margin: 1rem 0;\n          font-style: italic;\n          color: var(--color-text-secondary);\n        }\n        .editor-content li {\n          margin-left: 1.5rem;\n          margin-bottom: 0.25rem;\n        }\n        .editor-content pre.editor-code-block {\n          background: var(--color-code-background);\n          padding: 1rem;\n          border-radius: 4px;\n          overflow-x: auto;\n          font-family: var(--font-mono);\n          font-size: 0.875rem;\n        }\n        .preview-rendered h1 {\n          font-size: 1.875rem;\n          font-weight: 700;\n          margin: 1.5rem 0 0.75rem;\n        }\n        .preview-rendered h2 {\n          font-size: 1.5rem;\n          font-weight: 600;\n          margin: 1.25rem 0 0.625rem;\n        }\n        .preview-rendered h3 {\n          font-size: 1.25rem;\n          font-weight: 600;\n          margin: 1rem 0 0.5rem;\n        }\n        .preview-rendered blockquote {\n          border-left: 4px solid var(--color-primary);\n          padding-left: 1rem;\n          margin: 1rem 0;\n          font-style: italic;\n          color: var(--color-text-secondary);\n        }\n        .preview-rendered pre {\n          background: var(--color-code-background);\n          padding: 1rem;\n          border-radius: 4px;\n          overflow-x: auto;\n        }\n        .preview-rendered code {\n          font-family: var(--font-mono);\n          font-size: 0.875rem;\n        }\n        .preview-rendered img {\n          max-width: 100%;\n          height: auto;\n        }\n        .preview-rendered .katex-block {\n          margin: 1rem 0;\n          overflow-x: auto;\n        }\n        .preview-rendered .katex-inline {\n          padding: 0 0.25rem;\n        }\n      " })] }));
}
