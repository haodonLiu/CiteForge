import { jsx as _jsx } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import LiteratureList from '@/components/library/LiteratureList';
export default function Library() {
    var navigate = useNavigate();
    return (_jsx(LiteratureList, { onSelect: function (id) { return navigate("/reader/".concat(id)); } }));
}
