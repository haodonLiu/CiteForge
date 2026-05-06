export interface TaskDto {
  id: string;
  topic: string;
  status: TaskState;
}

export type TaskState =
  | 'Pending'
  | 'Researching'
  | 'Analyzing'
  | 'Writing'
  | 'Completed'
  | 'Failed';

export interface RunTaskRequest {
  topic: string;
  pdf_paths: string[];
}

export interface TaskStatusResponse {
  task_id: string;
  status: string;
  progress: number;
}

export type TaskEvent =
  | { type: 'TaskStarted'; payload: { task_id: string } }
  | { type: 'AgentCompleted'; payload: { task_id: string; agent: 'Researcher' | 'Analyst' | 'Writer' } }
  | { type: 'LiteraturePoolUpdated'; payload: { task_id: string; count: number } }
  | { type: 'DraftGenerated'; payload: { task_id: string } }
  | { type: 'TaskCompleted'; payload: { task_id: string } }
  | { type: 'TaskFailed'; payload: { task_id: string; error: string } };
