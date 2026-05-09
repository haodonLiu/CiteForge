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
    primary: 'bg-primary text-white hover:opacity-90 active:opacity-80',
    secondary: 'bg-surface border border-border text-text-primary hover:bg-surface-hover active:bg-surface',
    ghost: 'text-text-secondary hover:bg-surface-hover hover:text-text-primary active:bg-surface',
    danger: 'bg-error text-white hover:opacity-90 active:opacity-80',
};
var sizeStyles = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
};
var shapeStyles = {
    normal: 'rounded-md',
    icon: 'rounded p-2',
};
var Button = forwardRef(function (_a, ref) {
    var _b = _a.variant, variant = _b === void 0 ? 'secondary' : _b, _c = _a.size, size = _c === void 0 ? 'md' : _c, _d = _a.shape, shape = _d === void 0 ? 'normal' : _d, _e = _a.className, className = _e === void 0 ? '' : _e, disabled = _a.disabled, children = _a.children, props = __rest(_a, ["variant", "size", "shape", "className", "disabled", "children"]);
    return (_jsx("button", __assign({ ref: ref, disabled: disabled, className: "\n          inline-flex items-center justify-center gap-1.5\n          font-medium text-ui-label\n          transition-all duration-100 ease-out\n          focus-ring\n          disabled:opacity-50 disabled:cursor-not-allowed\n          ".concat(variantStyles[variant], "\n          ").concat(sizeStyles[size], "\n          ").concat(shapeStyles[shape], "\n          ").concat(className, "\n        ").trim() }, props, { children: children })));
});
Button.displayName = 'Button';
export default Button;
