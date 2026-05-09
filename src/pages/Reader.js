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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useCallback, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { usePdfIndex } from '@/hooks/usePdfIndex';
var PdfVirtualViewer = lazy(function () { return import('@/components/reader/PdfVirtualViewer'); });
import AnnotationLayer from '@/components/reader/AnnotationLayer';
import TextSelectionMenu from '@/components/reader/TextSelectionMenu';
import DecompositionPanel from '@/components/reader/DecompositionPanel';
export default function Reader() {
    var _this = this;
    var _a = useParams(), taskId = _a.taskId, docId = _a.docId, legacyId = _a.id;
    var effectiveDocId = docId || legacyId;
    var _b = useState(null), filePath = _b[0], setFilePath = _b[1];
    var _c = useState(null), file = _c[0], setFile = _c[1];
    var _d = useState(0), numPages = _d[0], setNumPages = _d[1];
    var _e = useState(1), currentPage = _e[0], setCurrentPage = _e[1];
    var _f = useState(1.0), scale = _f[0], setScale = _f[1];
    var _g = useState([]), annotations = _g[0], setAnnotations = _g[1];
    var _h = useState(false), showSidebar = _h[0], setShowSidebar = _h[1];
    var _j = useState('outline'), sidebarTab = _j[0], setSidebarTab = _j[1];
    var containerRef = useRef(null);
    var _k = useState([]), notes = _k[0], setNotes = _k[1];
    var _l = useState(''), searchQuery = _l[0], setSearchQuery = _l[1];
    var _m = useState(true), showOutline = _m[0], setShowOutline = _m[1];
    var _o = usePdfIndex(), outline = _o.outline, searchResults = _o.searchResults, indexLoading = _o.loading, generateIndex = _o.generateIndex, search = _o.search, clearSearch = _o.clearSearch;
    var handleVisiblePageChange = useCallback(function (page) {
        setCurrentPage(page);
    }, []);
    var handleAddNote = useCallback(function (text, page) {
        setNotes(function (prev) { return __spreadArray(__spreadArray([], prev, true), [
            {
                text: text,
                page: page,
                timestamp: new Date().toISOString(),
            },
        ], false); });
    }, []);
    var handleInsertCitation = useCallback(function (text, page) {
        // TODO: Integrate with Writer Agent to insert selected text as citation into draft
        console.log('Insert citation:', { text: text, page: page, taskId: taskId });
    }, [taskId]);
    var handleSearchSemantic = useCallback(function (text) {
        // TODO: Call Semantic Scholar API
        console.log('Search semantic scholar:', text);
    }, []);
    var handleSearch = useCallback(function (query) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setSearchQuery(query);
                    if (!query.trim()) return [3 /*break*/, 2];
                    return [4 /*yield*/, search(query)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    clearSearch();
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    }); }, [search, clearSearch]);
    var jumpToPage = useCallback(function (page) {
        setCurrentPage(page);
        var container = containerRef.current;
        if (container) {
            var scrollToPage_1 = container.__scrollToPage;
            if (scrollToPage_1) {
                scrollToPage_1(page);
            }
        }
    }, []);
    var scrollToPage = useCallback(function (page) {
        var container = containerRef.current;
        if (container) {
            var scrollToPage_2 = container.__scrollToPage;
            if (scrollToPage_2) {
                scrollToPage_2(page);
            }
        }
    }, []);
    // Keyboard shortcuts
    var handleKeyDown = useCallback(function (e) {
        if (e.key === 'ArrowUp' || e.key === 'PageUp') {
            e.preventDefault();
            setCurrentPage(function (p) { return Math.max(1, p - 1); });
            scrollToPage(Math.max(1, currentPage - 1));
        }
        else if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
            e.preventDefault();
            setCurrentPage(function (p) { return Math.min(numPages, p + 1); });
            scrollToPage(Math.min(numPages, currentPage + 1));
        }
    }, [currentPage, numPages, scrollToPage]);
    return (_jsxs("div", { className: "h-full flex flex-col", tabIndex: 0, onKeyDown: handleKeyDown, children: [_jsxs("div", { className: "h-10 flex items-center justify-between px-3 border-b border-border bg-surface shrink-0", children: [_jsxs("div", { className: "flex items-center gap-3", children: [taskId && (_jsxs(Link, { to: "/task/".concat(taskId, "/literature"), className: "flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors", children: [_jsx(ArrowLeft, { size: 12 }), "\u6587\u732E"] })), _jsx("div", { className: "w-px h-4 bg-border" }), _jsxs("div", { className: "flex items-center gap-0.5", children: [_jsx(Button, { size: "sm", variant: "ghost", onClick: function () {
                                            setCurrentPage(function (p) { return Math.max(1, p - 1); });
                                            scrollToPage(Math.max(1, currentPage - 1));
                                        }, disabled: currentPage <= 1, className: "w-7 h-7 p-0", children: "\u25C0" }), _jsx(Button, { size: "sm", variant: "ghost", onClick: function () {
                                            setCurrentPage(function (p) { return Math.min(numPages, p + 1); });
                                            scrollToPage(Math.min(numPages, currentPage + 1));
                                        }, disabled: currentPage >= numPages, className: "w-7 h-7 p-0", children: "\u25B6" })] }), _jsx("div", { className: "w-px h-4 bg-border" }), _jsxs(Select, { value: "".concat(Math.round(scale * 100), "%"), onChange: function (e) {
                                    var val = parseInt(e.target.value) / 100;
                                    setScale(val);
                                }, className: "w-20 h-7 text-xs", children: [_jsx("option", { value: "50%", children: "50%" }), _jsx("option", { value: "75%", children: "75%" }), _jsx("option", { value: "100%", children: "100%" }), _jsx("option", { value: "125%", children: "125%" }), _jsx("option", { value: "150%", children: "150%" }), _jsx("option", { value: "200%", children: "200%" })] }), _jsx("div", { className: "w-px h-4 bg-border" }), _jsx(Button, { size: "sm", variant: "ghost", onClick: function () { return setScale(1.0); }, className: "h-7 px-2 text-xs", title: "\u9002\u5E94\u9875\u9762", children: "\u2B1C" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "relative", children: [_jsx("input", { type: "text", value: searchQuery, onChange: function (e) { return handleSearch(e.target.value); }, placeholder: "\u641C\u7D22...", className: "h-7 w-40 pl-7 pr-2 text-xs bg-surface-hover border border-border rounded focus:outline-none focus:border-primary" }), _jsx("span", { className: "absolute left-2 top-1/2 -translate-y-1/2 text-text-muted", children: "\uD83D\uDD0D" })] }), _jsx("div", { className: "w-px h-4 bg-border" }), _jsx(Button, { size: "sm", variant: showSidebar ? 'primary' : 'ghost', onClick: function () { return setShowSidebar(!showSidebar); }, className: "h-7 px-2 text-xs", children: "\uD83D\uDCD1 \u76EE\u5F55" })] })] }), _jsxs("div", { className: "flex-1 flex overflow-hidden", children: [_jsxs("div", { ref: containerRef, className: "flex-1 overflow-hidden relative", children: [_jsx(Suspense, { fallback: _jsx("div", { className: "flex items-center justify-center h-full", children: _jsx("div", { className: "text-text-muted", children: "\u52A0\u8F7D PDF \u67E5\u770B\u5668..." }) }), children: _jsx(PdfVirtualViewer, { file: file, scale: scale, onDocumentLoaded: function (_a) {
                                        var numPages = _a.numPages;
                                        return setNumPages(numPages);
                                    }, onVisiblePageChange: handleVisiblePageChange }) }), _jsx(AnnotationLayer, { annotations: annotations, currentPage: currentPage, onAddAnnotation: function (annotation) {
                                    setAnnotations(function (prev) { return __spreadArray(__spreadArray([], prev, true), [
                                        __assign(__assign({}, annotation), { id: Date.now().toString(), created_at: new Date().toISOString() }),
                                    ], false); });
                                }, onDeleteAnnotation: function (id) {
                                    setAnnotations(function (prev) { return prev.filter(function (a) { return a.id !== id; }); });
                                } }), _jsx(TextSelectionMenu, { onAddNote: handleAddNote, onInsertCitation: handleInsertCitation, onSearchSemantic: handleSearchSemantic })] }), showSidebar && (_jsxs("div", { className: "w-72 border-l border-border bg-surface flex flex-col overflow-hidden", children: [_jsxs("div", { className: "flex border-b border-border shrink-0", children: [_jsx("button", { onClick: function () { return setSidebarTab('outline'); }, className: "flex-1 px-3 py-2 text-xs font-medium transition-colors ".concat(sidebarTab === 'outline'
                                            ? 'text-primary border-b-2 border-primary'
                                            : 'text-text-muted hover:text-text-secondary'), children: "\u76EE\u5F55" }), _jsx("button", { onClick: function () { return setSidebarTab('structure'); }, className: "flex-1 px-3 py-2 text-xs font-medium transition-colors ".concat(sidebarTab === 'structure'
                                            ? 'text-primary border-b-2 border-primary'
                                            : 'text-text-muted hover:text-text-secondary'), children: "\u7ED3\u6784\u5206\u6790" })] }), _jsxs("div", { className: "flex-1 overflow-auto", children: [sidebarTab === 'outline' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "p-3 border-b border-border", children: [_jsx(Input, { value: searchQuery, onChange: function (e) { return handleSearch(e.target.value); }, placeholder: "\u641C\u7D22\u6587\u6863\u5185\u5BB9...", className: "w-full" }), searchResults.length > 0 && (_jsxs("div", { className: "mt-2 text-xs text-text-muted", children: ["\u627E\u5230 ", searchResults.length, " \u4E2A\u7ED3\u679C"] }))] }), searchResults.length > 0 && (_jsxs("div", { className: "p-3 border-b border-border", children: [_jsx("h3", { className: "text-sm font-semibold text-text-primary mb-2", children: "\u641C\u7D22\u7ED3\u679C" }), _jsx("div", { className: "space-y-2 max-h-48 overflow-y-auto", children: searchResults.slice(0, 20).map(function (result, idx) { return (_jsxs("button", { onClick: function () { return jumpToPage(result.page); }, className: "w-full text-left p-2 text-xs rounded hover:bg-surface-hover transition-colors", children: [_jsxs("div", { className: "text-text-muted mb-1", children: ["\u7B2C ", result.page, " \u9875"] }), _jsx("div", { className: "text-text-primary line-clamp-2", children: result.text })] }, idx)); }) })] })), outline.length > 0 && (_jsxs("div", { className: "p-3 border-b border-border", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "text-sm font-semibold text-text-primary", children: "\u76EE\u5F55" }), _jsx("button", { onClick: function () { return setShowOutline(!showOutline); }, className: "text-xs text-text-muted hover:text-text-primary", children: showOutline ? '收起' : '展开' })] }), showOutline && (_jsx("div", { className: "space-y-1", children: outline.map(function (item, idx) { return (_jsxs("button", { onClick: function () { return jumpToPage(item.page); }, className: "w-full text-left text-xs py-1 hover:text-primary transition-colors", style: { paddingLeft: "".concat((item.level - 1) * 12 + 4, "px") }, children: [_jsx("span", { className: "text-text-secondary", children: item.title }), _jsxs("span", { className: "text-text-muted ml-2", children: ["p.", item.page] })] }, idx)); }) }))] })), _jsxs("div", { className: "p-3 border-b border-border", children: [_jsx("h3", { className: "text-sm font-semibold text-text-primary mb-2", children: "\u6587\u6863\u4FE1\u606F" }), _jsxs("div", { className: "space-y-1 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-text-muted", children: "\u603B\u9875\u6570" }), _jsx("span", { className: "text-text-primary", children: numPages })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-text-muted", children: "\u5F53\u524D\u9875" }), _jsx("span", { className: "text-text-primary", children: currentPage })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-text-muted", children: "\u7F29\u653E" }), _jsxs("span", { className: "text-text-primary", children: [Math.round(scale * 100), "%"] })] })] })] }), _jsxs("div", { className: "p-3 border-b border-border", children: [_jsx("h3", { className: "text-sm font-semibold text-text-primary mb-2", children: "\u5FEB\u6377\u952E" }), _jsxs("div", { className: "space-y-1 text-xs text-text-secondary", children: [_jsx("div", { children: "\u2191/PageUp: \u4E0A\u4E00\u9875" }), _jsx("div", { children: "\u2193/PageDown/\u7A7A\u683C: \u4E0B\u4E00\u9875" }), _jsx("div", { children: "Ctrl+F: \u641C\u7D22" })] })] }), _jsxs("div", { className: "p-3 border-b border-border", children: [_jsx("h3", { className: "text-sm font-semibold text-text-primary mb-2", children: "\u6279\u6CE8\u7EDF\u8BA1" }), _jsxs("div", { className: "text-sm text-text-secondary", children: ["\u5171 ", annotations.length, " \u6761\u6279\u6CE8"] })] }), notes.length > 0 && (_jsxs("div", { className: "p-3", children: [_jsx("h3", { className: "text-sm font-semibold text-text-primary mb-2", children: "\u7B14\u8BB0" }), _jsx("div", { className: "space-y-2", children: notes.map(function (note, idx) { return (_jsxs("div", { className: "text-xs p-2 bg-surface rounded border border-border", children: [_jsxs("div", { className: "text-text-muted mb-1", children: ["\u7B2C ", note.page, " \u9875"] }), _jsx("div", { className: "text-text-primary line-clamp-3", children: note.text })] }, idx)); }) })] }))] })), sidebarTab === 'structure' && (_jsx(DecompositionPanel, { filePath: filePath, onJumpToPage: jumpToPage }))] })] }))] })] }));
}
