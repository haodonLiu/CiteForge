'use client';

import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTaskEvents } from '@/hooks/useTaskEvents';
import { useAppStore } from '@/lib/store';

export default function HomePage() {
  const [topic, setTopic] = useState('');
  const [pdfFiles, setPdfFiles] = useState<string[]>([]);
  const [taskId, setTaskId] = useState<string | null>(null);
  const { tasks } = useAppStore();

  useTaskEvents();

  const handleRunTask = async () => {
    try {
      const response = await invoke<{ task_id: string; status: string }>('run_task', {
        topic,
        pdfPaths: pdfFiles,
      });
      setTaskId(response.task_id);
    } catch (error) {
      console.error('Failed to run task:', error);
    }
  };

  const currentTask = taskId ? tasks[taskId] : null;

  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>CiteForge</h1>
      <p>Multi-agent literature review framework</p>

      <div style={{ marginTop: '2rem' }}>
        <label>
          Topic:
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}
            placeholder="Survey on LLM Agents"
          />
        </label>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <button
          onClick={handleRunTask}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Run Task
        </button>
      </div>

      {currentTask && (
        <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ccc' }}>
          <h2>Task Status</h2>
          <p>ID: {currentTask.id}</p>
          <p>Status: {currentTask.status}</p>
          <p>Progress: {Math.round(currentTask.progress * 100)}%</p>
          {currentTask.error && <p style={{ color: 'red' }}>Error: {currentTask.error}</p>}
        </div>
      )}
    </main>
  );
}
