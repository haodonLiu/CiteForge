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
var Select = forwardRef(function (_a, ref) {
    var _b = _a.className, className = _b === void 0 ? '' : _b, children = _a.children, props = __rest(_a, ["className", "children"]);
    return (_jsx("select", __assign({ ref: ref, className: "\n          px-4 py-2\n          bg-surface border border-border rounded-lg\n          text-text-primary\n          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary\n          transition-colors duration-150\n          ".concat(className, "\n        ").trim() }, props, { children: children })));
});
Select.displayName = 'Select';
export default Select;
