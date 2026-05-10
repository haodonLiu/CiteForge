// Frontend domain types - uses camelCase for internal consistency

import type {
  ApiTaskDto,
  ApiLiterature,
  ApiDocument,
  ApiAnnotation,
  ApiPosition,
  ApiAuthor,
  ApiLlmConfig,
  ApiChromaConfig,
  ApiFontSettings,
  ApiAppSettings,
  ApiTextIndexEntry,
  ApiOutlineEntry,
  ApiTaskEvent,
  ApiPaperStructure,
  ApiSectionNode,
  ApiParagraph,
  ApiNote,
  ApiNoteLink,
  ApiReadingProgress,
  ApiAgentConversation,
  ApiLiteratureSection,
  ApiLiteratureTheme,
  ApiLiteratureNote,
} from './api';

export type TaskState =
  | 'Pending'
  | 'Researching'
  | 'Analyzing'
  | 'Writing'
  | 'AnalyzingAndWriting'
  | 'Completed'
  | 'Failed';

export interface Task {
  id: string;
  topic: string;
  status: TaskState;
  progress?: number;
  lastAction?: string;
  error?: string;
}

// Domain literature with camelCase
export interface Literature {
  id: string;
  title: string;
  authors: Author[];
  abstractText?: string;
  doi?: string;
  year?: number;
  venue?: string;
  tags: string[];
  categories: string[];
  citationCount?: number;
  filePath?: string;
  source: string;
  importedAt: string;
  readProgress: number;
  readStatus: 'Unread' | 'Reading' | 'Read' | 'ToRead' | 'Archived';
}

export interface Author {
  name: string;
  orcid?: string;
  affiliation?: string;
}

export interface Document {
  id: string;
  title: string;
  filePath?: string;
  content?: string;
  readStatus: 'Unread' | 'Reading' | 'Read' | 'ToRead' | 'Archived';
  readProgress: number;
  createdAt: string;
  updatedAt: string;
}

export interface Annotation {
  id: string;
  documentId: string;
  pageNumber: number;
  annotationType: 'Highlight' | 'Underline' | 'Note' | 'Stamp';
  content?: string;
  color: string;
  position: Position;
  createdAt: string;
}

export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
  pageWidth: number;
  pageHeight: number;
}

export interface AgentPersonality {
  id: string;
  name: string;
  description: string;
  traits: PersonalityTraits;
  interactionStyle: InteractionStyle;
  systemPrompt: string;
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
  proactiveQuestions: boolean;
  challengeAssumptions: boolean;
  suggestAlternatives: boolean;
  useAnalogies: boolean;
  citeSources: boolean;
}

export interface LlmConfig {
  provider: 'OpenAI' | 'Anthropic' | 'Ollama';
  baseUrl: string;
  apiKey: string | undefined;
  model: string;
  timeoutSecs: number | undefined;
}

export interface ChromaConfig {
  url: string;
  collection: string;
  embeddingDimension: number;
}

export interface FontSettings {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
}

export interface AppSettings {
  llm: LlmConfig;
  chroma: ChromaConfig;
  font?: FontSettings;
}

export interface TextIndexEntry {
  page: number;
  text: string;
  bbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface OutlineEntry {
  title: string;
  page: number;
  level: number;
}

export interface TaskEvent {
  id: string;
  source: string;
  eventType: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface PaperStructure {
  title: string;
  abstractNode: SectionNode | null;
  sections: SectionNode[];
  totalPages: number;
  bibliographyStartPage?: number;
}

export interface SectionNode {
  id: string;
  title: string;
  level: number;
  pageStart: number;
  pageEnd: number;
  sectionType: string;
  paragraphs: Paragraph[];
}

export interface Paragraph {
  text: string;
  page: number;
  fontSize?: number;
}

// API to Domain mappers
export function mapApiTask(api: ApiTaskDto): Task {
  return {
    id: api.id,
    topic: api.topic,
    status: api.status as TaskState,
  };
}

export function mapApiLiterature(api: ApiLiterature): Literature {
  return {
    id: api.id,
    title: api.title,
    authors: api.authors.map(mapApiAuthor),
    abstractText: api.abstract_text,
    doi: api.doi,
    year: api.year,
    venue: api.venue,
    tags: api.tags,
    categories: api.categories,
    citationCount: api.citation_count,
    filePath: api.file_path,
    source: api.source,
    importedAt: api.imported_at,
    readProgress: api.read_progress,
    readStatus: api.read_status,
  };
}

export function mapApiAuthor(api: ApiAuthor): Author {
  return {
    name: api.name,
    orcid: api.orcid,
    affiliation: api.affiliation,
  };
}

export function mapApiDocument(api: ApiDocument): Document {
  return {
    id: api.id,
    title: api.title,
    filePath: api.file_path,
    content: api.content,
    readStatus: api.read_status,
    readProgress: api.read_progress,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function mapApiAnnotation(api: ApiAnnotation): Annotation {
  return {
    id: api.id,
    documentId: api.document_id,
    pageNumber: api.page_number,
    annotationType: api.annotation_type,
    content: api.content,
    color: api.color,
    position: mapApiPosition(api.position),
    createdAt: api.created_at,
  };
}

export function mapApiPosition(api: ApiPosition): Position {
  return {
    x: api.x,
    y: api.y,
    width: api.width,
    height: api.height,
    pageWidth: api.page_width,
    pageHeight: api.page_height,
  };
}

export function mapApiLlmConfig(api: ApiLlmConfig): LlmConfig {
  return {
    provider: api.provider,
    baseUrl: api.base_url,
    apiKey: api.api_key,
    model: api.model,
    timeoutSecs: api.timeout_secs,
  };
}

export function mapApiChromaConfig(api: ApiChromaConfig): ChromaConfig {
  return {
    url: api.url,
    collection: api.collection,
    embeddingDimension: api.embedding_dimension,
  };
}

export function mapApiFontSettings(api: ApiFontSettings): FontSettings {
  return {
    fontFamily: api.font_family,
    fontSize: api.font_size,
    lineHeight: api.line_height,
  };
}

export function mapApiAppSettings(api: ApiAppSettings): AppSettings {
  return {
    llm: mapApiLlmConfig(api.llm),
    chroma: mapApiChromaConfig(api.chroma),
    font: api.font ? mapApiFontSettings(api.font) : undefined,
  };
}

export function mapApiTextIndexEntry(api: ApiTextIndexEntry): TextIndexEntry {
  return {
    page: api.page,
    text: api.text,
    bbox: api.bbox,
  };
}

export function mapApiOutlineEntry(api: ApiOutlineEntry): OutlineEntry {
  return {
    title: api.title,
    page: api.page,
    level: api.level,
  };
}

export function mapApiTaskEvent(api: ApiTaskEvent): TaskEvent {
  return {
    id: api.id,
    source: api.source,
    eventType: api.event_type,
    timestamp: api.timestamp,
    payload: api.payload,
  };
}

export function mapApiPaperStructure(api: ApiPaperStructure): PaperStructure {
  return {
    title: api.title,
    abstractNode: api.abstract_node ? mapApiSectionNode(api.abstract_node) : null,
    sections: api.sections.map(mapApiSectionNode),
    totalPages: api.total_pages,
    bibliographyStartPage: api.bibliography_start_page,
  };
}

export function mapApiSectionNode(api: ApiSectionNode): SectionNode {
  return {
    id: api.id,
    title: api.title,
    level: api.level,
    pageStart: api.page_start,
    pageEnd: api.page_end,
    sectionType: api.section_type,
    paragraphs: api.paragraphs.map(mapApiParagraph),
  };
}

export function mapApiParagraph(api: ApiParagraph): Paragraph {
  return {
    text: api.text,
    page: api.page,
    fontSize: api.font_size,
  };
}

// ===================== NOTES =====================

export interface Note {
  id: string;
  taskId?: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteLink {
  id: string;
  sourceNoteId: string;
  targetNoteId: string;
  linkType: string;
  createdAt: string;
}

export interface ReadingProgress {
  literatureId: string;
  taskId: string;
  currentPage: number;
  totalPages: number;
  readPercentage: number;
  lastReadAt?: string;
}

export interface AgentConversation {
  id: string;
  taskId: string;
  agentName: string;
  personalityId?: string;
  role: string;
  content: string;
  metadata?: string;
  createdAt: string;
}

export interface LiteratureSection {
  id: string;
  literatureId: string;
  sectionId: string;
  title: string;
  sectionType?: string;
  pageStart?: number;
  pageEnd?: number;
  contentSummary?: string;
  extractedAt: string;
}

export interface LiteratureTheme {
  id: string;
  taskId: string;
  name: string;
  description?: string;
  literatureIds: string[];
  createdAt: string;
}

export interface LiteratureNote {
  id: string;
  noteId: string;
  literatureId: string;
  pageNumber?: number;
  sectionId?: string;
  selectionText?: string;
  createdAt: string;
}

// API to Domain mappers for new types
export function mapApiNote(api: ApiNote): Note {
  return {
    id: api.id,
    taskId: api.task_id,
    title: api.title,
    content: api.content,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function mapApiNoteLink(api: ApiNoteLink): NoteLink {
  return {
    id: api.id,
    sourceNoteId: api.source_note_id,
    targetNoteId: api.target_note_id,
    linkType: api.link_type,
    createdAt: api.created_at,
  };
}

export function mapApiReadingProgress(api: ApiReadingProgress): ReadingProgress {
  return {
    literatureId: api.literature_id,
    taskId: api.task_id,
    currentPage: api.current_page,
    totalPages: api.total_pages,
    readPercentage: api.read_percentage,
    lastReadAt: api.last_read_at,
  };
}

export function mapApiAgentConversation(api: ApiAgentConversation): AgentConversation {
  return {
    id: api.id,
    taskId: api.task_id,
    agentName: api.agent_name,
    personalityId: api.personality_id,
    role: api.role,
    content: api.content,
    metadata: api.metadata,
    createdAt: api.created_at,
  };
}

export function mapApiLiteratureSection(api: ApiLiteratureSection): LiteratureSection {
  return {
    id: api.id,
    literatureId: api.literature_id,
    sectionId: api.section_id,
    title: api.title,
    sectionType: api.section_type,
    pageStart: api.page_start,
    pageEnd: api.page_end,
    contentSummary: api.content_summary,
    extractedAt: api.extracted_at,
  };
}

export function mapApiLiteratureTheme(api: ApiLiteratureTheme): LiteratureTheme {
  return {
    id: api.id,
    taskId: api.task_id,
    name: api.name,
    description: api.description,
    literatureIds: api.literature_ids,
    createdAt: api.created_at,
  };
}

export function mapApiLiteratureNote(api: ApiLiteratureNote): LiteratureNote {
  return {
    id: api.id,
    noteId: api.note_id,
    literatureId: api.literature_id,
    pageNumber: api.page_number,
    sectionId: api.section_id,
    selectionText: api.selection_text,
    createdAt: api.created_at,
  };
}
