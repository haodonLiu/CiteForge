import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileEdit, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/lib/store';
var MarkdownEditor = lazy(function () { return import('@/components/editor/MarkdownEditor'); });
var PreviewPane = lazy(function () { return import('@/components/editor/PreviewPane'); });
export default function Editor() {
    var _a = useParams(), taskId = _a.taskId, legacyId = _a.id;
    var effectiveTaskId = taskId || legacyId;
    var tasks = useAppStore(function (s) { return s.tasks; });
    var task = effectiveTaskId ? tasks[effectiveTaskId] : null;
    var _b = useState('# Hello World\n\nThis is a **Markdown** editor with $LaTeX$ support.\n\n$$\nE = mc^2\n$$'), content = _b[0], setContent = _b[1];
    var _c = useState(true), showPreview = _c[0], setShowPreview = _c[1];
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between px-3 py-2 border-b border-border bg-surface/50 shrink-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [effectiveTaskId && (_jsxs(Link, { to: "/task/".concat(effectiveTaskId), className: "flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors", children: [_jsx(ArrowLeft, { size: 12 }), "\u8FD4\u56DE\u6982\u89C8"] })), _jsx("div", { className: "w-px h-4 bg-border" }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(FileEdit, { size: 14, className: "text-primary" }), _jsx("h1", { className: "text-sm font-semibold text-text-primary", children: task ? task.topic : '编辑器' })] }), task && (_jsxs("span", { className: "text-[11px] text-text-muted", children: [Math.round((task.progress || 0) * 100), "% \u5B8C\u6210"] }))] }), _jsx(Button, { size: "sm", onClick: function () { return setShowPreview(!showPreview); }, children: showPreview ? '隐藏预览' : '显示预览' })] }), _jsxs("div", { className: "flex-1 flex overflow-hidden", children: [_jsx("div", { className: "".concat(showPreview ? 'w-1/2' : 'w-full', " border-r border-border overflow-hidden"), children: _jsx(Suspense, { fallback: _jsx("div", { className: "p-4 text-text-secondary text-sm", children: "Loading editor..." }), children: _jsx(MarkdownEditor, { content: content, onChange: setContent }) }) }), showPreview && (_jsx("div", { className: "w-1/2 overflow-auto bg-card", children: _jsx(Suspense, { fallback: _jsx("div", { className: "p-4 text-text-secondary text-sm", children: "Loading preview..." }), children: _jsx(PreviewPane, { content: content }) }) }))] })] }));
}
