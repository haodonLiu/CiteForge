import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Settings, ChevronDown, Plus, Sun, Moon, FolderOpen, } from 'lucide-react';
import { useAppStore } from '@/lib/store';
var globalNav = [
    { to: '/', label: '工作台', icon: Home },
    { to: '/library', label: '文献库', icon: BookOpen },
    { to: '/settings', label: '设置', icon: Settings },
];
var themes = [
    { id: 'ivory_press', icon: Sun, label: '浅色' },
    { id: 'midnight_scholar', icon: Moon, label: '暗色' },
];
export default function Sidebar() {
    var pathname = useLocation().pathname;
    var navigate = useNavigate();
    var _a = useState(true), recentExpanded = _a[0], setRecentExpanded = _a[1];
    var tasks = useAppStore(function (s) { return s.tasks; });
    var currentTaskId = useAppStore(function (s) { return s.currentTaskId; });
    var currentTheme = useAppStore(function (s) { return s.theme; });
    var setTheme = useAppStore(function (s) { return s.setTheme; });
    var recentTasks = Object.values(tasks).slice(0, 5);
    var statusColors = {
        Pending: 'bg-text-muted',
        Researching: 'bg-info',
        Analyzing: 'bg-warning',
        Writing: 'bg-primary',
        AnalyzingAndWriting: 'bg-warning',
        Completed: 'bg-success',
        Failed: 'bg-error',
    };
    return (_jsxs("aside", { className: "w-[220px] h-screen bg-surface border-r border-border flex flex-col shrink-0", children: [_jsxs("div", { className: "h-11 px-4 flex items-center border-b border-border", children: [_jsx(FolderOpen, { size: 16, className: "text-primary mr-2" }), _jsx("h1", { className: "text-sm font-semibold text-text-primary tracking-tight", children: "CiteForge" }), _jsx("span", { className: "ml-2 text-[11px] text-text-muted font-medium", children: "v0.1" })] }), _jsxs("div", { className: "flex-1 overflow-y-auto", children: [_jsxs("div", { className: "p-2", children: [_jsx("div", { className: "text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1.5 px-2", children: "\u5168\u5C40" }), _jsx("div", { className: "space-y-0.5", children: globalNav.map(function (item) {
                                    var Icon = item.icon;
                                    var isActive = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to);
                                    return (_jsxs(Link, { to: item.to, className: "flex items-center gap-2 px-2 py-1.5 rounded text-[13px] transition-all ".concat(isActive
                                            ? 'bg-primary/10 text-primary font-medium'
                                            : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'), children: [_jsx(Icon, { size: 14, className: isActive ? 'text-primary' : 'text-text-muted' }), _jsx("span", { children: item.label })] }, item.to));
                                }) })] }), recentTasks.length > 0 && (_jsxs("div", { className: "px-2 pt-2 pb-1", children: [_jsxs("button", { onClick: function () { return setRecentExpanded(!recentExpanded); }, className: "flex items-center justify-between w-full text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1.5 px-2 hover:text-text-secondary transition-colors", children: [_jsx("span", { children: "\u6700\u8FD1\u9879\u76EE" }), _jsx(ChevronDown, { size: 12, className: "transition-transform ".concat(recentExpanded ? 'rotate-180' : '') })] }), recentExpanded && (_jsx("div", { className: "space-y-0.5", children: recentTasks.map(function (task) {
                                    var isActive = task.id === currentTaskId;
                                    var taskPath = "/task/".concat(task.id);
                                    return (_jsxs(Link, { to: taskPath, className: "w-full flex items-center gap-2 px-2 py-1.5 rounded text-[12px] text-left transition-all ".concat(isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'), children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full shrink-0 ".concat(isActive
                                                    ? statusColors[task.status] || 'bg-primary'
                                                    : 'bg-text-muted') }), _jsx("span", { className: "truncate flex-1", children: task.topic || '未命名项目' }), _jsxs("span", { className: "text-[10px] text-text-muted shrink-0", children: [Math.round((task.progress || 0) * 100), "%"] })] }, task.id));
                                }) }))] })), _jsx("div", { className: "px-4 py-2", children: _jsxs("button", { onClick: function () { return navigate('/'); }, className: "w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs text-text-secondary bg-surface-hover hover:bg-surface-hover/80 hover:text-text-primary transition-colors border border-border", children: [_jsx(Plus, { size: 12 }), _jsx("span", { children: "\u65B0\u5EFA\u9879\u76EE" })] }) })] }), _jsx("div", { className: "p-2 border-t border-border", children: _jsx("div", { className: "flex gap-1.5 px-2", children: themes.map(function (t) {
                        var Icon = t.icon;
                        var isActive = currentTheme === t.id;
                        return (_jsx("button", { onClick: function () { return setTheme(t.id); }, title: t.label, className: "flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[11px] transition-all ".concat(isActive
                                ? 'bg-primary/10 text-primary border border-primary/30'
                                : 'bg-surface-hover text-text-secondary hover:bg-surface-hover/80'), children: _jsx(Icon, { size: 14 }) }, t.id));
                    }) }) })] }));
}
