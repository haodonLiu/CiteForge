import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
export default function Breadcrumb(_a) {
    var segments = _a.segments;
    return (_jsxs("nav", { className: "flex items-center gap-1 text-xs text-text-muted", children: [_jsxs(Link, { to: "/", className: "flex items-center gap-1 hover:text-text-primary transition-colors", children: [_jsx(Home, { size: 12 }), _jsx("span", { children: "\u5DE5\u4F5C\u53F0" })] }), segments.map(function (seg, i) { return (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(ChevronRight, { size: 12, className: "text-text-muted/50" }), seg.to ? (_jsx(Link, { to: seg.to, className: "hover:text-text-primary transition-colors", children: seg.label })) : (_jsx("span", { className: "text-text-secondary font-medium", children: seg.label }))] }, i)); })] }));
}
