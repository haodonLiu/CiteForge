use lopdf::Document;
use serde::{Deserialize, Serialize};
use crate::parser::{PdfParser, OutlineEntry};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaperStructure {
    pub title: String,
    pub abstract_node: Option<SectionNode>,
    pub sections: Vec<SectionNode>,
    pub total_pages: u32,
    pub bibliography_start_page: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SectionNode {
    pub id: String,
    pub title: String,
    pub level: u8,
    pub page_start: u32,
    pub page_end: u32,
    pub paragraphs: Vec<ParagraphNode>,
    pub section_type: SectionType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParagraphNode {
    pub text: String,
    pub page: u32,
    pub font_size: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SectionType {
    Abstract,
    Introduction,
    RelatedWork,
    Methodology,
    Experiment,
    Discussion,
    Conclusion,
    References,
    Unknown,
}

impl std::fmt::Display for SectionType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Abstract => write!(f, "Abstract"),
            Self::Introduction => write!(f, "Introduction"),
            Self::RelatedWork => write!(f, "Related Work"),
            Self::Methodology => write!(f, "Methodology"),
            Self::Experiment => write!(f, "Experiments"),
            Self::Discussion => write!(f, "Discussion"),
            Self::Conclusion => write!(f, "Conclusion"),
            Self::References => write!(f, "References"),
            Self::Unknown => write!(f, "Unknown"),
        }
    }
}

/// Classify a heading text into a SectionType using keyword matching.
pub fn classify_section(heading: &str) -> SectionType {
    // Strip common prefixes like "■", "●", numbers, etc.
    let cleaned = heading.trim_start_matches(|c: char| c == '■' || c == '●' || c == '◆' || c.is_ascii_digit() || c == '.' || c == ' ');
    let lower = cleaned.to_lowercase();
    let full_lower = heading.to_lowercase();

    // Check for "ABSTRACT:" pattern (with colon)
    if full_lower.starts_with("abstract") || full_lower.starts_with("■ abstract") {
        return SectionType::Abstract;
    }

    // Exact or prefix matches for known section names
    let patterns: &[(&[&str], SectionType)] = &[
        (&["abstract"], SectionType::Abstract),
        (&["introduction", "intro", "1. introduction", "i. introduction",
           "■ introduction"], SectionType::Introduction),
        (&["related work", "background", "prior work", "previous work",
           "2. related work", "2. background"], SectionType::RelatedWork),
        (&["method", "methodology", "methods", "approach", "model",
           "architecture", "framework", "proposed method", "our method",
           "3. method", "3. methodology", "3. approach", "3. model"], SectionType::Methodology),
        (&["experiment", "experiments", "evaluation", "results",
           "empirical", "4. experiment", "4. evaluation", "4. results",
           "computational details", "simulation"], SectionType::Experiment),
        (&["discussion", "analysis", "limitations", "5. discussion",
           "outlook", "perspectives"], SectionType::Discussion),
        (&["conclusion", "conclusions", "summary", "final remarks",
           "6. conclusion", "5. conclusion", "summary points",
           "key conclusions", "concluding remarks"], SectionType::Conclusion),
        (&["references", "bibliography", "citations"], SectionType::References),
    ];

    for (keywords, section_type) in patterns {
        for keyword in *keywords {
            // Exact match or followed by specific delimiters
            if lower == *keyword
                || lower == format!("{}:", keyword)
                || lower == format!("{}. ", keyword)
                || lower.starts_with(&format!("{} ", keyword))
            {
                return section_type.clone();
            }
        }
    }

    SectionType::Unknown
}

/// Extract font sizes from a PDF page by parsing the content stream.
/// Returns a map of (page_num, text_line) -> dominant font size.
fn extract_page_font_sizes(doc: &Document) -> std::collections::HashMap<u32, Vec<(String, f32)>> {
    let mut result = std::collections::HashMap::new();

    for (page_num, &page_id) in doc.get_pages().iter() {
        let page_num = *page_num as u32;
        if let Ok(content) = doc.get_page_content(page_id) {
            let lines = extract_text_with_sizes(&content);
            if !lines.is_empty() {
                result.insert(page_num, lines);
            }
        }
    }

    result
}

/// Parse PDF content stream operators to extract text with font sizes.
/// Looks for Td/Tj operators and the preceding Tf (font) operator.
fn extract_text_with_sizes(content: &[u8]) -> Vec<(String, f32)> {
    let mut lines = Vec::new();
    let mut current_font_size: f32 = 12.0; // default
    let mut current_text = String::new();

    // Parse content stream as string and split into operators
    let content_str = String::from_utf8_lossy(content);
    let tokens: Vec<&str> = content_str.split_whitespace().collect();

    let mut i = 0;
    while i < tokens.len() {
        let token = tokens[i];

        // Font size operator: "F1 12.0 Tf" or "F1 12 Tf"
        if token.ends_with("Tf") && i >= 2 {
            if let Ok(size) = tokens[i - 1].parse::<f32>() {
                current_font_size = size;
            }
        }

        // Text show operator: (text) Tj or [(text)] TJ
        if token == "Tj" && i >= 1 {
            let text = extract_string_content(tokens[i - 1]);
            if !text.trim().is_empty() {
                if !current_text.is_empty() {
                    lines.push((current_text.clone(), current_font_size));
                    current_text.clear();
                }
                current_text = text;
            }
        } else if token == "TJ" && i >= 1 {
            // TJ takes an array: [(text) (more text)] TJ
            let text = extract_tj_array_content(tokens[i - 1]);
            if !text.trim().is_empty() {
                if !current_text.is_empty() {
                    lines.push((current_text.clone(), current_font_size));
                    current_text.clear();
                }
                current_text = text;
            }
        }

        // Line feed / carriage return: move to next line
        if token == "T*" || token == "Td" || token == "TD" {
            if !current_text.trim().is_empty() {
                lines.push((current_text.clone(), current_font_size));
            }
            current_text.clear();
        }

        i += 1;
    }

    // Flush remaining text
    if !current_text.trim().is_empty() {
        lines.push((current_text, current_font_size));
    }

    lines
}

fn extract_string_content(token: &str) -> String {
    // Remove surrounding parentheses: (hello world) -> hello world
    let trimmed = token.trim();
    if trimmed.starts_with('(') && trimmed.ends_with(')') {
        trimmed[1..trimmed.len() - 1].to_string()
    } else {
        trimmed.to_string()
    }
}

fn extract_tj_array_content(token: &str) -> String {
    // Simple extraction from [(text) (more)] format
    let mut result = String::new();
    let trimmed = token.trim();
    if !trimmed.starts_with('[') || !trimmed.ends_with(']') {
        return trimmed.to_string();
    }
    let inner = &trimmed[1..trimmed.len() - 1];
    for part in inner.split(')') {
        let part = part.trim();
        if let Some(start) = part.find('(') {
            let text = &part[start + 1..];
            result.push_str(text);
        }
    }
    result
}

/// Build a PaperStructure from raw PDF bytes.
/// Uses pdf-extract for text extraction (handles ToUnicode CMaps) and
/// lopdf for outline/structure detection (page numbers, heading patterns).
pub fn extract_structure_from_bytes(pdf_bytes: &[u8]) -> Result<PaperStructure, String> {
    let doc = Document::load_mem(pdf_bytes)
        .map_err(|e| format!("failed to parse PDF: {}", e))?;

    let total_pages = doc.get_pages().len() as u32;

    // Use pdf-extract for readable text
    let full_text = pdf_extract::extract_text_from_mem(pdf_bytes)
        .map_err(|e| format!("text extraction failed: {}", e))?;

    // Scan pdf-extract text for headings
    let mut headings: Vec<HeadingCandidate> = Vec::new();

    for (line_idx, line) in full_text.lines().enumerate() {
        let trimmed = line.trim().to_string();
        if trimmed.is_empty() || trimmed.len() < 3 || trimmed.len() > 80 {
            continue;
        }

        // Skip lines that look like body text (contain lowercase after first word)
        let looks_like_body = trimmed.chars().skip(1).any(|c| c.is_lowercase())
            && trimmed.split_whitespace().count() > 4;
        if looks_like_body {
            continue;
        }

        // Skip lines that start with a number (citation refs, equation numbers, etc.)
        if let Some(first_char) = trimmed.chars().next() {
            if first_char.is_ascii_digit() {
                // Lines like "41 revealed that...", "124 (9), 1860" are citations
                continue;
            }
        }

        // Skip lines with citation patterns like "(9), 1860−1861", "DOI:", "e202211387"
        if trimmed.contains("DOI:") || trimmed.contains("doi.org") || trimmed.contains("doi:") {
            continue;
        }
        if trimmed.contains("e20") && trimmed.contains(",") {
            continue;
        }
        if trimmed.starts_with('(') && trimmed.contains(')') && trimmed.contains(',') {
            continue;
        }

        // Skip lines with hyphenated page ranges like "1860−1861" or "10084−10087"
        if trimmed.contains('−') && trimmed.split('−').all(|p| p.trim().chars().all(|c| c.is_ascii_digit() || c == ',' || c == '.')) {
            continue;
        }

        // Detect numbered headings: "1. Introduction", "2.1 Background"
        if let Some((number, _title)) = parse_numbered_heading(&trimmed) {
            let level = number.matches('.').count() as u8 + 1;
            if level <= 3 {
                let est_page = estimate_page_from_line(&full_text, line_idx, total_pages);
                headings.push(HeadingCandidate {
                    text: trimmed,
                    page: est_page,
                    level,
                    font_size: 14.0,
                });
            }
            continue;
        }

        // Detect known section headings (case-insensitive)
        let section_type = classify_section(&trimmed);
        if section_type != SectionType::Unknown {
            let already_has = headings.iter().any(|h| {
                classify_section(&h.text) == section_type
            });
            if !already_has {
                let est_page = estimate_page_from_line(&full_text, line_idx, total_pages);
                headings.push(HeadingCandidate {
                    text: trimmed,
                    page: est_page,
                    level: 1,
                    font_size: 14.0,
                });
            }
        }
    }

    // Sort by page, then deduplicate
    headings.sort_by(|a, b| a.page.cmp(&b.page));
    headings.dedup_by(|a, b| {
        a.page == b.page && a.text.to_lowercase() == b.text.to_lowercase()
    });

    // Build section tree
    let mut sections = Vec::new();
    let mut abstract_node = None;
    let mut current_section_id = 0u32;

    for candidate in &headings {
        let section_type = classify_section(&candidate.text);
        let id = format_section_id(candidate.level, current_section_id);
        current_section_id += 1;

        let is_abstract = section_type == SectionType::Abstract;
        let is_references = section_type == SectionType::References;

        let node = SectionNode {
            id,
            title: candidate.text.clone(),
            level: candidate.level,
            page_start: candidate.page,
            page_end: candidate.page,
            paragraphs: Vec::new(),
            section_type,
        };

        if is_abstract {
            abstract_node = Some(node);
        } else if !is_references {
            sections.push(node);
        }
    }

    // Update page_end for each section
    for i in 0..sections.len() {
        let next_page = if i + 1 < sections.len() {
            sections[i + 1].page_start
        } else {
            total_pages
        };
        sections[i].page_end = next_page;
    }

    // Find bibliography start page
    let bibliography_start_page = headings.iter()
        .find(|h| classify_section(&h.text) == SectionType::References)
        .map(|h| h.page);

    // Extract title: try metadata first, then first heading, then first line
    let title = extract_title_from_text(&full_text, &doc);

    Ok(PaperStructure {
        title,
        abstract_node,
        sections,
        total_pages,
        bibliography_start_page,
    })
}

/// Estimate page number from line position in full text.
fn estimate_page_from_line(full_text: &str, line_idx: usize, total_pages: u32) -> u32 {
    let total_lines = full_text.lines().count();
    if total_lines == 0 {
        return 1;
    }
    (((line_idx as f32 / total_lines as f32) * total_pages as f32).ceil() as u32).max(1)
}

/// Extract title from text or metadata.
fn extract_title_from_text(full_text: &str, doc: &Document) -> String {
    // Try document metadata first
    if let Some(title) = doc.trailer.get(b"Title")
        .ok()
        .and_then(|v| v.as_string().ok())
        .map(|s| s.trim().to_string())
    {
        if !title.is_empty() && title.len() > 5 {
            return title;
        }
    }

    // Fall back to first non-empty line that looks like a title
    for line in full_text.lines().take(10) {
        let trimmed = line.trim();
        if trimmed.len() > 10 && !trimmed.starts_with("Cite") && !trimmed.starts_with("Read Online") {
            return trimmed.to_string();
        }
    }

    "Untitled".to_string()
}

fn extract_title(doc: &Document, headings: &[HeadingCandidate]) -> String {
    // Try document metadata first
    if let Some(title) = doc.trailer.get(b"Title")
        .ok()
        .and_then(|v| v.as_string().ok())
        .map(|s| s.trim().to_string())
    {
        if !title.is_empty() {
            return title;
        }
    }

    // Fall back to first large-font text on page 1
    headings.iter()
        .filter(|h| h.page <= 2)
        .max_by(|a, b| a.font_size.partial_cmp(&b.font_size).unwrap_or(std::cmp::Ordering::Equal))
        .map(|h| h.text.clone())
        .unwrap_or_else(|| "Untitled".to_string())
}

#[derive(Debug)]
struct HeadingCandidate {
    text: String,
    page: u32,
    level: u8,
    font_size: f32,
}

/// Detect heading level based on font size clustering and text patterns.
fn detect_heading_level(
    text: &str,
    font_size: f32,
    _all_sizes: &std::collections::HashMap<u32, Vec<(String, f32)>>,
    _page: u32,
) -> Option<u8> {
    // Numbered heading patterns: "1. Introduction", "2.1 Background", "3.2.1 Details"
    if let Some((number, _title)) = parse_numbered_heading(text) {
        let level = number.matches('.').count() as u8 + 1;
        if level <= 3 {
            return Some(level);
        }
    }

    // All-caps short text: likely a heading
    if text.len() < 50 && text == text.to_uppercase() && text.chars().all(|c| c.is_alphabetic() || c == ' ') {
        return Some(1);
    }

    // Known section headings
    let known_headings = [
        "abstract", "introduction", "related work", "methodology",
        "method", "methods", "experiments", "results", "discussion",
        "conclusion", "conclusions", "references", "acknowledgments",
        "acknowledgements", "appendix", "background", "prior work",
        "evaluation", "analysis", "findings", "summary",
    ];
    let lower = text.to_lowercase();
    for heading in &known_headings {
        if lower == *heading
            || lower.starts_with(&format!("{}:", heading))
            || lower.starts_with(&format!("{}.", heading))
        {
            return Some(if *heading == "abstract" || *heading == "introduction" || *heading == "conclusion" || *heading == "conclusions" {
                1
            } else {
                2
            });
        }
    }

    // Font size heuristic: significantly larger than body text (typically 10-11pt)
    if font_size >= 14.0 && text.len() < 80 {
        return Some(1);
    }
    if font_size >= 12.0 && font_size < 14.0 && text.len() < 80 {
        return Some(2);
    }

    None
}

fn parse_numbered_heading(text: &str) -> Option<(String, String)> {
    let parts: Vec<&str> = text.splitn(2, ' ').collect();
    if parts.len() < 2 {
        return None;
    }
    let number = parts[0].trim_end_matches('.');
    let title = parts[1];

    let mut dots = 0;
    for ch in number.chars() {
        if ch == '.' {
            dots += 1;
            if dots > 2 {
                return None;
            }
        } else if !ch.is_ascii_digit() {
            return None;
        }
    }

    if !title.is_empty() && title.len() > 2 {
        Some((number.to_string(), title.to_string()))
    } else {
        None
    }
}

fn format_section_id(level: u8, index: u32) -> String {
    match level {
        1 => format!("{}", index + 1),
        2 => format!("{}.{}", (index / 10) + 1, (index % 10) + 1),
        _ => format!("{}.{}.{}", (index / 100) + 1, ((index / 10) % 10) + 1, (index % 10) + 1),
    }
}

/// Fallback heading detection using text patterns when font analysis fails.
fn fallback_heading_detection(doc: &Document) -> Vec<HeadingCandidate> {
    let mut headings = Vec::new();

    for (page_num, _) in doc.get_pages().iter() {
        if let Ok(text) = doc.extract_text(&[*page_num]) {
            for line in text.lines() {
                let trimmed = line.trim().to_string();
                if trimmed.is_empty() || trimmed.len() < 3 || trimmed.len() > 100 {
                    continue;
                }

                let lower = trimmed.to_lowercase();

                // Numbered headings
                if let Some((number, _title)) = parse_numbered_heading(&trimmed) {
                    let level = number.matches('.').count() as u8 + 1;
                    if level <= 3 {
                        headings.push(HeadingCandidate {
                            text: trimmed,
                            page: *page_num,
                            level,
                            font_size: 12.0, // unknown
                        });
                        continue;
                    }
                }

                // All-caps
                if trimmed.len() < 50 && trimmed == trimmed.to_uppercase()
                    && trimmed.chars().all(|c| c.is_alphabetic() || c == ' ')
                {
                    headings.push(HeadingCandidate {
                        text: trimmed,
                        page: *page_num,
                        level: 1,
                        font_size: 14.0,
                    });
                    continue;
                }

                // Known headings
                let known = [
                    "abstract", "introduction", "related work", "methodology",
                    "method", "methods", "experiments", "results", "discussion",
                    "conclusion", "conclusions", "references",
                ];
                for heading in &known {
                    if lower == *heading
                        || lower.starts_with(&format!("{}:", heading))
                        || lower.starts_with(&format!("{}.", heading))
                    {
                        headings.push(HeadingCandidate {
                            text: trimmed,
                            page: *page_num,
                            level: if *heading == "abstract" || *heading == "introduction" { 1 } else { 2 },
                            font_size: 12.0,
                        });
                        break;
                    }
                }
            }
        }
    }

    headings
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_classify_section() {
        assert_eq!(classify_section("Abstract"), SectionType::Abstract);
        assert_eq!(classify_section("1. Introduction"), SectionType::Introduction);
        assert_eq!(classify_section("Related Work"), SectionType::RelatedWork);
        assert_eq!(classify_section("3. Methodology"), SectionType::Methodology);
        assert_eq!(classify_section("Method"), SectionType::Methodology);
        assert_eq!(classify_section("Experiments"), SectionType::Experiment);
        assert_eq!(classify_section("5. Conclusion"), SectionType::Conclusion);
        assert_eq!(classify_section("References"), SectionType::References);
        assert_eq!(classify_section("Random Section"), SectionType::Unknown);
    }

    #[test]
    fn test_parse_numbered_heading() {
        assert_eq!(parse_numbered_heading("1. Introduction"), Some(("1".into(), "Introduction".into())));
        assert_eq!(parse_numbered_heading("2.1 Background"), Some(("2.1".into(), "Background".into())));
        assert_eq!(parse_numbered_heading("3.2.1 Details"), Some(("3.2.1".into(), "Details".into())));
        assert!(parse_numbered_heading("Introduction").is_none());
        assert!(parse_numbered_heading("A. Appendix").is_none());
    }

    #[test]
    fn test_format_section_id() {
        assert_eq!(format_section_id(1, 0), "1");
        assert_eq!(format_section_id(2, 0), "1.1");
        assert_eq!(format_section_id(3, 0), "1.1.1");
    }

    #[test]
    #[ignore]
    fn test_extract_structure_real_pdf() {
        let path = "/mnt/c/Users/10954/Desktop/LocalWiki/PhChem1/rethinking-the-terms-π-stacking-and-π-π-stacking-again-a-proposal-to-clarify-the-language-of-aromatic-interactions.pdf";
        let bytes = std::fs::read(path).expect("failed to read PDF");

        let structure = extract_structure_from_bytes(&bytes).expect("structure extraction failed");

        println!("=== Paper Structure ===");
        println!("Title: {}", structure.title);
        println!("Total pages: {}", structure.total_pages);
        println!("Bibliography start: {:?}", structure.bibliography_start_page);

        if let Some(ref abstract_node) = structure.abstract_node {
            println!("\nAbstract (page {}):", abstract_node.page_start);
            println!("  {}", abstract_node.title);
        }

        println!("\nSections ({}):", structure.sections.len());
        for section in &structure.sections {
            let indent = "  ".repeat((section.level - 1) as usize);
            println!("{}[{}] {} (p.{}-{}) {}",
                indent, section.id, section.title,
                section.page_start, section.page_end, section.section_type);
        }

        // Basic assertions
        assert!(!structure.sections.is_empty(), "should find at least one section");
        assert!(structure.total_pages > 0, "should have pages");
        assert!(structure.title != "Untitled", "should detect title");
    }
}
