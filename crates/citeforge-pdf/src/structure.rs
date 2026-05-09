use lopdf::Document;
use serde::{Deserialize, Serialize};

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
    let cleaned = heading.trim_start_matches(|c: char| {
        c == '■' || c == '●' || c == '◆' || c.is_ascii_digit() || c == '.' || c == ' '
    });
    let lower = cleaned.to_lowercase();
    let full_lower = heading.to_lowercase();

    // Check for "ABSTRACT:" pattern (with colon)
    if full_lower.starts_with("abstract") || full_lower.starts_with("■ abstract") {
        return SectionType::Abstract;
    }

    // Exact or prefix matches for known section names
    let patterns: &[(&[&str], SectionType)] = &[
        (&["abstract"], SectionType::Abstract),
        (
            &[
                "introduction",
                "intro",
                "1. introduction",
                "i. introduction",
                "■ introduction",
            ],
            SectionType::Introduction,
        ),
        (
            &[
                "related work",
                "background",
                "prior work",
                "previous work",
                "2. related work",
                "2. background",
            ],
            SectionType::RelatedWork,
        ),
        (
            &[
                "method",
                "methodology",
                "methods",
                "approach",
                "model",
                "architecture",
                "framework",
                "proposed method",
                "our method",
                "3. method",
                "3. methodology",
                "3. approach",
                "3. model",
            ],
            SectionType::Methodology,
        ),
        (
            &[
                "experiment",
                "experiments",
                "evaluation",
                "results",
                "empirical",
                "4. experiment",
                "4. evaluation",
                "4. results",
                "computational details",
                "simulation",
            ],
            SectionType::Experiment,
        ),
        (
            &[
                "discussion",
                "analysis",
                "limitations",
                "5. discussion",
                "outlook",
                "perspectives",
            ],
            SectionType::Discussion,
        ),
        (
            &[
                "conclusion",
                "conclusions",
                "summary",
                "final remarks",
                "6. conclusion",
                "5. conclusion",
                "summary points",
                "key conclusions",
                "concluding remarks",
            ],
            SectionType::Conclusion,
        ),
        (
            &["references", "bibliography", "citations"],
            SectionType::References,
        ),
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

/// Build a PaperStructure from raw PDF bytes.
/// Uses pdf-extract for text extraction (handles ToUnicode CMaps) and
/// lopdf for outline/structure detection (page numbers, heading patterns).
pub fn extract_structure_from_bytes(pdf_bytes: &[u8]) -> Result<PaperStructure, String> {
    let doc = Document::load_mem(pdf_bytes).map_err(|e| format!("failed to parse PDF: {}", e))?;

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
        if trimmed.contains('−')
            && trimmed.split('−').all(|p| {
                p.trim()
                    .chars()
                    .all(|c| c.is_ascii_digit() || c == ',' || c == '.')
            })
        {
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
                });
            }
            continue;
        }

        // Detect known section headings (case-insensitive)
        let section_type = classify_section(&trimmed);
        if section_type != SectionType::Unknown {
            let already_has = headings
                .iter()
                .any(|h| classify_section(&h.text) == section_type);
            if !already_has {
                let est_page = estimate_page_from_line(&full_text, line_idx, total_pages);
                headings.push(HeadingCandidate {
                    text: trimmed,
                    page: est_page,
                    level: 1,
                });
            }
        }
    }

    // Sort by page, then deduplicate
    headings.sort_by_key(|a| a.page);
    headings.dedup_by(|a, b| a.page == b.page && a.text.to_lowercase() == b.text.to_lowercase());

    // Build section tree
    let mut sections = Vec::new();
    let mut abstract_node = None;

    for (current_section_id, candidate) in headings.iter().enumerate() {
        let section_type = classify_section(&candidate.text);
        let id = format_section_id(candidate.level, current_section_id as u32);

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
    let bibliography_start_page = headings
        .iter()
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

#[derive(Debug)]
struct HeadingCandidate {
    text: String,
    page: u32,
    level: u8,
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
    if let Some(title) = doc
        .trailer
        .get(b"Title")
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
        if trimmed.len() > 10 && !trimmed.starts_with("Cite") && !trimmed.starts_with("Read Online")
        {
            return trimmed.to_string();
        }
    }

    "Untitled".to_string()
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
        _ => format!(
            "{}.{}.{}",
            (index / 100) + 1,
            ((index / 10) % 10) + 1,
            (index % 10) + 1
        ),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_classify_section() {
        assert_eq!(classify_section("Abstract"), SectionType::Abstract);
        assert_eq!(
            classify_section("1. Introduction"),
            SectionType::Introduction
        );
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
        assert_eq!(
            parse_numbered_heading("1. Introduction"),
            Some(("1".into(), "Introduction".into()))
        );
        assert_eq!(
            parse_numbered_heading("2.1 Background"),
            Some(("2.1".into(), "Background".into()))
        );
        assert_eq!(
            parse_numbered_heading("3.2.1 Details"),
            Some(("3.2.1".into(), "Details".into()))
        );
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
        println!(
            "Bibliography start: {:?}",
            structure.bibliography_start_page
        );

        if let Some(ref abstract_node) = structure.abstract_node {
            println!("\nAbstract (page {}):", abstract_node.page_start);
            println!("  {}", abstract_node.title);
        }

        println!("\nSections ({}):", structure.sections.len());
        for section in &structure.sections {
            let indent = "  ".repeat((section.level - 1) as usize);
            println!(
                "{}[{}] {} (p.{}-{}) {}",
                indent,
                section.id,
                section.title,
                section.page_start,
                section.page_end,
                section.section_type
            );
        }

        // Basic assertions
        assert!(
            !structure.sections.is_empty(),
            "should find at least one section"
        );
        assert!(structure.total_pages > 0, "should have pages");
        assert!(structure.title != "Untitled", "should detect title");
    }
}
