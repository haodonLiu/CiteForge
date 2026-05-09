use std::sync::Arc;
use tokio::sync::broadcast;
use crate::workspace::Database;
use citeforge_core::event::TaskEvent;

pub struct EventOutbox {
    db: Arc<Database>,
    bus: broadcast::Sender<TaskEvent>,
}

impl EventOutbox {
    pub fn new(db: Arc<Database>) -> (Self, broadcast::Receiver<TaskEvent>) {
        let (tx, rx) = broadcast::channel(1000);
        (Self { db, bus: tx }, rx)
    }

    pub async fn publish(&self, task_id: &str, event: TaskEvent) -> anyhow::Result<()> {
        self.db.append_event(task_id, &event).await?;

        if let Err(e) = self.bus.send(event.clone()) {
            tracing::warn!("broadcast channel full, event queued: {:?}", e);
        }

        Ok(())
    }

    pub fn subscribe(&self) -> broadcast::Receiver<TaskEvent> {
        self.bus.subscribe()
    }
}
