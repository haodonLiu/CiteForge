import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Button from '@/components/ui/Button';
export default function AnnotationToolbar(_a) {
    var onAddHighlight = _a.onAddHighlight, onAddUnderline = _a.onAddUnderline, onAddNote = _a.onAddNote, onClearAll = _a.onClearAll, activeColor = _a.activeColor, onColorChange = _a.onColorChange;
    var colors = [
        { id: 'yellow', color: '#fbbf24', label: '黄色' },
        { id: 'indigo', color: '#6366f1', label: '紫色' },
        { id: 'green', color: '#22c55e', label: '绿色' },
        { id: 'red', color: '#ef4444', label: '红色' },
        { id: 'blue', color: '#3b82f6', label: '蓝色' },
    ];
    return (_jsxs("div", { className: "flex items-center gap-2 p-2 border-b border-border bg-surface", children: [_jsx(Button, { size: "sm", variant: "ghost", onClick: onAddHighlight, title: "\u6DFB\u52A0\u9AD8\u4EAE", children: "\u9AD8\u4EAE" }), _jsx(Button, { size: "sm", variant: "ghost", onClick: onAddUnderline, title: "\u6DFB\u52A0\u5212\u7EBF", children: "\u5212\u7EBF" }), _jsx(Button, { size: "sm", variant: "ghost", onClick: onAddNote, title: "\u6DFB\u52A0\u7B14\u8BB0", children: "\u7B14\u8BB0" }), _jsx("div", { className: "w-px h-5 bg-border mx-1" }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "text-xs text-text-muted mr-1", children: "\u989C\u8272:" }), colors.map(function (_a) {
                        var id = _a.id, color = _a.color, label = _a.label;
                        return (_jsx("button", { onClick: function () { return onColorChange(color); }, className: "w-5 h-5 rounded-full border-2 transition-all duration-150 ".concat(activeColor === color ? 'border-primary scale-110' : 'border-transparent opacity-60 hover:opacity-100'), style: { backgroundColor: color }, title: label }, id));
                    })] }), _jsx("div", { className: "flex-1" }), _jsx(Button, { size: "sm", variant: "ghost", onClick: onClearAll, title: "\u6E05\u9664\u6240\u6709\u6279\u6CE8", children: "\u6E05\u9664\u5168\u90E8" })] }));
}
