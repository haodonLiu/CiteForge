#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod application;
mod config;
mod domain;
mod presentation;

use application::AppContainer;
use presentation::commands;
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
        ])
        .run(tauri::generate_context!())
        .context("failed to run tauri application")?;

    Ok(())
}
