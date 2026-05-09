import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet, useParams, useLocation, Link, Navigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import Breadcrumb from './Breadcrumb';
import { LayoutDashboard, BookOpen, FileEdit, Bot, } from 'lucide-react';
var taskNavItems = [
    { id: 'overview', label: '概览', path: '', icon: LayoutDashboard },
    { id: 'literature', label: '文献', path: '/literature', icon: BookOpen },
    { id: 'editor', label: '写作', path: '/editor', icon: FileEdit },
    { id: 'agent', label: 'Agent', path: '/agent', icon: Bot },
];
export default function TaskLayout() {
    var _a;
    var taskId = useParams().taskId;
    var pathname = useLocation().pathname;
    var tasks = useAppStore(function (s) { return s.tasks; });
    var setCurrentTask = useAppStore(function (s) { return s.setCurrentTask; });
    var task = taskId ? tasks[taskId] : null;
    // Auto-set current task when entering task layout
    if (taskId && task) {
        setCurrentTask(taskId);
    }
    if (!taskId) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    var taskName = (task === null || task === void 0 ? void 0 : task.topic) || '未命名项目';
    var basePath = "/task/".concat(taskId);
    // Determine active tab from pathname
    var activeTabId = ((_a = taskNavItems.find(function (item) {
        if (item.path === '') {
            // overview: exact match or /task/:id
            return pathname === basePath || pathname === "".concat(basePath, "/");
        }
        // For other tabs, also handle sub-routes (e.g., /editor or /reader/:docId under literature)
        if (item.id === 'literature') {
            return pathname.startsWith("".concat(basePath, "/literature")) || pathname.startsWith("".concat(basePath, "/reader/"));
        }
        return pathname.startsWith("".concat(basePath).concat(item.path));
    })) === null || _a === void 0 ? void 0 : _a.id) || 'overview';
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsxs("div", { className: "shrink-0 px-4 pt-3 pb-2 border-b border-border bg-surface/50", children: [_jsx(Breadcrumb, { segments: [
                            { label: '项目', to: '/' },
                            { label: taskName },
                        ] }), _jsx("div", { className: "flex items-center gap-1 mt-2", children: taskNavItems.map(function (item) {
                            var Icon = item.icon;
                            var isActive = item.id === activeTabId;
                            var to = "".concat(basePath).concat(item.path);
                            return (_jsxs(Link, { to: to, className: "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ".concat(isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'), children: [_jsx(Icon, { size: 13 }), _jsx("span", { children: item.label })] }, item.id));
                        }) })] }), _jsx("div", { className: "flex-1 overflow-hidden", children: _jsx(Outlet, {}) })] }));
}
