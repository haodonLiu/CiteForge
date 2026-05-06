use async_trait::async_trait;
use citeforge_core::ports::{DocumentParser, ParserError, ParsedDocument, Page};
use citeforge_core::value_object::DocumentMetadata;
use lopdf::Document;

#[derive(Debug)]
pub enum ParseWarning {
    MetadataMissing { field: String },
    TextExtractionPartial { page: usize, reason: String },
    CorruptedPageSkipped { page: usize },
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
}
