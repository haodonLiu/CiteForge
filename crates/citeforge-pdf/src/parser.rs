use async_trait::async_trait;
use citeforge_core::ports::{DocumentParser, ParserError, ParsedDocument, Page};
use citeforge_core::value_object::DocumentMetadata;
use lopdf::Document;
use serde::{Deserialize, Serialize};

#[derive(Debug)]
pub enum ParseWarning {
    MetadataMissing { field: String },
    TextExtractionPartial { page: usize, reason: String },
    CorruptedPageSkipped { page: usize },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextIndexEntry {
    pub page: usize,
    pub text: String,
    pub bbox: Option<BBox>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BBox {
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutlineEntry {
    pub title: String,
    pub page: usize,
    pub level: u8,
}

pub struct PdfParser;

#[async_trait]
impl DocumentParser for PdfParser {
    async fn parse(&self, bytes: &[u8]) -> Result<ParsedDocument, ParserError> {
        let doc = Document::load_mem(bytes)
            .map_err(|e| ParserError::ParseError(e.to_string()))?;

        let mut warnings = Vec::new();
        let mut pages = Vec::new();

        for (page_num, _) in doc.get_pages().iter() {
            match doc.extract_text(&[*page_num]) {
                Ok(text) if !text.is_empty() => {
                    pages.push(Page { number: *page_num as usize, text });
                }
                Ok(_) => {
                    warnings.push(ParseWarning::TextExtractionPartial {
                        page: *page_num as usize,
                        reason: "empty text".to_string(),
                    });
                }
                Err(_e) => {
                    warnings.push(ParseWarning::CorruptedPageSkipped {
                        page: *page_num as usize,
                    });
                }
            }
        }

        let metadata = self.extract_metadata(&doc).unwrap_or_else(|| {
            warnings.push(ParseWarning::MetadataMissing { field: "all".to_string() });
            DocumentMetadata::default()
        });

        Ok(ParsedDocument { pages, metadata })
    }
}

impl PdfParser {
    fn extract_metadata(&self, doc: &Document) -> Option<DocumentMetadata> {
        let title = doc.trailer.get(b"Title")
            .ok()
            .and_then(|v| v.as_string().ok())
            .map(|s| s.into_owned());

        Some(DocumentMetadata {
            title,
            authors: Vec::new(),
            doi: None,
            year: None,
            venue: None,
        })
    }

    /// 生成文本索引（用于快速搜索）
    pub fn generate_text_index(&self, doc: &Document) -> Vec<TextIndexEntry> {
        let mut index = Vec::new();

        for (page_num, _) in doc.get_pages().iter() {
            if let Ok(text) = doc.extract_text(&[*page_num]) {
                if text.is_empty() {
                    continue;
                }

                // 按段落分割文本
                for paragraph in text.lines() {
                    let trimmed = paragraph.trim();
                    if trimmed.is_empty() || trimmed.len() < 10 {
                        continue;
                    }

                    index.push(TextIndexEntry {
                        page: *page_num as usize,
                        text: trimmed.to_string(),
                        bbox: None, // lopdf 无法直接获取 bbox，后续可升级
                    });
                }
            }
        }

        index
    }

    /// 生成目录大纲（基于文本模式检测标题）
    pub fn generate_outline(&self, doc: &Document) -> Vec<OutlineEntry> {
        let mut outline = Vec::new();
        let mut seen_titles = std::collections::HashSet::new();

        for (page_num, _) in doc.get_pages().iter() {
            if let Ok(text) = doc.extract_text(&[*page_num]) {
                for line in text.lines() {
                    let trimmed = line.trim();
                    if trimmed.is_empty() {
                        continue;
                    }

                    // 检测标题模式
                    if let Some(entry) = self.detect_heading(trimmed, *page_num as usize) {
                        // 去重（同一标题可能出现多次）
                        let key = format!("{}:{}", entry.title, entry.page);
                        if seen_titles.insert(key) {
                            outline.push(entry);
                        }
                    }
                }
            }
        }

        outline
    }

    fn detect_heading(&self, text: &str, page: usize) -> Option<OutlineEntry> {
        let text = text.trim();

        // 跳过太短或太长的文本
        if text.len() < 3 || text.len() > 100 {
            return None;
        }

        // 检测数字编号标题：1. Introduction, 2.1 Background, 10.1.2 Details
        if let Some((number, title)) = parse_numbered_heading(text) {
            let level = number.matches('.').count() as u8 + 1;
            if level <= 3 {
                return Some(OutlineEntry {
                    title: format!("{}. {}", number, title),
                    page,
                    level,
                });
            }
        }

        // 检测全大写标题：INTRODUCTION, RELATED WORK
        if text.len() < 50 && text == text.to_uppercase() && text.chars().all(|c| c.is_alphabetic() || c == ' ') {
            return Some(OutlineEntry {
                title: text.to_string(),
                page,
                level: 1,
            });
        }

        // 检测 Abstract, Keywords 等固定标题
        let known_headings = [
            "abstract", "introduction", "related work", "methodology",
            "method", "methods", "experiments", "results", "discussion",
            "conclusion", "conclusions", "references", "acknowledgments",
            "acknowledgements", "appendix", "background", "prior work",
            "evaluation", "analysis", "findings", "summary",
        ];

        let lower = text.to_lowercase();
        for heading in &known_headings {
            if lower == *heading || lower.starts_with(&format!("{}:", heading)) || lower.starts_with(&format!("{}.", heading)) {
                return Some(OutlineEntry {
                    title: text.to_string(),
                    page,
                    level: if *heading == "abstract" || *heading == "introduction" || *heading == "conclusion" || *heading == "conclusions" {
                        1
                    } else {
                        2
                    },
                });
            }
        }

        None
    }
}

fn parse_numbered_heading(text: &str) -> Option<(String, String)> {
    // 解析 "1. Introduction" 或 "2.1 Background" 格式
    let parts: Vec<&str> = text.splitn(2, ' ').collect();
    if parts.len() < 2 {
        return None;
    }

    let number = parts[0];
    let title = parts[1];

    // 验证 number 是有效的编号格式（如 "1", "2.1", "10.1.2"）
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
