use metrics::{counter, histogram, gauge};
use metrics_exporter_prometheus::PrometheusBuilder;

pub fn init_metrics() -> anyhow::Result<()> {
    PrometheusBuilder::new()
        .with_push_gateway("http://localhost:9091", Some("citeforge"))
        .install()
        .context("failed to install metrics")?;

    counter!("citeforge.started", 1);
    gauge!("citeforge.active_tasks", 0.0);

    Ok(())
}

pub fn record_task_started() {
    counter!("citeforge.task.started", 1);
    gauge!("citeforge.active_tasks", 1.0);
}

pub fn record_task_completed(duration_secs: f64) {
    counter!("citeforge.task.completed", 1);
    gauge!("citeforge.active_tasks", -1.0);
    histogram!("citeforge.task.duration", duration_secs);
}

pub fn record_llm_call(provider: &str, tokens: usize, duration_secs: f64) {
    counter!("citeforge.llm.calls", 1, "provider" => provider);
    histogram!("citeforge.llm.tokens", tokens as f64, "provider" => provider);
    histogram!("citeforge.llm.duration", duration_secs, "provider" => provider);
}
