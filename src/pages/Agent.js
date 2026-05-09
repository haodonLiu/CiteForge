import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import AgentTerminal from '@/components/agent/AgentTerminal';
import PersonalitySelector from '@/components/agent/PersonalitySelector';
var defaultPersonalities = [
    {
        id: '1',
        name: '严谨学者',
        description: '直言不讳，批判性高，追求准确',
        traits: { directness: 70, humor: 20, curiosity: 80, criticalness: 80, patience: 60, creativity: 40 },
        interaction_style: { proactive_questions: true, challenge_assumptions: true, suggest_alternatives: false, use_analogies: false, cite_sources: true },
        system_prompt: '你是一个严谨的学术助手。',
    },
    {
        id: '2',
        name: '激励导师',
        description: '幽默、好奇、鼓励探索',
        traits: { directness: 40, humor: 60, curiosity: 90, criticalness: 30, patience: 80, creativity: 70 },
        interaction_style: { proactive_questions: true, challenge_assumptions: false, suggest_alternatives: true, use_analogies: true, cite_sources: false },
        system_prompt: '你是一个激励型导师。',
    },
    {
        id: '3',
        name: '批判性思考者',
        description: '直接、质疑假设、推动深入思考',
        traits: { directness: 90, humor: 30, curiosity: 90, criticalness: 95, patience: 40, creativity: 60 },
        interaction_style: { proactive_questions: true, challenge_assumptions: true, suggest_alternatives: true, use_analogies: false, cite_sources: true },
        system_prompt: '你是一个批判性思考者。',
    },
];
export default function AgentPage() {
    var _a = useState('1'), selectedPersonality = _a[0], setSelectedPersonality = _a[1];
    var currentPersonality = defaultPersonalities.find(function (p) { return p.id === selectedPersonality; });
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsx(PersonalitySelector, { personalities: defaultPersonalities, selected: selectedPersonality, onSelect: setSelectedPersonality }), _jsx("div", { className: "flex-1", children: _jsx(AgentTerminal, { personality: (currentPersonality === null || currentPersonality === void 0 ? void 0 : currentPersonality.name) || 'Agent' }) })] }));
}
