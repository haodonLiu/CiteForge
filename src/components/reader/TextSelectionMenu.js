import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';
export default function TextSelectionMenu(_a) {
    var onAddNote = _a.onAddNote, onInsertCitation = _a.onInsertCitation, onSearchSemantic = _a.onSearchSemantic;
    var _b = useState(null), position = _b[0], setPosition = _b[1];
    var _c = useState(''), selectedText = _c[0], setSelectedText = _c[1];
    var _d = useState(1), pageNumber = _d[0], setPageNumber = _d[1];
    var menuRef = useRef(null);
    useEffect(function () {
        var handleMouseUp = function (e) {
            var selection = window.getSelection();
            var text = selection === null || selection === void 0 ? void 0 : selection.toString().trim();
            if (text && text.length > 0) {
                // 获取选中位置
                var range = selection === null || selection === void 0 ? void 0 : selection.getRangeAt(0);
                var rect = range === null || range === void 0 ? void 0 : range.getBoundingClientRect();
                if (rect) {
                    // 尝试获取页码（从父元素的 data-page-number 属性）
                    var page = 1;
                    var parent_1 = range === null || range === void 0 ? void 0 : range.startContainer.parentElement;
                    while (parent_1 && !parent_1.dataset.pageNumber) {
                        parent_1 = parent_1.parentElement;
                    }
                    if (parent_1 === null || parent_1 === void 0 ? void 0 : parent_1.dataset.pageNumber) {
                        page = parseInt(parent_1.dataset.pageNumber, 10);
                    }
                    setSelectedText(text);
                    setPageNumber(page);
                    setPosition({ x: rect.left, y: rect.bottom + 8 });
                }
            }
        };
        var handleMouseDown = function (e) {
            // 点击菜单外部时关闭
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setPosition(null);
            }
        };
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousedown', handleMouseDown);
        return function () {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, []);
    if (!position || !selectedText)
        return null;
    return (_jsxs("div", { ref: menuRef, className: "fixed z-50 bg-card border border-border rounded-lg shadow-lg p-2 min-w-[200px]", style: { left: position.x, top: position.y }, children: [_jsxs("div", { className: "text-xs text-text-muted mb-2 px-2 truncate max-w-[250px]", children: ["\"", selectedText.slice(0, 50), selectedText.length > 50 ? '...' : '', "\""] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx(Button, { size: "sm", variant: "ghost", className: "justify-start", onClick: function () {
                            onAddNote(selectedText, pageNumber);
                            setPosition(null);
                        }, children: "\u6DFB\u52A0\u5230\u7B14\u8BB0" }), _jsx(Button, { size: "sm", variant: "ghost", className: "justify-start", onClick: function () {
                            onInsertCitation(selectedText, pageNumber);
                            setPosition(null);
                        }, children: "\u4F5C\u4E3A\u5F15\u7528\u63D2\u5165\u8349\u7A3F" }), _jsx(Button, { size: "sm", variant: "ghost", className: "justify-start", onClick: function () {
                            onSearchSemantic(selectedText);
                            setPosition(null);
                        }, children: "\u5728 Semantic Scholar \u641C\u7D22" })] })] }));
}
