import { listen, invoke } from '@/lib/tauri';
import { useEffect, useState } from 'react';

export interface AgentEvent {
  id: string;
  timestamp: string;
  source: 'Orchestrator' | 'Researcher' | 'Analyst' | 'Writer' | 'Human' | 'System';
  event_type: string;
  payload: Record<string, unknown>;
  requires_action: boolean;
}

export function useOrchestrator(taskId: string | null) {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [checkpoint, setCheckpoint] = useState<AgentEvent | null>(null);
  const [phase, setPhase] = useState<string>('Idle');

  useEffect(() => {
    if (!taskId) return;

    // Load existing events
    invoke<AgentEvent[]>('get_events', { taskId }).then((existing: AgentEvent[]) => {
      setEvents(existing);
      const lastPhase = existing.findLast((e: AgentEvent) => e.event_type === 'StateTransition');
      if (lastPhase) {
        setPhase((lastPhase.payload as any).to || 'Idle');
      }
    });

    // Subscribe to new events
    const unlisten = listen<AgentEvent>('orchestrator-event', (e: { payload: AgentEvent }) => {
      const event = e.payload;

      setEvents(prev => [...prev, event]);

      if (event.event_type === 'StateTransition') {
        setPhase((event.payload as any).to || phase);
      }

      if (event.requires_action) {
        setCheckpoint(event);
      }
    });

    return () => { unlisten.then((f: () => void) => f()); };
  }, [taskId]);

  const sendDecision = async (decision: string) => {
    await invoke('submit_human_decision', { taskId, decision });
    setCheckpoint(null);
  };

  return { events, checkpoint, phase, sendDecision };
}
