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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Bot, User } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
export default function AgentTerminal(_a) {
    var _this = this;
    var personality = _a.personality;
    var _b = useState([]), messages = _b[0], setMessages = _b[1];
    var _c = useState(''), input = _c[0], setInput = _c[1];
    var _d = useState(false), isLoading = _d[0], setIsLoading = _d[1];
    var messagesEndRef = useRef(null);
    useEffect(function () {
        var _a;
        (_a = messagesEndRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'auto' });
    }, [messages]);
    var handleSend = function () { return __awaiter(_this, void 0, void 0, function () {
        var userMessage, msgId;
        return __generator(this, function (_a) {
            if (!input.trim() || isLoading)
                return [2 /*return*/];
            userMessage = input.trim();
            msgId = "msg-".concat(Date.now());
            setInput('');
            setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [{
                    id: msgId,
                    role: 'user',
                    content: userMessage,
                    timestamp: new Date(),
                }], false); });
            setIsLoading(true);
            setTimeout(function () {
                setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [{
                        id: "msg-".concat(Date.now()),
                        role: 'assistant',
                        content: "\u6211\u662F ".concat(personality, "\uFF0C\u6B63\u5728\u5904\u7406\u60A8\u7684\u8BF7\u6C42\uFF1A\"").concat(userMessage, "\""),
                        timestamp: new Date(),
                    }], false); });
                setIsLoading(false);
            }, 800);
            return [2 /*return*/];
        });
    }); };
    return (_jsxs("div", { className: "h-full flex flex-col bg-background", children: [_jsxs("div", { className: "h-12 px-4 flex items-center border-b border-border shrink-0", children: [_jsx(Bot, { size: 16, className: "text-primary mr-2" }), _jsx("h1", { className: "text-sm font-semibold text-text-primary", children: "Agent \u7EC8\u7AEF" }), _jsxs("span", { className: "ml-2 text-[11px] text-text-muted", children: ["\u00B7 ", personality] })] }), _jsxs("div", { className: "flex-1 overflow-auto", children: [messages.length === 0 && (_jsxs("div", { className: "flex flex-col items-center justify-center h-full text-center px-4", children: [_jsx(Bot, { size: 32, className: "text-text-muted mb-3" }), _jsx("p", { className: "text-sm text-text-muted", children: "\u5F00\u59CB\u4E0E Agent \u5BF9\u8BDD" }), _jsx("p", { className: "text-[11px] text-text-muted mt-1", children: "\u6309 Enter \u53D1\u9001\u6D88\u606F" })] })), _jsxs("div", { className: "max-w-2xl mx-auto py-4 px-4", children: [messages.map(function (msg, i) { return (_jsxs("div", { className: "relative pl-6 pb-4", children: [i < messages.length - 1 && (_jsx("div", { className: "absolute left-[9px] top-6 bottom-0 w-px bg-border" })), _jsx("div", { className: "absolute left-0 top-0 w-5 h-5 rounded-full flex items-center justify-center ".concat(msg.role === 'assistant' ? 'bg-primary/10' : 'bg-surface'), children: msg.role === 'assistant'
                                            ? _jsx(Bot, { size: 12, className: "text-primary" })
                                            : _jsx(User, { size: 12, className: "text-text-muted" }) }), _jsx("div", { className: "bg-surface border border-l-2 border-l-primary rounded-md p-3", children: _jsx("p", { className: "text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap", children: msg.content }) }), _jsx("span", { className: "text-[10px] text-text-muted mt-1 block", children: msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })] }, msg.id)); }), isLoading && (_jsxs("div", { className: "relative pl-6 pb-4", children: [_jsx("div", { className: "absolute left-0 top-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center", children: _jsx(Bot, { size: 12, className: "text-primary" }) }), _jsx("div", { className: "bg-surface border border-l-2 border-l-primary/50 rounded-md p-3", children: _jsx("span", { className: "text-[13px] text-text-muted", children: "\u601D\u8003\u4E2D..." }) })] })), _jsx("div", { ref: messagesEndRef })] })] }), _jsx("div", { className: "p-3 border-t border-border shrink-0", children: _jsxs("div", { className: "max-w-2xl mx-auto flex gap-2", children: [_jsx(Input, { type: "text", value: input, onChange: function (e) { return setInput(e.target.value); }, onKeyDown: function (e) { return e.key === 'Enter' && handleSend(); }, placeholder: "\u8F93\u5165\u6D88\u606F...", disabled: isLoading, className: "flex-1" }), _jsx(Button, { variant: "primary", onClick: handleSend, disabled: isLoading || !input.trim(), size: "md", children: "\u53D1\u9001" })] }) })] }));
}
