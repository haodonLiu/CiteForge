import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import Button from '@/components/ui/Button';
var MarkdownEditor = lazy(function () { return import('@/components/editor/MarkdownEditor'); });
var PreviewPane = lazy(function () { return import('@/components/editor/PreviewPane'); });
export default function Editor() {
    var id = useParams().id;
    var _a = useState('# Hello World\n\nThis is a **Markdown** editor with $LaTeX$ support.\n\n$$\nE = mc^2\n$$'), content = _a[0], setContent = _a[1];
    var _b = useState(true), showPreview = _b[0], setShowPreview = _b[1];
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between p-3 border-b border-border", children: [_jsx("h1", { className: "text-lg font-bold text-text-primary", children: "\u7F16\u8F91\u5668" }), _jsx(Button, { size: "sm", onClick: function () { return setShowPreview(!showPreview); }, children: showPreview ? '隐藏预览' : '显示预览' })] }), _jsxs("div", { className: "flex-1 flex", children: [_jsx("div", { className: "".concat(showPreview ? 'w-1/2' : 'w-full', " border-r border-border"), children: _jsx(Suspense, { fallback: _jsx("div", { className: "p-4 text-text-secondary text-sm", children: "Loading editor..." }), children: _jsx(MarkdownEditor, { content: content, onChange: setContent }) }) }), showPreview && (_jsx("div", { className: "w-1/2 overflow-auto bg-card", children: _jsx(Suspense, { fallback: _jsx("div", { className: "p-4 text-text-secondary text-sm", children: "Loading preview..." }), children: _jsx(PreviewPane, { content: content }) }) }))] })] }));
}
