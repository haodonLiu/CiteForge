'use client';

import type { TaskState } from '@/lib/types';

interface TaskCardProps {
  id: string;
  topic: string;
  status: TaskState;
  progress: number;
  error?: string;
}

export function TaskCard({ id, topic, status, progress, error }: TaskCardProps) {
  return (
    <div style={{
      border: '1px solid #ccc',
      padding: '1rem',
      marginBottom: '1rem',
      borderRadius: '4px',
    }}>
      <h3 style={{ margin: '0 0 0.5rem 0' }}>{topic}</h3>
      <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>
        Status: {status}
      </p>
      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: '#eee',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${progress * 100}%`,
          height: '100%',
          backgroundColor: status === 'Failed' ? '#dc3545' : '#000',
          transition: 'width 0.3s ease',
        }} />
      </div>
      {error && (
        <p style={{ color: '#dc3545', marginTop: '0.5rem' }}>{error}</p>
      )}
    </div>
  );
}
