use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Theme {
    pub id: String,
    pub name: String,
    pub description: String,
    pub author: String,
    pub version: String,
    pub colors: ThemeColors,
    pub fonts: ThemeFonts,
    pub spacing: ThemeSpacing,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ThemeColors {
    pub primary: String,
    pub secondary: String,
    pub accent: String,
    pub background: String,
    pub surface: String,
    pub card: String,
    pub text_primary: String,
    pub text_secondary: String,
    pub text_muted: String,
    pub success: String,
    pub warning: String,
    pub error: String,
    pub info: String,
    pub highlight: String,
    pub selection: String,
    pub link: String,
    pub code_background: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ThemeFonts {
    pub sans_serif: String,
    pub serif: String,
    pub monospace: String,
    pub size_base: f64,
    pub line_height: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ThemeSpacing {
    pub unit: f64,
    pub radius: f64,
    pub gap: f64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_theme_serialization() {
        let theme = Theme {
            id: "test".to_string(),
            name: "Test".to_string(),
            description: "Test theme".to_string(),
            author: "Test".to_string(),
            version: "1.0.0".to_string(),
            colors: ThemeColors {
                primary: "#6366f1".to_string(),
                secondary: "#8b5cf6".to_string(),
                accent: "#f59e0b".to_string(),
                background: "#0f172a".to_string(),
                surface: "#1e293b".to_string(),
                card: "#1e293b".to_string(),
                text_primary: "#f8fafc".to_string(),
                text_secondary: "#94a3b8".to_string(),
                text_muted: "#64748b".to_string(),
                success: "#22c55e".to_string(),
                warning: "#f59e0b".to_string(),
                error: "#ef4444".to_string(),
                info: "#3b82f6".to_string(),
                highlight: "#fbbf24".to_string(),
                selection: "#6366f1".to_string(),
                link: "#3b82f6".to_string(),
                code_background: "#1e293b".to_string(),
            },
            fonts: ThemeFonts {
                sans_serif: "Inter, sans-serif".to_string(),
                serif: "Georgia, serif".to_string(),
                monospace: "JetBrains Mono, monospace".to_string(),
                size_base: 16.0,
                line_height: 1.6,
            },
            spacing: ThemeSpacing {
                unit: 4.0,
                radius: 8.0,
                gap: 16.0,
            },
        };

        let json = serde_json::to_string(&theme).unwrap();
        let deserialized: Theme = serde_json::from_str(&json).unwrap();
        assert_eq!(theme, deserialized);
    }
}
