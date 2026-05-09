import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, FileText, Edit3, Bot, Settings, ChevronDown, Sun, Moon, } from 'lucide-react';
import { useAppStore } from '@/lib/store';
var quickAccess = [
    { to: '/library', label: '文献库', icon: BookOpen },
    { to: '/reader/1', label: '阅读器', icon: FileText },
    { to: '/editor/1', label: '编辑器', icon: Edit3 },
    { to: '/agent', label: 'Agent 对话', icon: Bot },
    { to: '/settings', label: '设置', icon: Settings },
];
var themes = [
    { id: 'ivory_press', icon: Sun, label: '浅色' },
    { id: 'midnight_scholar', icon: Moon, label: '暗色' },
];
export default function Sidebar() {
    var pathname = useLocation().pathname;
    var _a = useState(true), recentExpanded = _a[0], setRecentExpanded = _a[1];
    var tasks = useAppStore(function (s) { return s.tasks; });
    var currentTaskId = useAppStore(function (s) { return s.currentTaskId; });
    var currentTheme = useAppStore(function (s) { return s.theme; });
    var setTheme = useAppStore(function (s) { return s.setTheme; });
    var recentTasks = Object.values(tasks).slice(0, 5);
    var activeTask = currentTaskId ? tasks[currentTaskId] : null;
    var statusColors = {
        Pending: 'bg-text-muted',
        Researching: 'bg-info',
        Analyzing: 'bg-warning',
        Writing: 'bg-primary',
        AnalyzingAndWriting: 'bg-warning',
        Completed: 'bg-success',
        Failed: 'bg-error',
    };
    var agentLabels = {
        Researcher: 'Researcher',
        Analyst: 'Analyst',
        Writer: 'Writer',
    };
    return (_jsxs("aside", { className: "w-[260px] h-screen bg-surface border-r border-border flex flex-col shrink-0", children: [_jsxs("div", { className: "h-12 px-4 flex items-center border-b border-border", children: [_jsx("h1", { className: "text-sm font-semibold text-primary tracking-tight", children: "CiteForge" }), _jsx("span", { className: "ml-2 text-[11px] text-text-muted font-medium", children: "v0.1" })] }), _jsxs("div", { className: "flex-1 overflow-y-auto", children: [recentTasks.length > 0 && (_jsxs("div", { className: "p-3", children: [_jsxs("button", { onClick: function () { return setRecentExpanded(!recentExpanded); }, className: "flex items-center justify-between w-full text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2 hover:text-text-secondary", children: [_jsx("span", { children: "\u6700\u8FD1\u9879\u76EE" }), _jsx(ChevronDown, { size: 12, className: "transition-transform ".concat(recentExpanded ? 'rotate-180' : '') })] }), recentExpanded && (_jsx("div", { className: "space-y-0.5", children: recentTasks.map(function (task) {
                                    var isActive = task.id === currentTaskId;
                                    return (_jsxs("button", { className: "w-full flex items-center gap-2 px-2 py-1.5 rounded text-[13px] text-left transition-all ".concat(isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'), children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full shrink-0 ".concat(isActive ? 'bg-primary' : 'bg-text-muted') }), _jsx("span", { className: "truncate flex-1", children: task.topic }), _jsxs("span", { className: "text-[10px] text-text-muted shrink-0", children: [Math.round(task.progress * 100), "%"] })] }, task.id));
                                }) }))] })), activeTask && (_jsxs("div", { className: "px-3 pb-3", children: [_jsx("div", { className: "text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2", children: "\u5F53\u524D\u4EFB\u52A1" }), _jsxs("div", { className: "p-3 bg-card border border-border rounded-md", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("div", { className: "flex gap-1", children: [0.25, 0.5, 0.75, 1.0].map(function (threshold, i) { return (_jsx("div", { className: "w-2 h-2 rounded-full ".concat(activeTask.progress >= threshold
                                                        ? statusColors[activeTask.status] || 'bg-primary'
                                                        : 'bg-surface-hover') }, i)); }) }), _jsx("span", { className: "text-xs text-text-secondary", children: agentLabels[activeTask.currentAgent || ''] || activeTask.status })] }), _jsx("div", { className: "w-full h-1 bg-surface-hover rounded-full overflow-hidden mb-1", children: _jsx("div", { className: "h-full bg-primary rounded-full transition-all duration-300", style: { width: "".concat(activeTask.progress * 100, "%") } }) }), activeTask.lastAction && (_jsx("p", { className: "text-[11px] text-text-muted truncate", children: activeTask.lastAction }))] })] })), _jsxs("div", { className: "px-3 pb-3", children: [_jsx("div", { className: "text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2", children: "\u5FEB\u901F\u5165\u53E3" }), _jsx("div", { className: "space-y-0.5", children: quickAccess.map(function (item) {
                                    var Icon = item.icon;
                                    var isActive = pathname.startsWith(item.to);
                                    return (_jsxs(Link, { to: item.to, className: "flex items-center gap-2 px-2 py-1.5 rounded text-[13px] transition-all ".concat(isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'), children: [_jsx(Icon, { size: 14, className: isActive ? 'text-primary' : 'text-text-muted' }), _jsx("span", { children: item.label })] }, item.to));
                                }) })] })] }), _jsxs("div", { className: "p-3 border-t border-border", children: [_jsx("div", { className: "text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2", children: "\u4E3B\u9898\u5207\u6362" }), _jsx("div", { className: "flex gap-2", children: themes.map(function (t) {
                            var Icon = t.icon;
                            var isActive = currentTheme === t.id;
                            return (_jsxs("button", { onClick: function () { return setTheme(t.id); }, className: "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-[12px] transition-all ".concat(isActive
                                    ? 'bg-primary/10 text-primary border border-primary/30'
                                    : 'bg-surface-hover text-text-secondary hover:bg-surface-hover/80'), children: [_jsx(Icon, { size: 12 }), _jsx("span", { children: t.label })] }, t.id));
                        }) })] })] }));
}
