pub mod application;
pub mod config;
pub mod domain;
pub mod presentation;
pub mod agent;
pub mod agents;
pub mod metrics;
pub mod workspace {
    pub use citeforge_workspace::*;
}

pub use application::AppContainer;
pub use config::AppConfig;
pub use presentation::commands::{run_task, resume_task, get_task_status, get_draft_stats};
