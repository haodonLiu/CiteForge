#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod application;
mod config;
mod domain;
mod presentation;
mod agent;
mod agents;
mod metrics;
pub mod workspace {
    pub use citeforge_workspace::*;
}

use application::AppContainer;
use presentation::commands;
use anyhow::Context;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let config = config::AppConfig::from_file("config.yaml")
        .context("failed to load config")?;

    let container = AppContainer::new(config).await?;

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
            commands::list_plugins,
        ])
        .run(tauri::generate_context!())
        .context("failed to run tauri application")?;

    Ok(())
}
