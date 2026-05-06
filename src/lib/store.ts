import { create } from 'zustand';
import type { TaskEvent, TaskState } from './types';

interface Task {
  id: string;
  topic: string;
  status: string;
  progress: number;
  error?: string;
}

interface AppStore {
  tasks: Record<string, Task>;
  currentTaskId: string | null;

  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  updateTaskFromEvent: (event: TaskEvent) => void;
  setCurrentTask: (id: string | null) => void;
  clearTask: (id: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  tasks: {},
  currentTaskId: null,

  addTask: (task) =>
    set((state) => ({
      tasks: { ...state.tasks, [task.id]: task },
    })),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: {
        ...state.tasks,
        [id]: { ...state.tasks[id], ...updates },
      },
    })),

  updateTaskFromEvent: (event) => {
    const taskId = event.payload.task_id;
    set((state) => {
      const task = state.tasks[taskId];
      if (!task) return state;

      let updates: Partial<Task> = {};
      switch (event.type) {
        case 'TaskStarted':
          updates.status = 'Researching';
          updates.progress = 0.25;
          break;
        case 'AgentCompleted':
          updates.status = event.payload.agent === 'Researcher' ? 'Analyzing'
            : event.payload.agent === 'Analyst' ? 'Writing'
            : 'Writing';
          updates.progress = event.payload.agent === 'Researcher' ? 0.5
            : event.payload.agent === 'Analyst' ? 0.75
            : 0.75;
          break;
        case 'TaskCompleted':
          updates.status = 'Completed';
          updates.progress = 1.0;
          break;
        case 'TaskFailed':
          updates.status = 'Failed';
          updates.error = event.payload.error;
          break;
      }

      return {
        tasks: {
          ...state.tasks,
          [taskId]: { ...task, ...updates },
        },
      };
    });
  },

  setCurrentTask: (id) =>
    set({ currentTaskId: id }),

  clearTask: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.tasks;
      return { tasks: rest };
    }),
}));
