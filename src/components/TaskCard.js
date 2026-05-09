import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function TaskCard(_a) {
    var id = _a.id, topic = _a.topic, status = _a.status, progress = _a.progress, error = _a.error;
    return (_jsxs("div", { style: {
            border: '1px solid #ccc',
            padding: '1rem',
            marginBottom: '1rem',
            borderRadius: '4px',
        }, children: [_jsx("h3", { style: { margin: '0 0 0.5rem 0' }, children: topic }), _jsxs("p", { style: { margin: '0 0 0.5rem 0', color: '#666' }, children: ["Status: ", status] }), _jsx("div", { style: {
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#eee',
                    borderRadius: '4px',
                    overflow: 'hidden',
                }, children: _jsx("div", { style: {
                        width: "".concat(progress * 100, "%"),
                        height: '100%',
                        backgroundColor: status === 'Failed' ? '#dc3545' : '#000',
                        transition: 'width 0.3s ease',
                    } }) }), error && (_jsx("p", { style: { color: '#dc3545', marginTop: '0.5rem' }, children: error }))] }));
}
