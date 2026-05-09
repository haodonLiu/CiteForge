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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { useAppStore } from '@/lib/store';
var tabs = [
    { id: 'llm', label: 'LLM 配置' },
    { id: 'chroma', label: '向量数据库' },
    { id: 'theme', label: '外观' },
    { id: 'about', label: '关于' },
];
var themes = [
    { id: 'ivory_press', name: 'Ivory Press', desc: '象牙烫金，学术奢华' },
    { id: 'midnight_scholar', name: 'Midnight Scholar', desc: '深蓝黑底，低蓝光' },
    { id: 'green_garden', name: 'Green Garden', desc: '低刺激，长时间编辑' },
    { id: 'high_contrast', name: 'High Contrast', desc: '高对比，金色强调' },
];
var defaultSettings = {
    llm: {
        provider: 'Ollama',
        base_url: 'http://localhost:11434',
        api_key: undefined,
        model: 'llama3',
        timeout_secs: 60,
    },
    chroma: {
        url: 'http://localhost:8000',
        collection: 'citeforge',
        embedding_dimension: 1536,
    },
};
export default function Settings() {
    var _a;
    var _b = useState('llm'), activeTab = _b[0], setActiveTab = _b[1];
    var _c = useState(defaultSettings), settings = _c[0], setSettings = _c[1];
    var _d = useState(true), loading = _d[0], setLoading = _d[1];
    var _e = useState(false), saving = _e[0], setSaving = _e[1];
    var _f = useState(null), message = _f[0], setMessage = _f[1];
    var currentTheme = useAppStore(function (s) { return s.theme; });
    var setTheme = useAppStore(function (s) { return s.setTheme; });
    useEffect(function () {
        loadSettings();
    }, []);
    function loadSettings() {
        return __awaiter(this, void 0, void 0, function () {
            var data, e_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, 3, 4]);
                        setLoading(true);
                        return [4 /*yield*/, invoke('get_settings')];
                    case 1:
                        data = _b.sent();
                        setSettings({
                            llm: {
                                provider: data.llm.provider === 'OpenAI' || data.llm.provider === 'Anthropic' || data.llm.provider === 'Ollama'
                                    ? data.llm.provider
                                    : 'Ollama',
                                base_url: data.llm.base_url || 'http://localhost:11434',
                                api_key: data.llm.api_key || undefined,
                                model: data.llm.model || 'llama3',
                                timeout_secs: (_a = data.llm.timeout_secs) !== null && _a !== void 0 ? _a : 60,
                            },
                            chroma: {
                                url: data.chroma.url || 'http://localhost:8000',
                                collection: data.chroma.collection || 'citeforge',
                                embedding_dimension: data.chroma.embedding_dimension || 1536,
                            },
                        });
                        return [3 /*break*/, 4];
                    case 2:
                        e_1 = _b.sent();
                        console.error('failed to load settings:', e_1);
                        setMessage({ type: 'error', text: '加载配置失败' });
                        return [3 /*break*/, 4];
                    case 3:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    function handleSave() {
        return __awaiter(this, void 0, void 0, function () {
            var settingsToSave, e_2;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, 3, 4]);
                        setSaving(true);
                        setMessage(null);
                        settingsToSave = {
                            llm: {
                                provider: settings.llm.provider,
                                base_url: settings.llm.base_url,
                                api_key: settings.llm.api_key || null,
                                model: settings.llm.model,
                                timeout_secs: (_a = settings.llm.timeout_secs) !== null && _a !== void 0 ? _a : null,
                            },
                            chroma: {
                                url: settings.chroma.url,
                                collection: settings.chroma.collection,
                                embedding_dimension: settings.chroma.embedding_dimension,
                            },
                        };
                        return [4 /*yield*/, invoke('save_settings', { settings: settingsToSave })];
                    case 1:
                        _b.sent();
                        setMessage({ type: 'success', text: '配置已保存' });
                        return [3 /*break*/, 4];
                    case 2:
                        e_2 = _b.sent();
                        console.error('failed to save settings:', e_2);
                        setMessage({ type: 'error', text: "\u4FDD\u5B58\u5931\u8D25: ".concat(e_2) });
                        return [3 /*break*/, 4];
                    case 3:
                        setSaving(false);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    function updateLlm(key, value) {
        setSettings(function (s) {
            var _a;
            return (__assign(__assign({}, s), { llm: __assign(__assign({}, s.llm), (_a = {}, _a[key] = value, _a)) }));
        });
    }
    function updateChroma(key, value) {
        setSettings(function (s) {
            var _a;
            return (__assign(__assign({}, s), { chroma: __assign(__assign({}, s.chroma), (_a = {}, _a[key] = value, _a)) }));
        });
    }
    return (_jsxs("div", { className: "p-6 max-w-3xl mx-auto", children: [_jsx("div", { className: "flex items-center justify-between mb-6", children: _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-text-primary", children: "\u8BBE\u7F6E" }), _jsx("p", { className: "text-sm text-text-muted mt-1", children: "\u914D\u7F6E\u5E94\u7528\u53C2\u6570\u548C\u9009\u9879" })] }) }), message && (_jsx("div", { className: "mb-4 p-3 rounded-lg text-sm ".concat(message.type === 'success'
                    ? 'bg-success/10 text-success border border-success/20'
                    : 'bg-error/10 text-error border border-error/20'), children: message.text })), _jsx("div", { className: "flex gap-1 mb-6 bg-surface rounded-lg p-1", children: tabs.map(function (tab) { return (_jsx("button", { onClick: function () { return setActiveTab(tab.id); }, className: "px-4 py-2 rounded-md text-sm font-medium transition-all ".concat(activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'), children: tab.label }, tab.id)); }) }), loading ? (_jsx(Card, { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "text-text-muted", children: "\u52A0\u8F7D\u4E2D..." }) })) : (_jsxs(_Fragment, { children: [activeTab === 'llm' && (_jsx(Card, { className: "space-y-6", children: _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-text-primary mb-4", children: "LLM \u63D0\u4F9B\u5546" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-text-secondary mb-1.5", children: "\u63D0\u4F9B\u5546" }), _jsxs(Select, { value: settings.llm.provider, onChange: function (e) { return updateLlm('provider', e.target.value); }, className: "w-full", children: [_jsx("option", { value: "OpenAI", children: "OpenAI" }), _jsx("option", { value: "Anthropic", children: "Anthropic" }), _jsx("option", { value: "Ollama", children: "Ollama" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-text-secondary mb-1.5", children: "\u6A21\u578B" }), _jsx(Input, { value: settings.llm.model, onChange: function (e) { return updateLlm('model', e.target.value); }, placeholder: "e.g., llama3, gpt-4" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-text-secondary mb-1.5", children: "\u8D85\u65F6 (\u79D2)" }), _jsx(Input, { type: "number", value: settings.llm.timeout_secs || '', onChange: function (e) { return updateLlm('timeout_secs', e.target.value ? parseInt(e.target.value) : undefined); }, placeholder: "60" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-text-secondary mb-1.5", children: "API \u5730\u5740" }), _jsx(Input, { value: settings.llm.base_url, onChange: function (e) { return updateLlm('base_url', e.target.value); }, placeholder: "http://localhost:11434" }), _jsx("p", { className: "text-xs text-text-muted mt-1", children: settings.llm.provider === 'Ollama'
                                                        ? 'Ollama 默认地址: http://localhost:11434'
                                                        : settings.llm.provider === 'OpenAI'
                                                            ? 'OpenAI 地址: https://api.openai.com/v1'
                                                            : 'Anthropic 地址: https://api.anthropic.com' })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-text-secondary mb-1.5", children: ["API Key ", settings.llm.provider === 'Ollama' && _jsx(Badge, { variant: "warning", children: "\u53EF\u9009" })] }), _jsx(Input, { type: "password", value: (_a = settings.llm.api_key) !== null && _a !== void 0 ? _a : '', onChange: function (e) { return updateLlm('api_key', e.target.value || undefined); }, placeholder: settings.llm.provider === 'Ollama' ? '留空使用本地模型' : 'sk-...' })] })] })] }) })), activeTab === 'chroma' && (_jsx(Card, { className: "space-y-6", children: _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-text-primary mb-4", children: "\u5411\u91CF\u6570\u636E\u5E93\u914D\u7F6E" }), _jsx("p", { className: "text-sm text-text-muted mb-6", children: "ChromaDB \u7528\u4E8E\u6587\u6863\u8BED\u4E49\u641C\u7D22\u3002\u670D\u52A1\u9700\u8981\u5728\u540E\u53F0\u8FD0\u884C\u3002" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-text-secondary mb-1.5", children: "ChromaDB \u5730\u5740" }), _jsx(Input, { value: settings.chroma.url, onChange: function (e) { return updateChroma('url', e.target.value); }, placeholder: "http://localhost:8000" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-text-secondary mb-1.5", children: "Collection \u540D\u79F0" }), _jsx(Input, { value: settings.chroma.collection, onChange: function (e) { return updateChroma('collection', e.target.value); }, placeholder: "citeforge" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-text-secondary mb-1.5", children: "\u5411\u91CF\u7EF4\u5EA6" }), _jsxs(Select, { value: settings.chroma.embedding_dimension.toString(), onChange: function (e) { return updateChroma('embedding_dimension', parseInt(e.target.value)); }, className: "w-full", children: [_jsx("option", { value: "768", children: "768 (e5-base, all-MiniLM)" }), _jsx("option", { value: "1024", children: "1024 (e5-large)" }), _jsx("option", { value: "1536", children: "1536 (OpenAI, ada-002)" }), _jsx("option", { value: "3072", children: "3072 (voyage-3)" })] })] })] }), _jsx("div", { className: "p-4 bg-surface rounded-lg border border-border", children: _jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx("span", { className: "text-text-muted", children: "\u72B6\u6001:" }), _jsx(Badge, { variant: settings.chroma.url ? 'success' : 'error', children: settings.chroma.url ? '已配置' : '未配置' })] }) })] })] }) })), activeTab === 'theme' && (_jsxs(Card, { children: [_jsx("h2", { className: "text-lg font-semibold text-text-primary mb-6", children: "\u9009\u62E9\u4E3B\u9898" }), _jsx("div", { className: "grid grid-cols-2 gap-4", children: themes.map(function (t) { return (_jsxs("button", { onClick: function () { return setTheme(t.id); }, className: "p-4 rounded-lg border-2 text-left transition-all ".concat(currentTheme === t.id
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/50 bg-surface'), children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("div", { className: "w-4 h-4 rounded-full ".concat(t.id === 'ivory_press' ? 'bg-[#faf8f5] border border-[#e0d8cc]' :
                                                        t.id === 'midnight_scholar' ? 'bg-[#0b1120]' :
                                                            t.id === 'green_garden' ? 'bg-[#f0f4f1]' :
                                                                'bg-black') }), _jsx("span", { className: "font-medium text-text-primary", children: t.name }), currentTheme === t.id && (_jsx(Badge, { variant: "primary", className: "ml-auto", children: "\u5F53\u524D" }))] }), _jsx("p", { className: "text-sm text-text-muted", children: t.desc })] }, t.id)); }) })] })), activeTab === 'about' && (_jsxs("div", { className: "space-y-6", children: [_jsx(Card, { children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center text-3xl", children: "\uD83D\uDCDA" }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-text-primary", children: "CiteForge" }), _jsx("p", { className: "text-text-secondary mt-1", children: "\u79D1\u7814\u52A9\u624B\u7EC8\u7AEF" }), _jsx("p", { className: "text-sm text-text-muted mt-2", children: "\u81EA\u5E26 Agent \u7684\u6587\u732E\u7814\u7A76\u52A9\u624B\uFF0C\u652F\u6301 PDF \u9605\u8BFB\u3001Markdown \u7F16\u8F91\u3001\u6587\u732E\u7BA1\u7406\u3002" })] })] }) }), _jsxs(Card, { children: [_jsx("h3", { className: "text-sm font-semibold text-text-secondary mb-3", children: "\u7248\u672C\u4FE1\u606F" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-text-muted", children: "\u5E94\u7528\u7248\u672C" }), _jsx("span", { className: "text-text-primary", children: "0.1.0" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-text-muted", children: "Tauri" }), _jsx("span", { className: "text-text-primary", children: "2.x" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-text-muted", children: "React" }), _jsx("span", { className: "text-text-primary", children: "18.x" })] })] })] }), _jsxs(Card, { children: [_jsx("h3", { className: "text-sm font-semibold text-text-secondary mb-3", children: "\u6280\u672F\u6808" }), _jsx("div", { className: "flex flex-wrap gap-2", children: ['Rust', 'Tauri 2', 'React', 'TypeScript', 'Vite', 'SQLite', 'ChromaDB'].map(function (tech) { return (_jsx(Badge, { variant: "default", children: tech }, tech)); }) })] })] })), activeTab !== 'about' && (_jsx("div", { className: "mt-6 flex justify-end", children: _jsx(Button, { onClick: handleSave, disabled: saving, children: saving ? '保存中...' : '保存设置' }) }))] }))] }));
}
