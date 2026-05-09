import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import LiteratureCard from './LiteratureCard';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
export default function LiteratureList(_a) {
    var onSelect = _a.onSelect;
    var _b = useState(''), search = _b[0], setSearch = _b[1];
    var _c = useState('all'), filter = _c[0], setFilter = _c[1];
    // TODO: Load from backend
    var literature = [];
    var filtered = literature.filter(function (lit) {
        var matchesSearch = lit.title.toLowerCase().includes(search.toLowerCase()) ||
            lit.authors.some(function (a) { return a.name.toLowerCase().includes(search.toLowerCase()); });
        var matchesFilter = filter === 'all' || lit.read_status === filter;
        return matchesSearch && matchesFilter;
    });
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsxs("div", { className: "p-4 border-b border-border", children: [_jsx("h1", { className: "text-lg font-bold text-text-primary mb-3", children: "\u6587\u732E\u5E93" }), _jsxs("div", { className: "flex gap-3", children: [_jsx("div", { className: "flex-1", children: _jsx(Input, { type: "text", placeholder: "\u641C\u7D22\u6587\u732E...", value: search, onChange: function (e) { return setSearch(e.target.value); } }) }), _jsxs(Select, { value: filter, onChange: function (e) { return setFilter(e.target.value); }, children: [_jsx("option", { value: "all", children: "\u5168\u90E8" }), _jsx("option", { value: "Unread", children: "\u672A\u8BFB" }), _jsx("option", { value: "Reading", children: "\u9605\u8BFB\u4E2D" }), _jsx("option", { value: "Read", children: "\u5DF2\u8BFB" }), _jsx("option", { value: "ToRead", children: "\u5F85\u8BFB" })] })] })] }), _jsx("div", { className: "flex-1 overflow-auto p-4", children: filtered.length === 0 ? (_jsx("div", { className: "text-center text-text-muted py-12 text-sm", children: "\u6682\u65E0\u6587\u732E\u3002\u70B9\u51FB\"\u6DFB\u52A0\u6587\u732E\"\u5F00\u59CB\u3002" })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3", children: filtered.map(function (lit) { return (_jsx(LiteratureCard, { literature: lit, onSelect: onSelect }, lit.id)); }) })) })] }));
}
