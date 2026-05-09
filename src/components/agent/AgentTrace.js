import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
var sourceColors = {
    Orchestrator: 'text-blue-400',
    Researcher: 'text-cyan-400',
    Analyst: 'text-purple-400',
    Writer: 'text-green-400',
    Human: 'text-yellow-400',
    System: 'text-gray-400',
};
function formatEvent(event) {
    var _a;
    var p = event.payload;
    switch (event.event_type) {
        case 'ResearchStarted':
            return "\u5F00\u59CB\u68C0\u7D22: ".concat(p.topic || '');
        case 'ResearchCompleted':
            return "\u68C0\u7D22\u5B8C\u6210: \u627E\u5230 ".concat(p.new_count || 0, " \u7BC7\u6587\u732E");
        case 'AnalysisStarted':
            return '开始分析文献主题...';
        case 'AnalysisCompleted':
            return "\u5206\u6790\u5B8C\u6210: ".concat(((_a = p.themes) === null || _a === void 0 ? void 0 : _a.join(', ')) || '');
        case 'WritingStarted':
            return '开始撰写综述...';
        case 'SectionDrafted':
            return "\u5B8C\u6210\u7AE0\u8282: ".concat(p.section || '', " (").concat(p.word_count || 0, " \u5B57)");
        case 'StateTransition':
            return "\u72B6\u6001\u53D8\u66F4: ".concat(p.from, " \u2192 ").concat(p.to);
        case 'CheckpointReached':
            return "\u7B49\u5F85\u786E\u8BA4: ".concat(p.phase || '');
        case 'ErrorOccurred':
            return "\u9519\u8BEF: ".concat(p.message || '');
        default:
            return event.event_type;
    }
}
export default function AgentTrace(_a) {
    var events = _a.events;
    return (_jsxs("div", { className: "flex flex-col gap-1 font-mono text-xs max-h-96 overflow-y-auto", children: [events.map(function (event) { return (_jsxs("div", { className: "flex gap-2 border-l-2 pl-2 border-border", children: [_jsx("span", { className: "text-text-muted shrink-0", children: event.timestamp.slice(11, 19) }), _jsxs("span", { className: "shrink-0 ".concat(sourceColors[event.source] || 'text-text-secondary'), children: ["[", event.source, "]"] }), _jsx("span", { className: "text-text-primary", children: formatEvent(event) })] }, event.id)); }), events.length === 0 && (_jsx("div", { className: "text-text-muted text-center py-4", children: "\u6682\u65E0\u4E8B\u4EF6" }))] }));
}
