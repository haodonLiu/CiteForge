import { jsx as _jsx } from "react/jsx-runtime";
var phaseConfig = {
    researching: { label: '文献检索中', className: 'bg-info/20 text-info' },
    analyzing: { label: '分析中', className: 'bg-purple-500/20 text-purple-400' },
    writing: { label: '写作中', className: 'bg-success/20 text-success' },
    checkpoint: { label: '等待确认', className: 'bg-warning/20 text-warning' },
    completed: { label: '已完成', className: 'bg-text-muted/20 text-text-muted' },
    pending: { label: '待开始', className: 'bg-surface-hover text-text-muted' },
};
export var StatusBadge = function (_a) {
    var phase = _a.phase, _b = _a.size, size = _b === void 0 ? 'md' : _b;
    var config = phaseConfig[phase] || phaseConfig.pending;
    var sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';
    return (_jsx("span", { className: "inline-flex items-center rounded ".concat(config.className, " ").concat(sizeClass), children: config.label }));
};
// Helper to map task status to phase
export function taskStatusToPhase(status) {
    var map = {
        Pending: 'pending',
        Researching: 'researching',
        Analyzing: 'analyzing',
        Writing: 'writing',
        AnalyzingAndWriting: 'writing',
        Completed: 'completed',
        Failed: 'pending',
    };
    return map[status] || 'pending';
}
