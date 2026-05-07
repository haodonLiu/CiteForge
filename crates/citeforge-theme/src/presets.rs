use crate::theme::{Theme, ThemeColors, ThemeFonts, ThemeSpacing};

pub fn all_presets() -> Vec<Theme> {
    vec![midnight_scholar(), classic_paper(), green_garden(), high_contrast()]
}

fn midnight_scholar() -> Theme {
    Theme {
        id: "midnight_scholar".to_string(),
        name: "午夜学者".to_string(),
        description: "护眼深色主题，适合长时间阅读".to_string(),
        author: "CiteForge".to_string(),
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
        fonts: default_fonts(),
        spacing: default_spacing(),
    }
}

fn classic_paper() -> Theme {
    Theme {
        id: "classic_paper".to_string(),
        name: "经典论文".to_string(),
        description: "模拟纸质阅读体验".to_string(),
        author: "CiteForge".to_string(),
        version: "1.0.0".to_string(),
        colors: ThemeColors {
            primary: "#2563eb".to_string(),
            secondary: "#7c3aed".to_string(),
            accent: "#dc2626".to_string(),
            background: "#fefce8".to_string(),
            surface: "#ffffff".to_string(),
            card: "#ffffff".to_string(),
            text_primary: "#1e293b".to_string(),
            text_secondary: "#475569".to_string(),
            text_muted: "#94a3b8".to_string(),
            success: "#16a34a".to_string(),
            warning: "#d97706".to_string(),
            error: "#dc2626".to_string(),
            info: "#2563eb".to_string(),
            highlight: "#fde68a".to_string(),
            selection: "#bfdbfe".to_string(),
            link: "#2563eb".to_string(),
            code_background: "#f1f5f9".to_string(),
        },
        fonts: ThemeFonts {
            sans_serif: "Inter, sans-serif".to_string(),
            serif: "Merriweather, Georgia, serif".to_string(),
            monospace: "JetBrains Mono, monospace".to_string(),
            size_base: 16.0,
            line_height: 1.8,
        },
        spacing: default_spacing(),
    }
}

fn green_garden() -> Theme {
    Theme {
        id: "green_garden".to_string(),
        name: "绿色花园".to_string(),
        description: "低对比度护眼主题".to_string(),
        author: "CiteForge".to_string(),
        version: "1.0.0".to_string(),
        colors: ThemeColors {
            primary: "#16a34a".to_string(),
            secondary: "#059669".to_string(),
            accent: "#d97706".to_string(),
            background: "#f0fdf4".to_string(),
            surface: "#ffffff".to_string(),
            card: "#ffffff".to_string(),
            text_primary: "#1a2e05".to_string(),
            text_secondary: "#3f6212".to_string(),
            text_muted: "#65a30d".to_string(),
            success: "#16a34a".to_string(),
            warning: "#d97706".to_string(),
            error: "#dc2626".to_string(),
            info: "#0891b2".to_string(),
            highlight: "#bbf7d0".to_string(),
            selection: "#86efac".to_string(),
            link: "#16a34a".to_string(),
            code_background: "#f0fdf4".to_string(),
        },
        fonts: default_fonts(),
        spacing: default_spacing(),
    }
}

fn high_contrast() -> Theme {
    Theme {
        id: "high_contrast".to_string(),
        name: "高对比".to_string(),
        description: "适合视力不佳用户".to_string(),
        author: "CiteForge".to_string(),
        version: "1.0.0".to_string(),
        colors: ThemeColors {
            primary: "#000000".to_string(),
            secondary: "#1a1a1a".to_string(),
            accent: "#0000ff".to_string(),
            background: "#ffffff".to_string(),
            surface: "#ffffff".to_string(),
            card: "#ffffff".to_string(),
            text_primary: "#000000".to_string(),
            text_secondary: "#000000".to_string(),
            text_muted: "#333333".to_string(),
            success: "#008000".to_string(),
            warning: "#ff8c00".to_string(),
            error: "#ff0000".to_string(),
            info: "#0000ff".to_string(),
            highlight: "#ffff00".to_string(),
            selection: "#0000ff".to_string(),
            link: "#0000ff".to_string(),
            code_background: "#f0f0f0".to_string(),
        },
        fonts: ThemeFonts {
            sans_serif: "Arial, sans-serif".to_string(),
            serif: "Times New Roman, serif".to_string(),
            monospace: "Courier New, monospace".to_string(),
            size_base: 18.0,
            line_height: 2.0,
        },
        spacing: ThemeSpacing {
            unit: 6.0,
            radius: 4.0,
            gap: 20.0,
        },
    }
}

fn default_fonts() -> ThemeFonts {
    ThemeFonts {
        sans_serif: "Inter, sans-serif".to_string(),
        serif: "Georgia, serif".to_string(),
        monospace: "JetBrains Mono, monospace".to_string(),
        size_base: 16.0,
        line_height: 1.6,
    }
}

fn default_spacing() -> ThemeSpacing {
    ThemeSpacing {
        unit: 4.0,
        radius: 8.0,
        gap: 16.0,
    }
}
