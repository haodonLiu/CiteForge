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
import { Link, useNavigate } from 'react-router-dom';
import { invoke, open } from '@/lib/tauri';
import { FileText, Plus, BookOpen, CheckCircle, Clock, FolderOpen, Sparkles, } from 'lucide-react';
import Card from '@/components/ui/Card';
import { StatusBadge, taskStatusToPhase } from '@/components/ui/StatusBadge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useAppStore } from '@/lib/store';
import { getWeekData, getWorkTimeForDay } from '@/hooks/useActivityTracker';
export default function Home(_a) {
    var _this = this;
    var _b = _a.recentLiterature, recentLiterature = _b === void 0 ? [] : _b;
    var navigate = useNavigate();
    var tasks = useAppStore(function (s) { return s.tasks; });
    var addActivity = useAppStore(function (s) { return s.addActivity; });
    var setCurrentTask = useAppStore(function (s) { return s.setCurrentTask; });
    var activeReviews = Object.values(tasks).filter(function (t) { return t.status !== 'Completed' && t.status !== 'Failed'; });
    var completedReviews = Object.values(tasks).filter(function (t) { return t.status === 'Completed'; });
    var _c = useState(0), totalWords = _c[0], setTotalWords = _c[1];
    useEffect(function () {
        var fetchDraftStats = function () { return __awaiter(_this, void 0, void 0, function () {
            var workspaceId, stats, e_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (activeReviews.length === 0) {
                            setTotalWords(0);
                            return [2 /*return*/];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        workspaceId = (_a = activeReviews[0]) === null || _a === void 0 ? void 0 : _a.id;
                        return [4 /*yield*/, invoke('get_draft_stats', {
                                workspace_id: workspaceId,
                            })];
                    case 2:
                        stats = _b.sent();
                        setTotalWords(stats.total_words);
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _b.sent();
                        setTotalWords(0);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        fetchDraftStats();
    }, [activeReviews]);
    var today = new Date().toISOString().slice(0, 10);
    var weekData = getWeekData();
    var todayMinutes = getWorkTimeForDay(today);
    var totalWeekMinutes = weekData.reduce(function (sum, d) { return sum + d.minutes; }, 0);
    var completedCount = completedReviews.length;
    var formatMinutes = function (mins) {
        var h = Math.floor(mins / 60);
        var m = mins % 60;
        return h > 0 ? "".concat(h, "h ").concat(m, "m") : "".concat(m, "m");
    };
    var handleCreateTask = function () { return __awaiter(_this, void 0, void 0, function () {
        var result, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, invoke('run_task', {
                            topic: '新综述',
                            pdfPaths: [],
                        })];
                case 1:
                    result = _a.sent();
                    addActivity({
                        type: 'task_created',
                        description: '创建新综述任务',
                        taskId: result.task_id,
                    });
                    setCurrentTask(result.task_id);
                    navigate("/task/".concat(result.task_id));
                    return [3 /*break*/, 3];
                case 2:
                    e_2 = _a.sent();
                    console.error('Failed to create task:', e_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var handleImportPdf = function () { return __awaiter(_this, void 0, void 0, function () {
        var selected;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, open({
                        multiple: true,
                        filters: [{ name: 'PDF', extensions: ['pdf'] }],
                    })];
                case 1:
                    selected = _a.sent();
                    if (selected && selected.length > 0) {
                        addActivity({
                            type: 'literature_added',
                            description: "\u5BFC\u5165 ".concat(selected.length, " \u4E2A PDF"),
                            taskId: undefined,
                        });
                        navigate('/library');
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    return (_jsx("div", { className: "h-full overflow-auto p-6", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "flex items-start justify-between mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold text-text-primary mb-1", children: "\u5DE5\u4F5C\u53F0" }), _jsx("p", { className: "text-sm text-text-muted", children: activeReviews.length > 0
                                        ? "".concat(activeReviews.length, " \u4E2A\u8FDB\u884C\u4E2D\u7684\u9879\u76EE")
                                        : '开始你的学术研究之旅' })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: handleImportPdf, className: "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-text-secondary bg-surface-hover hover:bg-surface-hover/80 hover:text-text-primary transition-colors border border-border", children: [_jsx(BookOpen, { size: 13 }), "\u5BFC\u5165\u6587\u732E"] }), _jsxs("button", { onClick: handleCreateTask, className: "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white bg-primary hover:bg-primary/90 transition-colors", children: [_jsx(Plus, { size: 13 }), "\u65B0\u5EFA\u9879\u76EE"] })] })] }), _jsxs("div", { className: "mb-8", children: [_jsxs("h2", { className: "text-[11px] font-medium text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5", children: [_jsx(FolderOpen, { size: 12 }), "\u8FDB\u884C\u4E2D\u7684\u9879\u76EE"] }), activeReviews.length === 0 ? (_jsxs(Card, { className: "p-8 text-center", children: [_jsx(Sparkles, { size: 24, className: "text-text-muted mx-auto mb-3" }), _jsx("p", { className: "text-sm text-text-muted", children: "\u6682\u65E0\u8FDB\u884C\u4E2D\u7684\u9879\u76EE" }), _jsx("p", { className: "text-xs text-text-muted mt-1", children: "\u70B9\u51FB\u53F3\u4E0A\u89D2\"\u65B0\u5EFA\u9879\u76EE\"\u6216\"\u5BFC\u5165\u6587\u732E\"\u5F00\u59CB" })] })) : (_jsx("div", { className: "space-y-3", children: activeReviews.map(function (task) {
                                var phase = taskStatusToPhase(task.status);
                                var progress = Math.round((task.progress || 0) * 100);
                                var estimate = Math.round((1 - (task.progress || 0)) * 30);
                                return (_jsxs(Card, { clickable: true, className: "p-4 group", onClick: function () {
                                        setCurrentTask(task.id);
                                        navigate("/task/".concat(task.id));
                                    }, children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "font-medium text-text-primary truncate", children: task.topic || '未命名项目' }), _jsxs("div", { className: "flex items-center gap-2 mt-1", children: [_jsx(StatusBadge, { phase: phase }), _jsxs("span", { className: "text-xs text-text-muted", children: ["\u9884\u8BA1 ", estimate > 0 ? "".concat(estimate, " \u5206\u949F") : '即将完成'] })] })] }), _jsx(ProgressRing, { value: progress, size: 44 })] }), _jsxs("div", { className: "mt-3", children: [_jsx("div", { className: "h-1.5 bg-surface-hover rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-primary rounded-full transition-all", style: { width: "".concat(progress, "%") } }) }), task.lastAction && (_jsx("p", { className: "text-[11px] text-text-muted mt-1 truncate", children: task.lastAction }))] }), _jsxs("div", { className: "flex gap-2 mt-3", children: [_jsx(Link, { to: "/task/".concat(task.id, "/editor"), onClick: function (e) {
                                                        e.stopPropagation();
                                                        setCurrentTask(task.id);
                                                    }, className: "text-xs px-3 py-1.5 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors", children: "\u7EE7\u7EED\u5199\u4F5C" }), _jsx(Link, { to: "/task/".concat(task.id, "/agent"), onClick: function (e) {
                                                        e.stopPropagation();
                                                        setCurrentTask(task.id);
                                                    }, className: "text-xs px-3 py-1.5 text-text-muted hover:text-text-secondary transition-colors", children: "Agent \u52A9\u624B" })] })] }, task.id));
                            }) }))] }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs(Card, { className: "p-4", children: [_jsxs("h3", { className: "text-xs font-medium text-text-secondary mb-3 flex items-center gap-1.5", children: [_jsx(Clock, { size: 12 }), "\u672C\u5468\u5DE5\u4F5C\u65F6\u957F"] }), _jsx("div", { className: "h-20 flex items-end gap-1", children: weekData.map(function (day, i) {
                                        var maxMinutes = 240;
                                        var height = Math.min((day.minutes / maxMinutes) * 100, 100);
                                        var isToday = day.date === today;
                                        return (_jsxs("div", { className: "flex-1 flex flex-col items-center gap-1", children: [_jsx("div", { className: "w-full rounded-t transition-all hover:bg-primary/40 ".concat(isToday ? 'bg-primary/30' : 'bg-primary/20'), style: { height: "".concat(Math.max(height, 4), "%") } }), _jsx("span", { className: "text-[10px] ".concat(isToday ? 'text-primary font-medium' : 'text-text-muted'), children: day.label })] }, i));
                                    }) }), _jsxs("div", { className: "flex justify-between mt-2 text-xs text-text-muted", children: [_jsxs("span", { children: ["\u4ECA\u65E5: ", formatMinutes(todayMinutes)] }), _jsxs("span", { children: ["\u672C\u5468: ", formatMinutes(totalWeekMinutes)] })] })] }), _jsxs(Card, { className: "p-4", children: [_jsx("h3", { className: "text-xs font-medium text-text-secondary mb-3", children: "\u5199\u4F5C\u4EA7\u51FA" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-2xl font-semibold text-text-primary", children: totalWords.toLocaleString() }), _jsx("div", { className: "text-xs text-text-muted", children: "\u603B\u5B57\u6570" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-2xl font-semibold text-text-primary", children: completedCount }), _jsx("div", { className: "text-xs text-text-muted", children: "\u5B8C\u6210\u9879\u76EE" })] })] })] }), _jsxs(Card, { className: "p-4", children: [_jsx("h3", { className: "text-xs font-medium text-text-secondary mb-3", children: "\u6700\u8FD1\u6D3B\u52A8" }), _jsx(ActivityFeed, {})] })] })] }) }));
}
function ActivityIcon(_a) {
    var _b;
    var type = _a.type;
    var defaultIcon = { icon: Plus, className: 'text-primary' };
    var config = {
        task_created: defaultIcon,
        literature_added: { icon: BookOpen, className: 'text-info' },
        draft_generated: { icon: FileText, className: 'text-success' },
        checkpoint_reached: { icon: CheckCircle, className: 'text-warning' },
    };
    var _c = (_b = config[type]) !== null && _b !== void 0 ? _b : defaultIcon, Icon = _c.icon, className = _c.className;
    return _jsx(Icon, { size: 12, className: className });
}
function ActivityFeed() {
    var activities = useAppStore(function (s) { return s.activities; });
    if (activities.length === 0) {
        return _jsx("p", { className: "text-xs text-text-muted text-center py-2", children: "\u6682\u65E0\u6D3B\u52A8\u8BB0\u5F55" });
    }
    return (_jsx("div", { className: "space-y-2", children: activities.slice(0, 5).map(function (a) { return (_jsxs("div", { className: "flex items-center gap-2 text-xs", children: [_jsx(ActivityIcon, { type: a.type }), _jsx("span", { className: "text-text-muted shrink-0", children: new Date(a.timestamp).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                    }) }), _jsx("span", { className: "text-text-secondary truncate", children: a.description })] }, a.id)); }) }));
}
