"""Web UI execution runner — runs orchestrator with real agents."""
import asyncio
from pathlib import Path

from pca_lite.core.models import LiteratureEntry
from pca_lite.llm.providers.openai import OpenAIProvider
from pca_lite.llm.providers.anthropic import AnthropicProvider
from pca_lite.llm.providers.ollama import OllamaProvider
from pca_lite.orchestrator.engine import OrchestratorEngine
from pca_lite.workspace.manager import WorkspaceManager


class ExecutionRunner:
    """Runs the multi-agent pipeline from Web UI context."""

    def __init__(self, config: dict):
        self.config = config
        self.llm_provider = self._build_llm_provider(config.get("llm", {}))
        self.search_provider = self._build_search_provider(config.get("search", {}))

    def _build_llm_provider(self, llm_cfg: dict) -> OpenAIProvider | AnthropicProvider | OllamaProvider:
        provider = llm_cfg.get("provider", "openai")
        if provider == "openai":
            return OpenAIProvider(
                api_key=llm_cfg.get("api_key", ""),
                base_url=llm_cfg.get("base_url", "https://api.openai.com/v1"),
                model=llm_cfg.get("model", "gpt-4o-mini"),
            )
        elif provider == "anthropic":
            return AnthropicProvider(
                api_key=llm_cfg.get("api_key", ""),
                model=llm_cfg.get("model", "claude-3-haiku"),
            )
        else:  # ollama
            return OllamaProvider(
                base_url=llm_cfg.get("base_url", "http://localhost:11434"),
                model=llm_cfg.get("model", "qwen3"),
            )

    def _build_search_provider(self, search_cfg: dict):
        api_key = search_cfg.get("semantic_scholar_api_key", "")
        if not api_key:
            return None
        from pca_lite.search.semantic_scholar import SemanticScholarSearch
        return SemanticScholarSearch(api_key=api_key)

    def run(self, topic: str, files: list[Path], workspace_dir: Path, callback=None) -> None:
        """Synchronous wrapper — runs async pipeline in a background thread."""
        asyncio.run(self._run_async(topic, files, workspace_dir, callback))

    async def _run_async(
        self, topic: str, files: list[Path], workspace_dir: Path, callback=None
    ) -> dict:
        from pca_lite.agents.researcher import ResearcherAgent
        from pca_lite.agents.analyst import AnalystAgent
        from pca_lite.agents.writer import WriterAgent

        ws = WorkspaceManager(workspace_dir)
        ws.init_workspace()

        engine = OrchestratorEngine(ws)
        plan = engine.load_or_create_plan(topic, files)

        if callback:
            callback({"phase": "plan_created", "steps": [s.id for s in plan.steps]})

        researcher = ResearcherAgent(self.llm_provider, self.search_provider)
        analyst = AnalystAgent(self.llm_provider)
        writer = WriterAgent(self.llm_provider)

        literature_pool: list[LiteratureEntry] = []
        completed: list[str] = []

        for step in plan.steps:
            # Load existing state for resume
            try:
                existing_state = ws.read_json("state.json")
                completed = existing_state.get("completed_steps", [])
            except Exception:
                completed = []

            if step.id in completed:
                if callback:
                    callback({"phase": "step_skipped", "step": step.id})
                continue

            state = {
                "plan_version": "1.0",
                "current_step": step.id,
                "completed_steps": completed,
                "retry_counts": {},
                "workspace_files": {},
                "timestamp": __import__("datetime").datetime.now().isoformat(),
            }
            ws.write_json("state.json", state)

            if callback:
                callback({"phase": "step_started", "step": step.id})

            try:
                result = await self._execute_step(step, literature_pool, researcher, analyst, writer, ws)
                if callback:
                    callback({"phase": "step_completed", "step": step.id, "result": result})

                # Mark step as completed and persist SHA-256
                completed = completed + [step.id]
                ws.write_json("state.json", {
                    "plan_version": "1.0",
                    "current_step": step.id,
                    "completed_steps": completed,
                    "retry_counts": {},
                    "workspace_files": {},
                    "timestamp": __import__("datetime").datetime.now().isoformat(),
                })
            except Exception as e:
                if callback:
                    callback({"phase": "step_failed", "step": step.id, "error": str(e)})
                raise

        if callback:
            callback({"phase": "all_completed", "steps": plan.steps})

        return {"status": "completed", "steps": plan.steps}

    async def _execute_step(
        self,
        step,
        literature_pool: list,
        researcher,
        analyst,
        writer,
        ws,
    ) -> dict:
        from pca_lite.core.enums import AgentType

        if step.agent == AgentType.ORCHESTRATOR:
            return {}

        elif step.agent == AgentType.RESEARCHER:
            from pca_lite.ingestion.parser import extract_all_pdfs
            raw_dir = ws.workspace_dir / "raw_pdfs"
            if raw_dir.exists():
                pdfs = list(raw_dir.glob("*.pdf"))
                if pdfs:
                    outputs = extract_all_pdfs(raw_dir, ws.workspace_dir / "preprocessed")
                    pool = []
                    n = min(len(outputs), len(pdfs))
                    for i in range(n):
                        from pca_lite.core.models import LiteratureEntry
                        pool.append(LiteratureEntry(
                            index=i + 1,
                            title=outputs[i].stem.replace("_raw", ""),
                            source="local_pdf",
                            file_path=pdfs[i],
                        ))
                    literature_pool = pool

            verification = await researcher.verify_literature_pool(literature_pool)
            ws.write_json("literature_pool.json", {
                "entries": verification.get("verified", []) + verification.get("pending", []),
                "verification_summary": {
                    "verified": len(verification.get("verified", [])),
                    "pending": len(verification.get("pending", [])),
                    "failed": len(verification.get("failed", [])),
                }
            })
            return verification

        elif step.agent == AgentType.ANALYST:
            verified = ws.read_json("literature_pool.json").get("entries", [])
            entries = [LiteratureEntry.model_validate(e) for e in verified[:10]]
            analysis = await analyst.run(entries)
            ws.write_json("themes.json", analysis)
            return analysis

        elif step.agent == AgentType.WRITER:
            pool_data = ws.read_json("literature_pool.json")
            themes_data = ws.read_json("themes.json")
            themes = themes_data.get("analysis", {}).get("themes", themes_data.get("themes", []))
            pool_entries = [LiteratureEntry.model_validate(e) for e in pool_data.get("entries", [])]
            topics = [topic]
            draft = await writer.run(themes, pool_entries, topics)
            content = draft.get("content", "# 综述草稿\n\n尚未生成内容。")
            (ws.workspace_dir / "draft.md").write_text(content, encoding="utf-8")
            return draft

        return {}


def run_execution(topic: str, files: list[str], workspace_dir: Path, callback=None) -> None:
    """Load config and run execution. Called from Streamlit button handler."""
    import json
    import yaml
    from pathlib import Path

    config_path = Path.home() / ".pca" / "config.yaml"
    if config_path.exists():
        with open(config_path) as f:
            content = f.read()
            import re, os
            content = re.sub(r"\$\{(\w+)\}", lambda m: os.environ.get(m.group(1), m.group(0)), content)
            cfg = yaml.safe_load(content)
    else:
        from pca_lite.core.models import LLMConfig, EmbeddingConfig, Config
        cfg = Config(
            llm=LLMConfig(provider="ollama", base_url="http://localhost:11434", api_key="", model="qwen3"),
            embedding=EmbeddingConfig(mode="local", local_model=""),
        ).model_dump()

    runner = ExecutionRunner(cfg)
    runner.run(
        topic=topic,
        files=[Path(f) for f in files],
        workspace_dir=workspace_dir,
        callback=callback,
    )