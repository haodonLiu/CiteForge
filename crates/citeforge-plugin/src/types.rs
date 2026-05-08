use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub type PluginId = Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PluginType {
    DataSource,
    Exporter,
    AiEnhancer,
    Analyzer,
    Automation,
    UiExtension,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PluginInfo {
    pub id: PluginId,
    pub name: String,
    pub version: String,
    pub description: String,
    pub plugin_type: PluginType,
    pub author: String,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginConfig {
    pub plugins: Vec<PluginEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginEntry {
    pub name: String,
    pub enabled: bool,
    pub config: Option<serde_json::Value>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_plugin_info_serialization() {
        let info = PluginInfo {
            id: Uuid::new_v4(),
            name: "test-plugin".to_string(),
            version: "1.0.0".to_string(),
            description: "A test plugin".to_string(),
            plugin_type: PluginType::DataSource,
            author: "Test".to_string(),
            enabled: true,
        };

        let json = serde_json::to_string(&info).unwrap();
        let deserialized: PluginInfo = serde_json::from_str(&json).unwrap();
        assert_eq!(info.name, deserialized.name);
        assert_eq!(info.plugin_type, deserialized.plugin_type);
    }

    #[test]
    fn test_plugin_config_serialization() {
        let config = PluginConfig {
            plugins: vec![
                PluginEntry {
                    name: "pubmed".to_string(),
                    enabled: true,
                    config: None,
                },
                PluginEntry {
                    name: "zotero".to_string(),
                    enabled: false,
                    config: Some(serde_json::json!({"api_key": "xxx"})),
                },
            ],
        };

        let json = serde_json::to_string(&config).unwrap();
        let deserialized: PluginConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(config.plugins.len(), deserialized.plugins.len());
        assert!(deserialized.plugins[1].config.is_some());
    }
}