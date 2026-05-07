use crate::theme::Theme;
use std::collections::HashMap;
use std::path::PathBuf;

pub struct ThemeManager {
    themes: HashMap<String, Theme>,
    current_theme_id: String,
    #[allow(dead_code)]
    config_dir: PathBuf,
}

impl ThemeManager {
    pub fn new(config_dir: PathBuf) -> Self {
        let mut manager = Self {
            themes: HashMap::new(),
            current_theme_id: "midnight_scholar".to_string(),
            config_dir,
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

    pub fn current_theme(&self) -> &Theme {
        self.themes.get(&self.current_theme_id).unwrap()
    }

    pub fn set_theme(&mut self, theme_id: &str) -> Result<(), String> {
        if self.themes.contains_key(theme_id) {
            self.current_theme_id = theme_id.to_string();
            Ok(())
        } else {
            Err(format!("Theme '{}' not found", theme_id))
        }
    }

    pub fn list_themes(&self) -> Vec<&Theme> {
        self.themes.values().collect()
    }

    pub fn add_theme(&mut self, theme: Theme) {
        self.themes.insert(theme.id.clone(), theme);
    }

    pub fn export_theme(&self, theme_id: &str) -> Result<String, String> {
        self.themes
            .get(theme_id)
            .map(|t| serde_json::to_string_pretty(t).unwrap())
            .ok_or_else(|| format!("Theme '{}' not found", theme_id))
    }

    pub fn import_theme(&mut self, json: &str) -> Result<(), String> {
        let theme: Theme = serde_json::from_str(json).map_err(|e| e.to_string())?;
        self.add_theme(theme);
        Ok(())
    }
}
