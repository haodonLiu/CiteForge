import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { BookOpen, ArrowLeft } from 'lucide-react';
import LiteratureList from '@/components/library/LiteratureList';
export default function Library() {
    var navigate = useNavigate();
    var taskId = useParams().taskId;
    var pathname = useLocation().pathname;
    // Determine if we're in a task context
    var isTaskContext = pathname.startsWith('/task/');
    var handleSelect = function (id) {
        if (isTaskContext && taskId) {
            navigate("/task/".concat(taskId, "/reader/").concat(id));
        }
        else {
            navigate("/reader/".concat(id));
        }
    };
    return (_jsxs("div", { className: "h-full flex flex-col", children: [isTaskContext && taskId && (_jsxs("div", { className: "flex items-center gap-2 px-3 py-2 border-b border-border bg-surface/50 shrink-0", children: [_jsxs("button", { onClick: function () { return navigate("/task/".concat(taskId)); }, className: "flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors", children: [_jsx(ArrowLeft, { size: 12 }), "\u8FD4\u56DE\u6982\u89C8"] }), _jsx("div", { className: "w-px h-4 bg-border" }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(BookOpen, { size: 14, className: "text-primary" }), _jsx("span", { className: "text-sm font-semibold text-text-primary", children: "\u9879\u76EE\u6587\u732E" })] })] })), _jsx("div", { className: "flex-1 overflow-hidden", children: _jsx(LiteratureList, { onSelect: handleSelect }) })] }));
}
