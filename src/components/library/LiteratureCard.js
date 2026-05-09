import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FileText, Globe } from 'lucide-react';
import Badge from '@/components/ui/Badge';
var statusVariant = {
    Unread: 'default',
    Reading: 'primary',
    Read: 'success',
    ToRead: 'warning',
    Archived: 'default',
};
export default function LiteratureCard(_a) {
    var literature = _a.literature, onSelect = _a.onSelect;
    var isPdf = literature.source === 'pdf' || literature.file_path;
    return (_jsxs("div", { onClick: function () { return onSelect(literature.id); }, className: "flex items-start gap-3 p-3 bg-card border border-border rounded-md hover:border-primary/30 transition-colors cursor-pointer", children: [_jsx("div", { className: "w-10 h-10 rounded bg-surface flex items-center justify-center text-text-muted shrink-0", children: isPdf ? _jsx(FileText, { size: 18 }) : _jsx(Globe, { size: 18 }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "text-sm font-medium text-text-primary truncate", children: literature.title }), _jsxs("p", { className: "text-xs text-text-secondary mt-0.5", children: [literature.authors.map(function (a) { return a.name; }).join(', '), literature.year && " \u00B7 ".concat(literature.year), literature.venue && " \u00B7 ".concat(literature.venue), literature.citation_count && " \u00B7 \u88AB\u5F15 ".concat(literature.citation_count, " \u6B21")] }), _jsx("div", { className: "flex gap-1.5 mt-2", children: literature.tags.slice(0, 3).map(function (tag) { return (_jsx(Badge, { variant: "secondary", children: tag }, tag)); }) })] }), _jsxs("div", { className: "flex flex-col items-end gap-1 shrink-0", children: [_jsx("div", { className: "w-2 h-2 rounded-full ".concat(literature.read_status === 'Read'
                            ? 'bg-success'
                            : literature.read_status === 'Reading'
                                ? 'bg-warning'
                                : 'bg-text-muted'), title: literature.read_status }), literature.read_progress > 0 && literature.read_progress < 1 && (_jsxs("span", { className: "text-[10px] text-text-muted", children: [Math.round(literature.read_progress * 100), "%"] }))] })] }));
}
