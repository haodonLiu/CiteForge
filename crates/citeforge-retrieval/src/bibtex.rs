use citeforge_core::entity::LiteratureEntry;

pub struct BibtexExporter;

impl BibtexExporter {
    pub fn export(entries: &[LiteratureEntry]) -> String {
        let mut output = String::new();

        for entry in entries {
            let entry_type = if entry.doi.is_some() {
                "article"
            } else {
                "misc"
            };
            let key = entry
                .doi
                .as_ref()
                .or(entry.authors.first())
                .map(|s| s.split_whitespace().last().unwrap_or("unknown"))
                .unwrap_or("unknown");

            output.push_str(&format!("@{}{{{},\n", entry_type, key));
            output.push_str(&format!("  title = {{{}}},\n", entry.title));

            if !entry.authors.is_empty() {
                output.push_str(&format!(
                    "  author = {{{}}},\n",
                    entry.authors.join(" and ")
                ));
            }

            if let Some(year) = entry.year {
                output.push_str(&format!("  year = {{{}}},\n", year));
            }

            if let Some(doi) = &entry.doi {
                output.push_str(&format!("  doi = {{{}}},\n", doi));
            }

            if let Some(venue) = &entry.venue {
                output.push_str(&format!("  journal = {{{}}},\n", venue));
            }

            if let Some(citation_count) = entry.citation_count {
                output.push_str(&format!("  note = {{Citations: {}}},\n", citation_count));
            }

            output.push_str("}\n\n");
        }

        output
    }
}
