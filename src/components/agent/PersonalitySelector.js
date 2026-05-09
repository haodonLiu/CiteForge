import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Button from '@/components/ui/Button';
export default function PersonalitySelector(_a) {
    var personalities = _a.personalities, selected = _a.selected, onSelect = _a.onSelect;
    return (_jsxs("div", { className: "p-4 border-b border-border", children: [_jsx("h2", { className: "text-xs font-semibold mb-2 text-text-muted uppercase tracking-wider", children: "\u9009\u62E9 Agent \u4E2A\u6027" }), _jsx("div", { className: "flex gap-2", children: personalities.map(function (p) { return (_jsx(Button, { variant: selected === p.id ? 'primary' : 'ghost', size: "sm", onClick: function () { return onSelect(p.id); }, children: p.name }, p.id)); }) })] }));
}
