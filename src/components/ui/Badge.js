var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef } from 'react';
var variantStyles = {
    default: 'bg-surface text-text-secondary',
    primary: 'bg-primary/15 text-primary',
    secondary: 'bg-surface-hover text-text-muted',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    error: 'bg-error/15 text-error',
};
var Badge = forwardRef(function (_a, ref) {
    var _b = _a.variant, variant = _b === void 0 ? 'default' : _b, _c = _a.className, className = _c === void 0 ? '' : _c, children = _a.children, props = __rest(_a, ["variant", "className", "children"]);
    return (_jsx("span", __assign({ ref: ref, className: "\n          inline-flex items-center\n          px-2 py-0.5 text-xs rounded-full font-medium\n          ".concat(variantStyles[variant], "\n          ").concat(className, "\n        ").trim() }, props, { children: children })));
});
Badge.displayName = 'Badge';
export default Badge;
