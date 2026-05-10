import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useRef } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
function parseNoteLinks(content) {
    var regex = /\[\[([^\]]+)\]\]/g;
    var matches = [];
    var match;
    while ((match = regex.exec(content)) !== null) {
        matches.push({
            text: match[1].trim(),
            raw: match[0],
            start: match.index,
            end: match.index + match[0].length,
        });
    }
    return matches;
}
export function NoteLinkPreview(_a) {
    var content = _a.content, _b = _a.existingNotes, existingNotes = _b === void 0 ? [] : _b, onLinkClick = _a.onLinkClick;
    var links = parseNoteLinks(content);
    if (links.length === 0)
        return null;
    return (_jsx("div", { className: "flex flex-wrap gap-1 mt-2", children: links.map(function (link, idx) {
            var targetNote = existingNotes.find(function (n) { return n.title === link.text || n.id === link.text; });
            return (_jsx("button", { onClick: function () { return targetNote && (onLinkClick === null || onLinkClick === void 0 ? void 0 : onLinkClick(targetNote.id)); }, className: "text-xs px-2 py-0.5 rounded border ".concat(targetNote
                    ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                    : 'bg-surface-hover border-border text-text-muted'), title: targetNote ? "\u8DF3\u8F6C\u5230: ".concat(targetNote.title) : '未找到的笔记', children: link.text }, idx));
        }) }));
}
export default function NoteEditor(_a) {
    var note = _a.note, onSave = _a.onSave, onCancel = _a.onCancel, _b = _a.existingNotes, existingNotes = _b === void 0 ? [] : _b, onLinkClick = _a.onLinkClick;
    var _c = useState((note === null || note === void 0 ? void 0 : note.title) || ''), title = _c[0], setTitle = _c[1];
    var _d = useState((note === null || note === void 0 ? void 0 : note.content) || ''), content = _d[0], setContent = _d[1];
    var _e = useState(false), showPreview = _e[0], setShowPreview = _e[1];
    var _f = useState(-1), suggestionIndex = _f[0], setSuggestionIndex = _f[1];
    var textareaRef = useRef(null);
    var _g = useState([]), suggestions = _g[0], setSuggestions = _g[1];
    var _h = useState(null), suggestionPos = _h[0], setSuggestionPos = _h[1];
    var handleContentChange = useCallback(function (e) {
        var value = e.target.value;
        setContent(value);
        // Check for [[ autocomplete
        var cursorPos = e.target.selectionStart;
        var beforeCursor = value.slice(0, cursorPos);
        var lastOpen = beforeCursor.lastIndexOf('[[');
        var lastClose = beforeCursor.lastIndexOf(']]');
        if (lastOpen > lastClose && lastOpen >= 0) {
            var query_1 = beforeCursor.slice(lastOpen + 2).toLowerCase();
            var matched = existingNotes
                .filter(function (n) { return n.title.toLowerCase().includes(query_1) || n.id.toLowerCase().includes(query_1); })
                .slice(0, 5);
            setSuggestions(matched);
            setSuggestionIndex(-1);
            // Position suggestion box near cursor
            if (textareaRef.current) {
                var lines = beforeCursor.split('\n');
                var currentLine = lines[lines.length - 1];
                var lineHeight = 20;
                var charWidth = 8;
                setSuggestionPos({
                    top: lines.length * lineHeight + 8,
                    left: Math.min(currentLine.length * charWidth, 200),
                });
            }
        }
        else {
            setSuggestions([]);
            setSuggestionPos(null);
        }
    }, [existingNotes]);
    var insertSuggestion = useCallback(function (suggestedNote) {
        if (!textareaRef.current)
            return;
        var cursorPos = textareaRef.current.selectionStart;
        var beforeCursor = content.slice(0, cursorPos);
        var lastOpen = beforeCursor.lastIndexOf('[[');
        var afterCursor = content.slice(cursorPos);
        var newContent = content.slice(0, lastOpen) + "[[".concat(suggestedNote.title, "]]") + afterCursor;
        setContent(newContent);
        setSuggestions([]);
        setSuggestionPos(null);
        textareaRef.current.focus();
    }, [content]);
    var handleKeyDown = useCallback(function (e) {
        if (suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSuggestionIndex(function (prev) { return (prev + 1) % suggestions.length; });
            }
            else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSuggestionIndex(function (prev) { return (prev - 1 + suggestions.length) % suggestions.length; });
            }
            else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                if (suggestionIndex >= 0) {
                    insertSuggestion(suggestions[suggestionIndex]);
                }
            }
            else if (e.key === 'Escape') {
                setSuggestions([]);
            }
        }
    }, [suggestions, suggestionIndex, insertSuggestion]);
    var handleSave = useCallback(function () {
        if (!title.trim())
            return;
        onSave({
            id: note === null || note === void 0 ? void 0 : note.id,
            taskId: note === null || note === void 0 ? void 0 : note.taskId,
            title: title.trim(),
            content: content.trim(),
            createdAt: note === null || note === void 0 ? void 0 : note.createdAt,
        });
    }, [title, content, note, onSave]);
    return (_jsxs("div", { className: "flex flex-col h-full", children: [_jsx("div", { className: "p-3 border-b border-border bg-surface/50 shrink-0", children: _jsx(Input, { value: title, onChange: function (e) { return setTitle(e.target.value); }, placeholder: "\u7B14\u8BB0\u6807\u9898...", className: "text-sm font-semibold" }) }), _jsxs("div", { className: "flex items-center gap-2 px-3 py-1.5 border-b border-border shrink-0", children: [_jsx(Button, { size: "sm", variant: showPreview ? 'ghost' : 'primary', onClick: function () { return setShowPreview(false); }, children: "\u7F16\u8F91" }), _jsx(Button, { size: "sm", variant: showPreview ? 'primary' : 'ghost', onClick: function () { return setShowPreview(true); }, children: "\u9884\u89C8" }), _jsx("div", { className: "flex-1" }), _jsx("span", { className: "text-xs text-text-muted", children: "\u652F\u6301 [[\u7B14\u8BB0\u6807\u9898]] \u8D85\u94FE\u63A5" })] }), _jsx("div", { className: "flex-1 relative overflow-hidden", children: showPreview ? (_jsx("div", { className: "h-full overflow-auto p-4 prose prose-sm max-w-none", children: _jsx(NotePreview, { content: content, existingNotes: existingNotes, onLinkClick: onLinkClick }) })) : (_jsxs("div", { className: "h-full relative", children: [_jsx("textarea", { ref: textareaRef, value: content, onChange: handleContentChange, onKeyDown: handleKeyDown, placeholder: "\u5F00\u59CB\u5199\u7B14\u8BB0... \u4F7F\u7528 [[\u7B14\u8BB0\u6807\u9898]] \u521B\u5EFA\u94FE\u63A5", className: "w-full h-full resize-none p-4 text-sm bg-transparent focus:outline-none font-mono leading-relaxed", spellCheck: false }), suggestions.length > 0 && suggestionPos && (_jsx("div", { className: "absolute z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[160px]", style: { top: suggestionPos.top, left: suggestionPos.left }, children: suggestions.map(function (s, idx) { return (_jsx("button", { onClick: function () { return insertSuggestion(s); }, className: "w-full text-left px-3 py-1.5 text-xs ".concat(idx === suggestionIndex
                                    ? 'bg-primary/10 text-primary'
                                    : 'hover:bg-surface-hover'), children: s.title }, s.id)); }) }))] })) }), _jsxs("div", { className: "flex items-center justify-end gap-2 p-3 border-t border-border shrink-0", children: [onCancel && (_jsx(Button, { size: "sm", variant: "ghost", onClick: onCancel, children: "\u53D6\u6D88" })), _jsx(Button, { size: "sm", onClick: handleSave, disabled: !title.trim(), children: "\u4FDD\u5B58" })] })] }));
}
function NotePreview(_a) {
    var content = _a.content, existingNotes = _a.existingNotes, onLinkClick = _a.onLinkClick;
    // Simple markdown-like rendering
    var renderContent = useCallback(function () {
        var lines = content.split('\n');
        var elements = [];
        var inCode = false;
        var codeContent = '';
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.startsWith('```')) {
                if (inCode) {
                    elements.push(_jsx("pre", { className: "bg-surface-hover p-3 rounded text-xs overflow-x-auto my-2", children: _jsx("code", { children: codeContent }) }, "code-".concat(i)));
                    codeContent = '';
                }
                inCode = !inCode;
                continue;
            }
            if (inCode) {
                codeContent += line + '\n';
                continue;
            }
            if (line.startsWith('# ')) {
                elements.push(_jsx("h1", { className: "text-xl font-bold mt-4 mb-2", children: renderInline(line.slice(2), existingNotes, onLinkClick) }, i));
            }
            else if (line.startsWith('## ')) {
                elements.push(_jsx("h2", { className: "text-lg font-semibold mt-3 mb-2", children: renderInline(line.slice(3), existingNotes, onLinkClick) }, i));
            }
            else if (line.startsWith('### ')) {
                elements.push(_jsx("h3", { className: "text-base font-medium mt-2 mb-1", children: renderInline(line.slice(4), existingNotes, onLinkClick) }, i));
            }
            else if (line.startsWith('- ')) {
                elements.push(_jsx("li", { className: "ml-4 list-disc", children: renderInline(line.slice(2), existingNotes, onLinkClick) }, i));
            }
            else if (line.trim() === '') {
                elements.push(_jsx("div", { className: "h-2" }, i));
            }
            else {
                elements.push(_jsx("p", { className: "text-sm leading-relaxed mb-1", children: renderInline(line, existingNotes, onLinkClick) }, i));
            }
        }
        return elements;
    }, [content, existingNotes, onLinkClick]);
    return _jsx("div", { children: renderContent() });
}
function renderInline(text, existingNotes, onLinkClick) {
    var parts = [];
    var linkRegex = /\[\[([^\]]+)\]\]/g;
    var lastIndex = 0;
    var match;
    var key = 0;
    var _loop_1 = function () {
        if (match.index > lastIndex) {
            parts.push(_jsx("span", { children: text.slice(lastIndex, match.index) }, key++));
        }
        var linkText = match[1].trim();
        var targetNote = existingNotes.find(function (n) { return n.title === linkText || n.id === linkText; });
        parts.push(_jsx("button", { onClick: function () { return targetNote && (onLinkClick === null || onLinkClick === void 0 ? void 0 : onLinkClick(targetNote.id)); }, className: "inline underline-offset-2 ".concat(targetNote
                ? 'text-primary underline hover:text-primary/80'
                : 'text-text-muted underline decoration-dotted'), title: targetNote ? "\u8DF3\u8F6C\u5230: ".concat(targetNote.title) : '未找到的笔记', children: linkText }, key++));
        lastIndex = match.index + match[0].length;
    };
    while ((match = linkRegex.exec(text)) !== null) {
        _loop_1();
    }
    if (lastIndex < text.length) {
        parts.push(_jsx("span", { children: text.slice(lastIndex) }, key++));
    }
    return parts.length > 0 ? parts : [text];
}
