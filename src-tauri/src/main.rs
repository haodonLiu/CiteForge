#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod agent;
mod agents;
mod application;
mod config;
mod domain;
mod metrics;
mod presentation;
pub mod workspace {
    pub use citeforge_workspace::*;
}

use anyhow::Context;
use application::AppContainer;
use presentation::commands;
use std::fs;
use tracing_subscriber::{
    layer::{Layer, SubscriberExt},
    util::SubscriberInitExt,
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let log_dir = dirs::data_local_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("CiteForge");
    let log_path = log_dir.join("citeforge.log");

    // Create directory if it doesn't exist
    let _ = fs::create_dir_all(&log_dir);
    let _ = fs::remove_file(&log_path); // Delete old log
    let log_file = fs::File::create(&log_path).unwrap_or_else(|e| {
        eprintln!("Failed to create log file {:?}: {}", log_path, e);
        std::process::exit(1);
    });

    use tracing_subscriber::filter;

    let file_layer = tracing_subscriber::fmt::layer()
        .with_writer(log_file)
        .with_filter(filter::LevelFilter::WARN);

    let stderr_layer = tracing_subscriber::fmt::layer().with_filter(
        filter::EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| filter::EnvFilter::new("debug")),
    );

    tracing_subscriber::registry()
        .with(file_layer)
        .with(stderr_layer)
        .init();

    tracing::info!("CiteForge starting...");

    let default_config = config::AppConfig::default();
    let config_path = default_config.workspace.root.join("config.yaml");

    let config = match config::AppConfig::from_file(config_path.to_str().unwrap_or("config.yaml")) {
        Ok(c) => c,
        Err(_) => {
            let yaml = serde_yaml::to_string(&default_config).unwrap_or_default();
            let _ = fs::write(&config_path, yaml);
            default_config
        }
    };

    let container = match AppContainer::new(config).await {
        Ok(c) => c,
        Err(e) => {
            tracing::error!("Failed to create AppContainer: {:#}", e);
            return Err(e);
        }
    };

    tauri::Builder::default()
        .manage(container)
        .invoke_handler(tauri::generate_handler![
            commands::run_task,
            commands::resume_task,
            commands::get_task_status,
            commands::get_agent_context,
            commands::get_agent_personalities,
            commands::get_current_theme,
            commands::set_theme,
            commands::get_settings,
            commands::save_settings,
            commands::get_events,
            commands::subscribe_events,
            commands::generate_text_index,
            commands::generate_outline,
            commands::search_text_index,
            commands::analyze_paper_structure,
            commands::record_activity,
            commands::get_time_status,
            commands::get_time_records,
        ])
        .run(tauri::generate_context!())
        .context("failed to run tauri application")?;

    Ok(())
}
