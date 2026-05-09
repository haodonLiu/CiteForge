var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { invoke } from '@/lib/tauri';
import { BookOpen, FileEdit, Bot, Play, CheckCircle, AlertCircle, } from 'lucide-react';
import Card from '@/components/ui/Card';
import { StatusBadge, taskStatusToPhase } from '@/components/ui/StatusBadge';
import { useAppStore } from '@/lib/store';
var workflowSteps = [
    {
        id: 'research',
        label: '文献研究',
        desc: '导入并阅读相关文献',
        icon: BookOpen,
        path: 'literature',
    },
    {
        id: 'analyze',
        label: '分析整理',
        desc: '使用 Agent 分析主题结构',
        icon: Bot,
        path: 'agent',
    },
    {
        id: 'write',
        label: '撰写综述',
        desc: '编辑并完善综述草稿',
        icon: FileEdit,
        path: 'editor',
    },
];
export default function TaskDashboard() {
    var _this = this;
    var taskId = useParams().taskId;
    var tasks = useAppStore(function (s) { return s.tasks; });
    var task = taskId ? tasks[taskId] : null;
    var _a = useState(0), draftWords = _a[0], setDraftWords = _a[1];
    useEffect(function () {
        var fetchStats = function () { return __awaiter(_this, void 0, void 0, function () {
            var stats, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!taskId)
                            return [2 /*return*/];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, invoke('get_draft_stats', {
                                workspace_id: taskId,
                            })];
                    case 2:
                        stats = _b.sent();
                        setDraftWords(stats.total_words);
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _b.sent();
                        setDraftWords(0);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        fetchStats();
    }, [taskId]);
    if (!task) {
        return (_jsx("div", { className: "h-full flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx(AlertCircle, { size: 32, className: "text-text-muted mx-auto mb-3" }), _jsx("p", { className: "text-sm text-text-muted", children: "\u9879\u76EE\u4E0D\u5B58\u5728\u6216\u5DF2\u88AB\u5220\u9664" }), _jsx(Link, { to: "/", className: "text-xs text-primary mt-2 inline-block hover:underline", children: "\u8FD4\u56DE\u5DE5\u4F5C\u53F0" })] }) }));
    }
    var progress = Math.round((task.progress || 0) * 100);
    var phase = taskStatusToPhase(task.status);
    var isRunning = task.status === 'Researching' ||
        task.status === 'Analyzing' ||
        task.status === 'Writing' ||
        task.status === 'AnalyzingAndWriting';
    // Determine which workflow step is active based on status
    var getActiveStep = function () {
        if (task.status === 'Researching' || task.status === 'Pending')
            return 0;
        if (task.status === 'Analyzing' || task.status === 'AnalyzingAndWriting')
            return 1;
        if (task.status === 'Writing')
            return 2;
        if (task.status === 'Completed')
            return 3;
        return 0;
    };
    var activeStep = getActiveStep();
    return (_jsx("div", { className: "h-full overflow-auto p-6", children: _jsxs("div", { className: "max-w-3xl mx-auto", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h1", { className: "text-lg font-semibold text-text-primary mb-1", children: task.topic || '未命名项目' }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(StatusBadge, { phase: phase }), isRunning && (_jsxs("span", { className: "flex items-center gap-1 text-xs text-primary", children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-primary animate-pulse" }), "\u8FD0\u884C\u4E2D"] })), task.status === 'Completed' && (_jsxs("span", { className: "flex items-center gap-1 text-xs text-success", children: [_jsx(CheckCircle, { size: 12 }), "\u5DF2\u5B8C\u6210"] }))] })] }), _jsxs(Card, { className: "p-4 mb-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("span", { className: "text-sm font-medium text-text-secondary", children: "\u603B\u4F53\u8FDB\u5EA6" }), _jsxs("span", { className: "text-sm font-semibold text-primary", children: [progress, "%"] })] }), _jsx("div", { className: "h-2 bg-surface-hover rounded-full overflow-hidden mb-3", children: _jsx("div", { className: "h-full bg-primary rounded-full transition-all duration-500", style: { width: "".concat(progress, "%") } }) }), _jsxs("div", { className: "flex items-center justify-between text-xs text-text-muted", children: [_jsx("span", { children: task.currentAgent
                                        ? "\u5F53\u524D\u9636\u6BB5: ".concat(task.currentAgent)
                                        : task.lastAction || '等待开始' }), _jsx("span", { children: draftWords > 0 ? "".concat(draftWords.toLocaleString(), " \u5B57") : '暂无草稿' })] })] }), _jsxs("div", { className: "mb-6", children: [_jsx("h2", { className: "text-[11px] font-medium text-text-muted uppercase tracking-wider mb-3", children: "\u5DE5\u4F5C\u6D41" }), _jsx("div", { className: "space-y-2", children: workflowSteps.map(function (step, index) {
                                var Icon = step.icon;
                                var isActive = index === activeStep;
                                var isCompleted = index < activeStep;
                                var stepPath = "/task/".concat(taskId, "/").concat(step.path);
                                return (_jsxs(Link, { to: stepPath, className: "flex items-center gap-3 p-3 rounded-lg border transition-all ".concat(isActive
                                        ? 'border-primary/30 bg-primary/5'
                                        : isCompleted
                                            ? 'border-success/20 bg-success/5'
                                            : 'border-border bg-card hover:border-primary/20'), children: [_jsx("div", { className: "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ".concat(isActive
                                                ? 'bg-primary/10 text-primary'
                                                : isCompleted
                                                    ? 'bg-success/10 text-success'
                                                    : 'bg-surface-hover text-text-muted'), children: isCompleted ? (_jsx(CheckCircle, { size: 16 })) : (_jsx(Icon, { size: 16 })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-sm font-medium text-text-primary", children: step.label }), _jsx("div", { className: "text-xs text-text-muted", children: step.desc })] }), isActive && (_jsxs("div", { className: "flex items-center gap-1 text-xs text-primary", children: [_jsx(Play, { size: 12 }), "\u8FDB\u884C\u4E2D"] })), !isActive && !isCompleted && (_jsx("span", { className: "text-xs text-text-muted", children: "\u5F85\u5F00\u59CB" }))] }, step.id));
                            }) })] }), _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsxs(Card, { className: "p-3 text-center", children: [_jsxs("div", { className: "text-lg font-semibold text-text-primary", children: [progress, "%"] }), _jsx("div", { className: "text-[11px] text-text-muted", children: "\u5B8C\u6210\u5EA6" })] }), _jsxs(Card, { className: "p-3 text-center", children: [_jsx("div", { className: "text-lg font-semibold text-text-primary", children: draftWords.toLocaleString() }), _jsx("div", { className: "text-[11px] text-text-muted", children: "\u8349\u7A3F\u5B57\u6570" })] }), _jsxs(Card, { className: "p-3 text-center", children: [_jsx("div", { className: "text-lg font-semibold text-text-primary", children: task.status === 'Completed' ? '已完成' : isRunning ? '进行中' : '待开始' }), _jsx("div", { className: "text-[11px] text-text-muted", children: "\u72B6\u6001" })] })] })] }) }));
}
