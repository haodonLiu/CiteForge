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

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  spacing: ThemeSpacing;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  card: string;
  text_primary: string;
  text_secondary: string;
  text_muted: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  highlight: string;
  selection: string;
  link: string;
  code_background: string;
}

export interface ThemeFonts {
  sans_serif: string;
  serif: string;
  monospace: string;
  size_base: number;
  line_height: number;
}

export interface ThemeSpacing {
  unit: number;
  radius: number;
  gap: number;
}

export interface Document {
  id: string;
  title: string;
  file_path?: string;
  content?: string;
  read_status: 'Unread' | 'Reading' | 'Read' | 'ToRead' | 'Archived';
  read_progress: number;
  created_at: string;
  updated_at: string;
}

export interface Annotation {
  id: string;
  document_id: string;
  page_number: number;
  annotation_type: 'Highlight' | 'Underline' | 'Note' | 'Stamp';
  content?: string;
  color: string;
  position: Position;
  created_at: string;
}

export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
  page_width: number;
  page_height: number;
}

export interface Literature {
  id: string;
  title: string;
  authors: Author[];
  abstract_text?: string;
  doi?: string;
  year?: number;
  venue?: string;
  tags: string[];
  categories: string[];
  citation_count?: number;
  file_path?: string;
  source: string;
  imported_at: string;
  read_progress: number;
  read_status: 'Unread' | 'Reading' | 'Read' | 'ToRead' | 'Archived';
}

export interface Author {
  name: string;
  orcid?: string;
  affiliation?: string;
}

export interface AgentPersonality {
  id: string;
  name: string;
  description: string;
  traits: PersonalityTraits;
  interaction_style: InteractionStyle;
  system_prompt: string;
}

export interface PersonalityTraits {
  directness: number;
  humor: number;
  curiosity: number;
  criticalness: number;
  patience: number;
  creativity: number;
}

export interface InteractionStyle {
  proactive_questions: boolean;
  challenge_assumptions: boolean;
  suggest_alternatives: boolean;
  use_analogies: boolean;
  cite_sources: boolean;
}
