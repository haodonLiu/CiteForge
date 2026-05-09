import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export var ProgressRing = function (_a) {
    var value = _a.value, _b = _a.size, size = _b === void 0 ? 40 : _b, _c = _a.strokeWidth, strokeWidth = _c === void 0 ? 3 : _c;
    var radius = (size - strokeWidth) / 2;
    var circumference = radius * 2 * Math.PI;
    var offset = circumference - (value / 100) * circumference;
    return (_jsxs("div", { className: "relative inline-flex items-center justify-center", style: { width: size, height: size }, children: [_jsxs("svg", { className: "transform -rotate-90", width: size, height: size, children: [_jsx("circle", { className: "text-surface-hover", strokeWidth: strokeWidth, stroke: "currentColor", fill: "transparent", r: radius, cx: size / 2, cy: size / 2 }), _jsx("circle", { className: "text-primary transition-all duration-500", strokeWidth: strokeWidth, strokeDasharray: circumference, strokeDashoffset: offset, strokeLinecap: "round", stroke: "currentColor", fill: "transparent", r: radius, cx: size / 2, cy: size / 2 })] }), _jsxs("span", { className: "absolute text-[10px] font-medium text-text-secondary", children: [Math.round(value), "%"] })] }));
};
