import { useState, useEffect, useCallback } from 'react';
import { invoke, isTauri } from '@/lib/tauri';
import type { AgentConversation } from '@/lib/types';
import type { ApiAgentConversation } from '@/lib/types/api';
import { mapApiAgentConversation } from '@/lib/types/domain';

export function useAgentChat(taskId?: string, agentName?: string) {
  const [messages, setMessages] = useState<AgentConversation[]>([]);
  const [loading, setLoading] = useState(false);

  const loadConversation = useCallback(async () => {
    if (!isTauri || !taskId?.trim() || !agentName?.trim()) return;
    try {
      const data = await invoke<ApiAgentConversation[]>('get_agent_conversation', {
        task_id: taskId.trim(),
        agent_name: agentName.trim(),
        limit: 50,
      });
      setMessages((data || []).map(mapApiAgentConversation).reverse());
    } catch (e) {
      console.error('Failed to load conversation:', e);
    }
  }, [taskId, agentName]);

  const sendMessage = useCallback(
    async (message: string, personalityPrompt: string) => {
      if (!isTauri || !taskId?.trim() || !agentName?.trim() || !message.trim()) return null;
      setLoading(true);
      try {
        const response = await invoke<string>('chat_with_agent', {
          task_id: taskId.trim(),
          agent_name: agentName.trim(),
          personality_prompt: personalityPrompt,
          message,
        });
        await loadConversation();
        return response;
      } catch (e) {
        console.error('Failed to send message:', e);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [taskId, agentName, loadConversation]
  );

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  return { messages, loading, sendMessage, loadConversation };
}

export function useAgentDiscussion(taskId?: string) {
  const [discussion, setDiscussion] = useState<AgentConversation[]>([]);
  const [loading, setLoading] = useState(false);

  const startDiscussion = useCallback(
    async (topic: string, literatureIds: string[] = []) => {
      if (!isTauri || !taskId) return;
      setLoading(true);
      try {
        const data = await invoke<ApiAgentConversation[]>('start_agent_discussion', {
          task_id: taskId,
          topic,
          literature_ids: literatureIds,
        });
        setDiscussion((data || []).map(mapApiAgentConversation));
      } catch (e) {
        console.error('Failed to start discussion:', e);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [taskId]
  );

  return { discussion, loading, startDiscussion };
}
