var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { getCurrentWindow, invoke, isTauri } from '@/lib/tauri';
var defaultStatus = {
    mode: 'time',
    silent_mode: false,
};
export function TitleBar() {
    var _this = this;
    var pathname = useLocation().pathname;
    var dragRegionRef = useRef(null);
    var lastActivityRef = useRef(Date.now());
    var silentModeRef = useRef(false);
    var _a = useState(new Date()), currentTime = _a[0], setCurrentTime = _a[1];
    var _b = useState(defaultStatus), status = _b[0], setStatus = _b[1];
    var _c = useState(0), todayMinutes = _c[0], setTodayMinutes = _c[1];
    var _d = useState(5 * 60 * 1000), silentThresholdMs = _d[0], setSilentThresholdMs = _d[1];
    var currentTaskId = useAppStore(function (s) { return s.currentTaskId; });
    var tasks = useAppStore(function (s) { return s.tasks; });
    // Derive location label from pathname
    var getLocationLabel = function () {
        if (pathname === '/')
            return '工作台';
        if (pathname === '/library')
            return '文献库';
        if (pathname === '/settings')
            return '设置';
        if (pathname.startsWith('/task/')) {
            var parts = pathname.split('/');
            var taskId = parts[2];
            var task = taskId ? tasks[taskId] : null;
            var subRoute = parts[3];
            var subLabels = {
                literature: '文献',
                reader: '阅读',
                editor: '写作',
                agent: 'Agent',
            };
            var subLabel = subRoute ? (subLabels[subRoute] || '') : '概览';
            return "".concat((task === null || task === void 0 ? void 0 : task.topic) || '项目', " \u00B7 ").concat(subLabel);
        }
        if (pathname.startsWith('/reader/'))
            return '阅读器';
        if (pathname.startsWith('/editor/'))
            return '编辑器';
        if (pathname === '/agent')
            return 'Agent';
        return '';
    };
    // Fetch time status including silent threshold from backend
    useEffect(function () {
        if (!isTauri)
            return;
        var fetchTimeStatus = function () { return __awaiter(_this, void 0, void 0, function () {
            var response, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, invoke('get_time_status')];
                    case 1:
                        response = _a.sent();
                        setSilentThresholdMs(response.silent_threshold_minutes * 60 * 1000);
                        setTodayMinutes(response.today_minutes);
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _a.sent();
                        console.error('Failed to fetch time status:', e_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        fetchTimeStatus();
    }, []);
    // Time update
    useEffect(function () {
        var timer = setInterval(function () {
            setCurrentTime(new Date());
        }, 1000);
        return function () { return clearInterval(timer); };
    }, []);
    // Sync task status from store
    useEffect(function () {
        if (currentTaskId && tasks[currentTaskId]) {
            var task = tasks[currentTaskId];
            setStatus({
                mode: 'task',
                task_name: task.topic || '处理中...',
                silent_mode: false,
            });
        }
        else {
            setStatus({ mode: 'time', silent_mode: false });
        }
    }, [currentTaskId, tasks]);
    // Check silent mode
    useEffect(function () {
        var checkSilent = function () {
            var idle = Date.now() - lastActivityRef.current;
            if (idle >= silentThresholdMs && !silentModeRef.current) {
                silentModeRef.current = true;
                setStatus(function (prev) { return (__assign(__assign({}, prev), { silent_mode: true })); });
            }
        };
        var interval = setInterval(checkSilent, 10000);
        return function () { return clearInterval(interval); };
    }, [silentThresholdMs]);
    // Record activity
    var recordActivity = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    lastActivityRef.current = Date.now();
                    if (silentModeRef.current) {
                        silentModeRef.current = false;
                        setStatus(function (prev) { return (__assign(__assign({}, prev), { silent_mode: false })); });
                    }
                    if (!isTauri)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, invoke('record_activity')];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    e_2 = _a.sent();
                    console.error('Failed to record activity:', e_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, []);
    // Setup activity listeners
    useEffect(function () {
        var events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        events.forEach(function (event) {
            window.addEventListener(event, recordActivity, { passive: true });
        });
        return function () {
            events.forEach(function (event) {
                window.removeEventListener(event, recordActivity);
            });
        };
    }, [recordActivity]);
    // Drag region setup
    useEffect(function () {
        var dragRegion = dragRegionRef.current;
        if (!dragRegion || !isTauri)
            return;
        var win = getCurrentWindow();
        dragRegion.addEventListener('mousedown', function (e) {
            if (e.buttons === 1) {
                if (e.detail === 2) {
                    win.toggleMaximize();
                }
                else {
                    win.startDragging();
                }
            }
        });
    }, []);
    // Window controls - only available in Tauri
    var handleMinimize = useCallback(function () {
        if (isTauri)
            getCurrentWindow().minimize();
    }, []);
    var handleMaximize = useCallback(function () {
        if (isTauri)
            getCurrentWindow().toggleMaximize();
    }, []);
    var handleClose = useCallback(function () {
        if (isTauri)
            getCurrentWindow().close();
    }, []);
    // Format time
    var formatTime = function (date) {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
    };
    // Format work time
    var formatWorkTime = function (minutes) {
        var hours = Math.floor(minutes / 60);
        var mins = minutes % 60;
        if (hours > 0) {
            return "".concat(hours, "h").concat(mins, "m");
        }
        return "".concat(mins, "m");
    };
    // Status text
    var getStatusText = function () {
        if (status.silent_mode) {
            return '静默模式';
        }
        if (status.mode === 'task' && status.task_name) {
            return status.task_name;
        }
        return formatTime(currentTime);
    };
    var getStatusSubtext = function () {
        if (status.silent_mode) {
            return "".concat(silentThresholdMs / 60000, "\u5206\u949F\u65E0\u64CD\u4F5C");
        }
        if (status.mode === 'task') {
            return '处理中...';
        }
        return "\u4ECA\u65E5\u5DF2\u5DE5\u4F5C ".concat(formatWorkTime(todayMinutes));
    };
    return (_jsxs("div", { className: "h-10 flex items-center justify-between bg-background/80 backdrop-blur border-b border-border select-none shrink-0", children: [_jsx("div", { className: "flex items-center h-full px-4", children: _jsx("span", { className: "text-xs font-medium text-text-secondary", children: getLocationLabel() }) }), _jsx("div", { ref: dragRegionRef, className: "flex-1 h-full flex items-center justify-center cursor-default", onMouseDown: function (e) {
                    if (isTauri && e.buttons === 1 && e.detail === 2) {
                        getCurrentWindow().toggleMaximize();
                    }
                }, children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs ".concat(status.silent_mode ? 'text-muted' : 'text-text-secondary'), children: getStatusText() }), status.silent_mode && (_jsx("span", { className: "text-xs text-muted", children: getStatusSubtext() }))] }) }), _jsxs("div", { className: "flex items-center h-full", children: [_jsx("button", { onClick: handleMinimize, className: "w-10 h-full flex items-center justify-center hover:bg-surface-hover transition-colors", "aria-label": "\u6700\u5C0F\u5316", children: _jsx("svg", { width: "10", height: "1", viewBox: "0 0 10 1", fill: "currentColor", className: "text-text-secondary", children: _jsx("rect", { width: "10", height: "1" }) }) }), _jsx("button", { onClick: handleMaximize, className: "w-10 h-full flex items-center justify-center hover:bg-surface-hover transition-colors", "aria-label": "\u6700\u5927\u5316", children: _jsx("svg", { width: "10", height: "10", viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", className: "text-text-secondary", children: _jsx("rect", { x: "0.5", y: "0.5", width: "9", height: "9", strokeWidth: "1" }) }) }), _jsx("button", { onClick: handleClose, className: "w-10 h-full flex items-center justify-center hover:bg-error/20 transition-colors", "aria-label": "\u5173\u95ED", children: _jsxs("svg", { width: "10", height: "10", viewBox: "0 0 10 10", stroke: "currentColor", className: "text-text-secondary", children: [_jsx("line", { x1: "0", y1: "0", x2: "10", y2: "10", strokeWidth: "1.2" }), _jsx("line", { x1: "10", y1: "0", x2: "0", y2: "10", strokeWidth: "1.2" })] }) })] })] }));
}
