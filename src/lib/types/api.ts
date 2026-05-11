// API response types from Rust backend - uses snake_case to match Rust JSON serialization

export interface ApiTaskDto {
  id: string;
  topic: string;
  status: string;
}

export interface ApiRunTaskRequest {
  topic: string;
  pdf_paths: string[];
}

export interface ApiTaskStatusResponse {
  task_id: string;
  status: string;
  progress: number;
}

export interface ApiLiterature {
  id: string;
  title: string;
  // Backend sends string[] but we also accept ApiAuthor[] for compatibility
  authors: ApiAuthor[] | string[];
  abstract_text?: string;
  doi?: string;
  year?: number;
  venue?: string;
  tags?: string[];
  categories?: string[];
  citation_count?: number;
  file_path?: string;
  source: string;
  // Backend uses created_at, frontend expects imported_at
  imported_at?: string;
  created_at?: string;
  read_progress?: number;
  read_status?: 'Unread' | 'Reading' | 'Read' | 'ToRead' | 'Archived';
}

export interface ApiAuthor {
  name: string;
  orcid?: string;
  affiliation?: string;
}

export interface ApiDocument {
  id: string;
  title: string;
  file_path?: string;
  content?: string;
  read_status: 'Unread' | 'Reading' | 'Read' | 'ToRead' | 'Archived';
  read_progress: number;
  created_at: string;
  updated_at: string;
}

export interface ApiAnnotation {
  id: string;
  document_id: string;
  page_number: number;
  annotation_type: 'Highlight' | 'Underline' | 'Note' | 'Stamp';
  content?: string;
  color: string;
  position: ApiPosition;
  created_at: string;
}

export interface ApiPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  page_width: number;
  page_height: number;
}

export interface ApiLlmConfig {
  provider: 'OpenAI' | 'Anthropic' | 'Ollama';
  base_url: string;
  api_key: string | undefined;
  model: string;
  timeout_secs: number | undefined;
}

export interface ApiChromaConfig {
  url: string;
  collection: string;
  embedding_dimension: number;
}

export interface ApiFontSettings {
  font_family: string;
  font_size: number;
  line_height: number;
}

export interface ApiAppSettings {
  llm: ApiLlmConfig;
  chroma: ApiChromaConfig;
  font?: ApiFontSettings;
}

export interface ApiTextIndexEntry {
  page: number;
  text: string;
  bbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ApiOutlineEntry {
  title: string;
  page: number;
  level: number;
}

export interface ApiTaskEvent {
  id: string;
  source: string;
  event_type: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface ApiPaperStructure {
  title: string;
  abstract_node: ApiSectionNode | null;
  sections: ApiSectionNode[];
  total_pages: number;
  bibliography_start_page?: number;
}

export interface ApiSectionNode {
  id: string;
  title: string;
  level: number;
  page_start: number;
  page_end: number;
  section_type: string;
  paragraphs: ApiParagraph[];
}

export interface ApiParagraph {
  text: string;
  page: number;
  font_size?: number;
}

export interface ApiNote {
  id: string;
  task_id?: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ApiNoteLink {
  id: string;
  source_note_id: string;
  target_note_id: string;
  link_type: string;
  created_at: string;
}

export interface ApiReadingProgress {
  literature_id: string;
  task_id: string;
  current_page: number;
  total_pages: number;
  read_percentage: number;
  last_read_at?: string;
}

export interface ApiAgentConversation {
  id: string;
  task_id: string;
  agent_name: string;
  personality_id?: string;
  role: string;
  content: string;
  metadata?: string;
  created_at: string;
}

export interface ApiLiteratureSection {
  id: string;
  literature_id: string;
  section_id: string;
  title: string;
  section_type?: string;
  page_start?: number;
  page_end?: number;
  content_summary?: string;
  extracted_at: string;
}

export interface ApiLiteratureTheme {
  id: string;
  task_id: string;
  name: string;
  description?: string;
  literature_ids: string[];
  created_at: string;
}

export interface ApiLiteratureNote {
  id: string;
  note_id: string;
  literature_id: string;
  page_number?: number;
  section_id?: string;
  selection_text?: string;
  created_at: string;
}

// Search result from Semantic Scholar
export interface ApiSearchResult {
  paper_id: string;
  title: string;
  authors: string[];
  abstract_text?: string;
  year?: number;
  venue?: string;
  citation_count?: number;
  doi?: string;
}

// Request to insert a citation manually or from search
export interface ApiInsertCitationRequest {
  paper_id: string;
  title: string;
  authors: string[];
  abstract_text?: string;
  year?: number;
  venue?: string;
  citation_count?: number;
  doi?: string;
}
