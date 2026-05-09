import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
export function ThemeProvider(_a) {
    var children = _a.children;
    var theme = useAppStore(function (s) { return s.theme; });
    var initializeTheme = useAppStore(function (s) { return s.initializeTheme; });
    useEffect(function () {
        initializeTheme();
    }, []);
    useEffect(function () {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);
    return _jsx(_Fragment, { children: children });
}
