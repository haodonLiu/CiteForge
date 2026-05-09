import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TitleBar } from '@/components/TitleBar';
import Sidebar from '@/components/layout/Sidebar';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import TaskLayout from '@/components/layout/TaskLayout';
import { useTaskEvents } from '@/hooks/useTaskEvents';
import Home from '@/pages/Home';
import Library from '@/pages/Library';
import Reader from '@/pages/Reader';
import Editor from '@/pages/Editor';
import Agent from '@/pages/Agent';
import Settings from '@/pages/Settings';
import TaskDashboard from '@/pages/TaskDashboard';
function AppContent() {
    useTaskEvents();
    return (_jsxs("div", { className: "flex flex-1 overflow-hidden", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 overflow-hidden", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/library", element: _jsx(Library, {}) }), _jsx(Route, { path: "/settings", element: _jsx(Settings, {}) }), _jsxs(Route, { path: "/task/:taskId", element: _jsx(TaskLayout, {}), children: [_jsx(Route, { index: true, element: _jsx(TaskDashboard, {}) }), _jsx(Route, { path: "literature", element: _jsx(Library, {}) }), _jsx(Route, { path: "reader/:docId", element: _jsx(Reader, {}) }), _jsx(Route, { path: "editor", element: _jsx(Editor, {}) }), _jsx(Route, { path: "agent", element: _jsx(Agent, {}) })] }), _jsx(Route, { path: "/reader/:docId", element: _jsx(Reader, {}) }), _jsx(Route, { path: "/editor/:id", element: _jsx(EditorLegacyRedirect, {}) }), _jsx(Route, { path: "/agent", element: _jsx(Agent, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) })] }));
}
function EditorLegacyRedirect() {
    // Old /editor/:id route — redirect to task-scoped editor if possible
    // For now, just render Editor standalone
    return _jsx(Editor, {});
}
export default function App() {
    return (_jsx(ThemeProvider, { children: _jsx(BrowserRouter, { children: _jsxs("div", { className: "flex flex-col h-screen", children: [_jsx(TitleBar, {}), _jsx(AppContent, {})] }) }) }));
}
