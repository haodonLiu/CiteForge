// Frontend domain types - uses camelCase for internal consistency
// API to Domain mappers
export function mapApiTask(api) {
    return {
        id: api.id,
        topic: api.topic,
        status: api.status,
    };
}
export function mapApiLiterature(api) {
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
export function mapApiAuthor(api) {
    return {
        name: api.name,
        orcid: api.orcid,
        affiliation: api.affiliation,
    };
}
export function mapApiDocument(api) {
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
export function mapApiAnnotation(api) {
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
export function mapApiPosition(api) {
    return {
        x: api.x,
        y: api.y,
        width: api.width,
        height: api.height,
        pageWidth: api.page_width,
        pageHeight: api.page_height,
    };
}
export function mapApiLlmConfig(api) {
    return {
        provider: api.provider,
        baseUrl: api.base_url,
        apiKey: api.api_key,
        model: api.model,
        timeoutSecs: api.timeout_secs,
    };
}
export function mapApiChromaConfig(api) {
    return {
        url: api.url,
        collection: api.collection,
        embeddingDimension: api.embedding_dimension,
    };
}
export function mapApiFontSettings(api) {
    return {
        fontFamily: api.font_family,
        fontSize: api.font_size,
        lineHeight: api.line_height,
    };
}
export function mapApiAppSettings(api) {
    return {
        llm: mapApiLlmConfig(api.llm),
        chroma: mapApiChromaConfig(api.chroma),
        font: api.font ? mapApiFontSettings(api.font) : undefined,
    };
}
export function mapApiTextIndexEntry(api) {
    return {
        page: api.page,
        text: api.text,
        bbox: api.bbox,
    };
}
export function mapApiOutlineEntry(api) {
    return {
        title: api.title,
        page: api.page,
        level: api.level,
    };
}
export function mapApiTaskEvent(api) {
    return {
        id: api.id,
        source: api.source,
        eventType: api.event_type,
        timestamp: api.timestamp,
        payload: api.payload,
    };
}
export function mapApiPaperStructure(api) {
    return {
        title: api.title,
        abstractNode: api.abstract_node ? mapApiSectionNode(api.abstract_node) : null,
        sections: api.sections.map(mapApiSectionNode),
        totalPages: api.total_pages,
        bibliographyStartPage: api.bibliography_start_page,
    };
}
export function mapApiSectionNode(api) {
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
export function mapApiParagraph(api) {
    return {
        text: api.text,
        page: api.page,
        fontSize: api.font_size,
    };
}
// API to Domain mappers for new types
export function mapApiNote(api) {
    return {
        id: api.id,
        taskId: api.task_id,
        title: api.title,
        content: api.content,
        createdAt: api.created_at,
        updatedAt: api.updated_at,
    };
}
export function mapApiNoteLink(api) {
    return {
        id: api.id,
        sourceNoteId: api.source_note_id,
        targetNoteId: api.target_note_id,
        linkType: api.link_type,
        createdAt: api.created_at,
    };
}
export function mapApiReadingProgress(api) {
    return {
        literatureId: api.literature_id,
        taskId: api.task_id,
        currentPage: api.current_page,
        totalPages: api.total_pages,
        readPercentage: api.read_percentage,
        lastReadAt: api.last_read_at,
    };
}
export function mapApiAgentConversation(api) {
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
export function mapApiLiteratureSection(api) {
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
export function mapApiLiteratureTheme(api) {
    return {
        id: api.id,
        taskId: api.task_id,
        name: api.name,
        description: api.description,
        literatureIds: api.literature_ids,
        createdAt: api.created_at,
    };
}
export function mapApiLiteratureNote(api) {
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
