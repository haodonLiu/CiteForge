use crate::theme::Theme;
use std::collections::HashMap;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ThemeError {
    #[error("Theme not found: {0}")]
    NotFound(String),
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
}

pub struct ThemeManager {
    themes: HashMap<String, Theme>,
    current_theme_id: String,
}

impl Default for ThemeManager {
    fn default() -> Self {
        Self::new()
    }
}

impl ThemeManager {
    pub fn new() -> Self {
        let mut manager = Self {
            themes: HashMap::new(),
            current_theme_id: "midnight_scholar".to_string(),
        };
        manager.load_presets();
        manager
    }

    fn load_presets(&mut self) {
        let presets = crate::presets::all_presets();
        for theme in presets {
            self.themes.insert(theme.id.clone(), theme);
        }
    }

    pub fn current_theme(&self) -> Result<&Theme, ThemeError> {
        self.themes
            .get(&self.current_theme_id)
            .ok_or_else(|| ThemeError::NotFound(self.current_theme_id.clone()))
    }

    pub fn set_theme(&mut self, theme_id: &str) -> Result<(), ThemeError> {
        if self.themes.contains_key(theme_id) {
            self.current_theme_id = theme_id.to_string();
            Ok(())
        } else {
            Err(ThemeError::NotFound(theme_id.to_string()))
        }
    }

    pub fn list_themes(&self) -> Vec<&Theme> {
        self.themes.values().collect()
    }

    pub fn add_theme(&mut self, theme: Theme) {
        self.themes.insert(theme.id.clone(), theme);
    }

    pub fn export_theme(&self, theme_id: &str) -> Result<String, ThemeError> {
        let theme = self
            .themes
            .get(theme_id)
            .ok_or_else(|| ThemeError::NotFound(theme_id.to_string()))?;
        Ok(serde_json::to_string_pretty(theme)?)
    }

    pub fn import_theme(&mut self, json: &str) -> Result<(), ThemeError> {
        let theme: Theme = serde_json::from_str(json)?;
        self.add_theme(theme);
        Ok(())
    }
}
