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
import { useState, useEffect, useCallback } from 'react';
import { invoke, listen } from '@/lib/tauri';
import { Layers, AlertTriangle, RefreshCw, ChevronRight, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';
var SECTION_TYPE_COLORS = {
    Abstract: 'text-info',
    Introduction: 'text-success',
    RelatedWork: 'text-text-muted',
    Methodology: 'text-warning',
    Experiment: 'text-primary',
    Discussion: 'text-text-secondary',
    Conclusion: 'text-success',
    Unknown: 'text-text-muted',
};
var SECTION_TYPE_ICONS = {
    Abstract: '📄',
    Introduction: '📖',
    RelatedWork: '📚',
    Methodology: '⚙️',
    Experiment: '🧪',
    Discussion: '💬',
    Conclusion: '✅',
    Unknown: '❓',
};
export default function DecompositionPanel(_a) {
    var _this = this;
    var filePath = _a.filePath, onJumpToPage = _a.onJumpToPage;
    var _b = useState('idle'), status = _b[0], setStatus = _b[1];
    var _c = useState(null), structure = _c[0], setStructure = _c[1];
    var _d = useState(null), progress = _d[0], setProgress = _d[1];
    var _e = useState(null), error = _e[0], setError = _e[1];
    var _f = useState(new Set()), expandedSections = _f[0], setExpandedSections = _f[1];
    // Listen for decomposition progress events
    useEffect(function () {
        var unlisten = listen('decomposition-progress', function (event) {
            setProgress(event.payload);
        });
        return function () { unlisten.then(function (fn) { return fn(); }); };
    }, []);
    var analyzeStructure = useCallback(function (path) { return __awaiter(_this, void 0, void 0, function () {
        var result, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    setStatus('loading');
                    setError(null);
                    setProgress(null);
                    return [4 /*yield*/, invoke('analyze_paper_structure', {
                            filePath: path,
                        })];
                case 1:
                    result = _a.sent();
                    setStructure(result);
                    setStatus('ready');
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    setError(String(e_1));
                    setStatus('error');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); }, []);
    // Auto-analyze when filePath changes
    useEffect(function () {
        if (filePath) {
            analyzeStructure(filePath);
        }
        else {
            setStatus('idle');
            setStructure(null);
        }
    }, [filePath, analyzeStructure]);
    var toggleSection = function (id) {
        setExpandedSections(function (prev) {
            var next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            }
            else {
                next.add(id);
            }
            return next;
        });
    };
    // Idle state: no paper selected
    if (status === 'idle' && !filePath) {
        return (_jsxs("div", { className: "flex flex-col items-center gap-3 py-12 text-text-muted", children: [_jsx(Layers, { size: 32, className: "opacity-30" }), _jsx("p", { className: "text-sm", children: "\u9009\u62E9\u4E00\u7BC7\u8BBA\u6587\u5F00\u59CB\u62C6\u89E3" }), _jsx("p", { className: "text-xs", children: "\u6216\u5BFC\u5165 PDF \u81EA\u52A8\u63D0\u53D6\u7ED3\u6784" })] }));
    }
    // Loading state
    if (status === 'loading') {
        return (_jsxs("div", { className: "flex flex-col items-center gap-3 py-8 text-text-muted", children: [_jsx("div", { className: "w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" }), _jsx("span", { className: "text-sm", children: (progress === null || progress === void 0 ? void 0 : progress.message) || '正在解析论文结构...' }), progress && (_jsxs("div", { className: "w-full px-4", children: [_jsx("div", { className: "w-full h-1.5 bg-surface-hover rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-primary rounded-full transition-all duration-300", style: { width: "".concat(progress.progress, "%") } }) }), _jsxs("span", { className: "text-xs text-text-muted mt-1 block text-center", children: [progress.stage, " \u2014 ", progress.progress, "%"] })] }))] }));
    }
    // Error state
    if (status === 'error') {
        return (_jsx("div", { className: "p-4", children: _jsxs("div", { className: "border border-error/30 bg-error/5 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(AlertTriangle, { size: 16, className: "text-error" }), _jsx("h4", { className: "text-error font-medium text-sm", children: "\u7ED3\u6784\u63D0\u53D6\u5931\u8D25" })] }), _jsx("p", { className: "text-xs text-text-secondary mb-3", children: error }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { size: "sm", onClick: function () { return filePath && analyzeStructure(filePath); }, children: [_jsx(RefreshCw, { size: 12, className: "mr-1" }), "\u91CD\u8BD5"] }), _jsx(Button, { size: "sm", variant: "ghost", children: "\u624B\u52A8\u7F16\u8F91\u7ED3\u6784" })] })] }) }));
    }
    // Ready state: display structure
    if (status === 'ready' && structure) {
        return (_jsxs("div", { className: "flex flex-col h-full", children: [_jsxs("div", { className: "p-3 border-b border-border", children: [_jsx("h3", { className: "text-sm font-semibold text-text-primary line-clamp-2", children: structure.title }), _jsxs("div", { className: "text-xs text-text-muted mt-1", children: [structure.total_pages, " \u9875 \u00B7 ", structure.sections.length, " \u4E2A\u7AE0\u8282"] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-2", children: [structure.abstract_node && (_jsxs("button", { onClick: function () { return onJumpToPage === null || onJumpToPage === void 0 ? void 0 : onJumpToPage(structure.abstract_node.page_start); }, className: "w-full text-left px-2 py-1.5 rounded text-xs hover:bg-surface-hover transition-colors flex items-center gap-2", children: [_jsx("span", { children: SECTION_TYPE_ICONS.Abstract }), _jsx("span", { className: "text-text-secondary", children: "Abstract" }), _jsxs("span", { className: "text-text-muted ml-auto", children: ["p.", structure.abstract_node.page_start] })] })), structure.sections.map(function (section) {
                            var isExpanded = expandedSections.has(section.id);
                            var hasChildren = structure.sections.some(function (s) { return s.id !== section.id && s.id.startsWith(section.id + '.'); });
                            var typeColor = SECTION_TYPE_COLORS[section.section_type] || 'text-text-muted';
                            return (_jsxs("div", { children: [_jsxs("button", { onClick: function () {
                                            onJumpToPage === null || onJumpToPage === void 0 ? void 0 : onJumpToPage(section.page_start);
                                            if (hasChildren)
                                                toggleSection(section.id);
                                        }, className: "w-full text-left px-2 py-1.5 rounded text-xs hover:bg-surface-hover transition-colors flex items-center gap-1.5", style: { paddingLeft: "".concat((section.level - 1) * 12 + 8, "px") }, children: [hasChildren ? (isExpanded ? _jsx(ChevronDown, { size: 10 }) : _jsx(ChevronRight, { size: 10 })) : (_jsx("span", { className: "w-[10px]" })), _jsx("span", { children: SECTION_TYPE_ICONS[section.section_type] || '❓' }), _jsx("span", { className: "flex-1 truncate ".concat(typeColor), children: section.title }), _jsxs("span", { className: "text-text-muted shrink-0", children: ["p.", section.page_start] })] }), isExpanded && (_jsx("div", { className: "px-2 py-1 text-[10px] text-text-muted", style: { paddingLeft: "".concat((section.level - 1) * 12 + 32, "px") }, children: _jsx("span", { className: "inline-block px-1.5 py-0.5 bg-surface-hover rounded", children: section.section_type }) }))] }, section.id));
                        })] }), _jsx("div", { className: "p-3 border-t border-border", children: _jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-text-muted", children: "\u65B9\u6CD5\u8BBA" }), _jsxs("span", { className: "text-text-secondary", children: [structure.sections.filter(function (s) { return s.section_type === 'Methodology'; }).length, " \u8282"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-text-muted", children: "\u5B9E\u9A8C" }), _jsxs("span", { className: "text-text-secondary", children: [structure.sections.filter(function (s) { return s.section_type === 'Experiment'; }).length, " \u8282"] })] })] }) })] }));
    }
    return null;
}
