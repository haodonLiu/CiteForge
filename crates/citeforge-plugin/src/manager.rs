use crate::types::*;
use crate::PluginError;
use std::path::PathBuf;

#[allow(dead_code)]
pub struct PluginManager {
    plugins_dir: PathBuf,
    loaded_plugins: Vec<PluginInfo>,
}

impl PluginManager {
    pub fn new(plugins_dir: PathBuf) -> Self {
        Self {
            plugins_dir,
            loaded_plugins: Vec::new(),
        }
    }

    pub fn discover_plugins(&self) -> Result<Vec<PluginInfo>, PluginError> {
        // TODO: Scan plugins_dir for .wasm files and read their metadata
        Ok(self.loaded_plugins.clone())
    }

    pub fn list_plugins(&self) -> &[PluginInfo] {
        &self.loaded_plugins
    }

    pub fn enable_plugin(&mut self, plugin_id: &PluginId) -> Result<(), PluginError> {
        if let Some(plugin) = self.loaded_plugins.iter_mut().find(|p| p.id == *plugin_id) {
            plugin.enabled = true;
            Ok(())
        } else {
            Err(PluginError::NotFound(format!(
                "Plugin {} not found",
                plugin_id
            )))
        }
    }

    pub fn disable_plugin(&mut self, plugin_id: &PluginId) -> Result<(), PluginError> {
        if let Some(plugin) = self.loaded_plugins.iter_mut().find(|p| p.id == *plugin_id) {
            plugin.enabled = false;
            Ok(())
        } else {
            Err(PluginError::NotFound(format!(
                "Plugin {} not found",
                plugin_id
            )))
        }
    }
}
