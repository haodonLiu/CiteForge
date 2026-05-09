import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export default function AnnotationLayer(_a) {
    var annotations = _a.annotations, currentPage = _a.currentPage, onAddAnnotation = _a.onAddAnnotation, onDeleteAnnotation = _a.onDeleteAnnotation;
    var _b = useState(''), selectedText = _b[0], setSelectedText = _b[1];
    var _c = useState(null), selectionRect = _c[0], setSelectionRect = _c[1];
    var handleMouseUp = function () {
        var selection = window.getSelection();
        if (selection && selection.toString().trim()) {
            var range = selection.getRangeAt(0);
            var rect = range.getBoundingClientRect();
            setSelectedText(selection.toString());
            setSelectionRect(rect);
        }
    };
    var pageAnnotations = annotations.filter(function (a) { return a.page_number === currentPage; });
    return (_jsxs("div", { className: "absolute inset-0 pointer-events-none", onMouseUp: handleMouseUp, children: [pageAnnotations.map(function (annotation) { return (_jsx("div", { className: "absolute pointer-events-auto cursor-pointer", style: {
                    left: "".concat(annotation.position.x * 100, "%"),
                    top: "".concat(annotation.position.y * 100, "%"),
                    width: "".concat(annotation.position.width * 100, "%"),
                    height: "".concat(annotation.position.height * 100, "%"),
                    backgroundColor: annotation.color,
                    opacity: 0.3,
                }, onClick: function () {
                    if (confirm('删除此批注？')) {
                        onDeleteAnnotation(annotation.id);
                    }
                }, title: annotation.content || annotation.annotation_type }, annotation.id)); }), selectedText && selectionRect && (_jsx("div", { className: "absolute bg-card border border-border rounded shadow-lg p-2 pointer-events-auto z-50", style: {
                    left: selectionRect.left,
                    top: selectionRect.bottom + 8,
                }, children: _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: function () {
                                onAddAnnotation({
                                    document_id: '',
                                    page_number: currentPage,
                                    annotation_type: 'Highlight',
                                    color: '#fbbf24',
                                    position: {
                                        x: selectionRect.left / window.innerWidth,
                                        y: selectionRect.top / window.innerHeight,
                                        width: selectionRect.width / window.innerWidth,
                                        height: selectionRect.height / window.innerHeight,
                                        page_width: 1,
                                        page_height: 1,
                                    },
                                });
                                setSelectedText('');
                                setSelectionRect(null);
                            }, className: "px-2 py-1 text-sm bg-yellow-200 rounded", children: "\u9AD8\u4EAE" }), _jsx("button", { onClick: function () {
                                onAddAnnotation({
                                    document_id: '',
                                    page_number: currentPage,
                                    annotation_type: 'Underline',
                                    color: '#6366f1',
                                    position: {
                                        x: selectionRect.left / window.innerWidth,
                                        y: selectionRect.top / window.innerHeight,
                                        width: selectionRect.width / window.innerWidth,
                                        height: selectionRect.height / window.innerHeight,
                                        page_width: 1,
                                        page_height: 1,
                                    },
                                });
                                setSelectedText('');
                                setSelectionRect(null);
                            }, className: "px-2 py-1 text-sm bg-indigo-200 rounded", children: "\u5212\u7EBF" }), _jsx("button", { onClick: function () {
                                var content = prompt('输入笔记内容：');
                                if (content) {
                                    onAddAnnotation({
                                        document_id: '',
                                        page_number: currentPage,
                                        annotation_type: 'Note',
                                        content: content,
                                        color: '#22c55e',
                                        position: {
                                            x: selectionRect.left / window.innerWidth,
                                            y: selectionRect.top / window.innerHeight,
                                            width: selectionRect.width / window.innerWidth,
                                            height: selectionRect.height / window.innerHeight,
                                            page_width: 1,
                                            page_height: 1,
                                        },
                                    });
                                }
                                setSelectedText('');
                                setSelectionRect(null);
                            }, className: "px-2 py-1 text-sm bg-green-200 rounded", children: "\u7B14\u8BB0" })] }) }))] }));
}
