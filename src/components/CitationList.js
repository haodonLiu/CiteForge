import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
export function CitationList(_a) {
    var citations = _a.citations, onCitationClick = _a.onCitationClick;
    return (_jsxs("div", { style: { fontFamily: 'monospace' }, children: [_jsxs("h4", { children: ["Literature Pool (", citations.length, " entries)"] }), _jsx("ol", { style: { paddingLeft: '1.5rem', margin: '0' }, children: citations.map(function (cite) { return (_jsxs("li", { style: { marginBottom: '0.5rem', cursor: onCitationClick ? 'pointer' : 'default' }, onClick: function () { return onCitationClick === null || onCitationClick === void 0 ? void 0 : onCitationClick(cite.index); }, children: [_jsx("strong", { children: cite.title }), _jsx("br", {}), cite.authors.join(', '), cite.year && " (".concat(cite.year, ")"), cite.venue && " - ".concat(cite.venue)] }, cite.index)); }) })] }));
}
