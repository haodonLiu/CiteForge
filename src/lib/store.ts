import { create } from 'zustand';
import type { TaskEvent } from './types/domain';
import { setTheme as applyTheme, getStoredTheme, applyFontSettings, getStoredFontSettings } from './theme';

export type AppTheme = 'ivory_press' | 'midnight_scholar' | 'green_garden' | 'high_contrast';

export interface Task {
  id: string;
  topic: string;
  status: string;
  progress: number;
  currentAgent?: string;
  lastAction?: string;
  error?: string;
}

export interface Activity {
  id: string;
  timestamp: number;
  type: 'task_created' | 'literature_added' | 'draft_generated' | 'checkpoint_reached';
  description: string;
  taskId?: string;
}

export interface AppStore {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  initializeTheme: () => void;

  tasks: Record<string, Task>;
  currentTaskId: string | null;
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;

  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  updateTaskFromEvent: (event: TaskEvent) => void;
  setCurrentTask: (id: string | null) => void;
  clearTask: (id: string) => void;
  getCurrentTask: () => Task | null;
}

const storedTheme = getStoredTheme();

export const useAppStore = create<AppStore>((set) => ({
  theme: storedTheme || 'ivory_press',

  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },

  initializeTheme: () => {
    const stored = getStoredTheme();
    if (stored) {
      applyTheme(stored);
      set({ theme: stored });
    }
    // Apply stored font settings on startup
    const fontSettings = getStoredFontSettings();
    applyFontSettings(fontSettings);
  },

  tasks: {},
  currentTaskId: null,

  activities: [],

  addActivity: (activity) =>
    set((state) => ({
      activities: [
        {
          ...activity,
          id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: Date.now(),
        },
        ...state.activities.slice(0, 19),
      ],
    })),

  addTask: (task) =>
    set((state) => ({
      tasks: { ...state.tasks, [task.id]: task },
    })),

  updateTask: (id, updates) =>
    set((state) => {
      if (!state.tasks[id]) return state;
      return {
        tasks: {
          ...state.tasks,
          [id]: { ...state.tasks[id], ...updates },
        },
      };
    }),

  updateTaskFromEvent: (event) => {
    // Payload contents remain snake_case from API
    const payload = event.payload as Record<string, unknown>;
    const taskId = payload.task_id as string;

    set((state) => {
      let task = state.tasks[taskId];

      // If task doesn't exist and this is TaskStarted, create it
      if (!task && event.eventType === 'TaskStarted') {
        task = {
          id: taskId,
          topic: '',
          status: 'Pending',
          progress: 0,
        };
      }

      if (!task) return state;

      let updates: Partial<Task> = {};
      switch (event.eventType) {
        case 'TaskStarted':
          updates.status = 'Researching';
          updates.progress = 0.25;
          return {
            tasks: { ...state.tasks, [taskId]: { ...task, ...updates } },
            currentTaskId: state.currentTaskId || taskId,
          };
        case 'AgentCompleted':
          updates.status = payload.agent === 'Researcher' ? 'Analyzing'
            : payload.agent === 'Analyst' ? 'Writing'
            : 'Writing';
          updates.progress = payload.agent === 'Researcher' ? 0.5
            : payload.agent === 'Analyst' ? 0.75
            : 1.0;
          break;
        case 'TaskCompleted':
          updates.status = 'Completed';
          updates.progress = 1.0;
          return {
            tasks: { ...state.tasks, [taskId]: { ...task, ...updates } },
            currentTaskId: null,
          };
        case 'TaskFailed':
          updates.status = 'Failed';
          updates.error = payload.error as string;
          return {
            tasks: { ...state.tasks, [taskId]: { ...task, ...updates } },
            currentTaskId: null,
          };
        case 'LiteraturePoolUpdated':
          updates.lastAction = `文献库更新: ${payload.count} 篇`;
          break;
        case 'DraftGenerated':
          updates.lastAction = '草稿已生成';
          break;
      }

      return {
        tasks: { ...state.tasks, [taskId]: { ...task, ...updates } },
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

  getCurrentTask: () => {
    return null;
  },
}));
