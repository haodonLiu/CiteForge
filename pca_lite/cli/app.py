import os
import re
from pathlib import Path

import typer
import yaml
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Confirm
from rich.table import Table

from pca_lite.core.models import Config

app = typer.Typer(help="PCA-Lite: 面向论文综述的多 Agent 协作框架")
console = Console()

DEFAULT_CONFIG_PATH = Path.home() / ".pca" / "config.yaml"


def mask_key(key: str) -> str:
    if len(key) <= 4:
        return "***"
    return key[:4] + "***"


def load_config(config_path: Path | None = None) -> Config:
    path = (config_path or DEFAULT_CONFIG_PATH).expanduser().resolve()
    if not path.exists():
        console.print("[yellow]配置文件不存在，启动交互式引导...[/yellow]")
        return interactive_setup()

    content = path.read_text(encoding="utf-8")
    content = re.sub(r"\$\{(\w+)\}", lambda m: os.environ.get(m.group(1), m.group(0)), content)
    data = yaml.safe_load(content)
    config = Config(**data)
    errors = validate_config(config)
    if errors:
        for err in errors:
            console.print(f"[red]错误: {err}[/red]")
        raise SystemExit(1)
    return config


def validate_config(config: Config) -> list[str]:
    errors = []
    if not config.llm.provider:
        errors.append("llm.provider 不能为空")
    if not config.llm.base_url:
        errors.append("llm.base_url 不能为空")
    if not config.llm.api_key:
        errors.append("llm.api_key 不能为空")
    if not config.llm.model:
        errors.append("llm.model 不能为空")
    if not config.embedding.mode:
        errors.append("embedding.mode 不能为空")
    if config.embedding.mode == "local" and not config.embedding.local_model:
        errors.append("embedding.mode 为 local 时 local_model 必须填写")
    if config.embedding.mode == "local" and config.embedding.local_model:
        model_path = Path(config.embedding.local_model).expanduser().resolve()
        if not model_path.exists():
            console.print(f"[yellow]警告: embedding.local_model 路径不存在: {model_path}[/yellow]")
    if config.embedding.mode == "api" and not config.embedding.api_base_url:
        errors.append("embedding.mode 为 api 时 api_base_url 必须填写")
    return errors


def interactive_setup() -> Config:
    from rich.prompt import Prompt, Confirm
    from pca_lite.core.models import (
        LLMConfig, EmbeddingConfig, RetryConfig, VectorDBConfig,
        RerankerConfig, SearchConfig, ParserConfig, OrchestratorConfig,
        PersistenceConfig, LoggingConfig,
    )

    console.print("[bold]PCA-Lite 首次运行配置引导[/bold]")

    provider = Prompt.ask("LLM Provider", choices=["openai", "anthropic", "ollama"])
    base_url = Prompt.ask("LLM API 端点地址")
    api_key = Prompt.ask("LLM API Key", password=True)
    model = Prompt.ask("LLM 模型名称")

    embedding_mode = Prompt.ask("嵌入模型模式", choices=["api", "local"])
    llm_config = LLMConfig(provider=provider, base_url=base_url, api_key=api_key, model=model)

    if embedding_mode == "local":
        local_model = Prompt.ask("本地嵌入模型路径")
        if not Path(local_model).expanduser().resolve().exists():
            console.print("[yellow]警告: 路径不存在，可能影响后续使用[/yellow]")
        embedding_config = EmbeddingConfig(mode=embedding_mode, local_model=local_model)
    else:
        api_base_url = Prompt.ask("嵌入模型 API 端点")
        api_key_emb = Prompt.ask("嵌入模型 API Key", password=True)
        api_model_emb = Prompt.ask("嵌入模型名称")
        embedding_config = EmbeddingConfig(
            mode=embedding_mode,
            api_base_url=api_base_url,
            api_key=api_key_emb,
            api_model=api_model_emb,
        )

    config = Config(llm=llm_config, embedding=embedding_config)

    if Confirm.ask("是否保存配置到 ~/.pca/config.yaml?"):
        config_dir = Path.home() / ".pca"
        config_dir.mkdir(parents=True, exist_ok=True)
        config_path = config_dir / "config.yaml"
        config_dict = config.model_dump()
        config_dict["llm"]["api_key"] = api_key
        if embedding_mode == "local":
            config_dict["embedding"]["local_model"] = local_model
        else:
            config_dict["embedding"]["api_key"] = api_key_emb
        with open(config_path, "w", encoding="utf-8") as f:
            yaml.dump(config_dict, f, allow_unicode=True, default_flow_style=False)
        console.print(f"[green]配置已保存到 {config_path}[/green]")

    return config


@app.command()
def run(
    topic: str = typer.Option(None, "--topic", "-t", help="综述主题"),
    files: list[Path] = typer.Option([], "--files", "-f", help="本地 PDF 文件路径"),
    config_path: Path = typer.Option(None, "--config", "-c", help="配置文件路径"),
    resume: Path = typer.Option(None, "--resume", "-r", help="断点恢复工作区路径"),
    skip_human_in_loop: bool = typer.Option(False, "--yes", "-y", help="跳过人机确认（自动化模式）"),
):
    if topic and resume:
        console.print("[red]错误: --topic 和 --resume 不能同时使用[/red]")
        raise typer.Exit(1)

    if resume:
        from pca_lite.orchestrator.engine import OrchestratorEngine
        from pca_lite.workspace.manager import WorkspaceManager
        ws = WorkspaceManager(resume)
        engine = OrchestratorEngine(ws)
        state = engine.resume()
        console.print(f"[green]恢复成功，已完成: {state.completed_steps}[/green]")
        return

    if topic:
        config = load_config(config_path)
        from pca_lite.orchestrator.engine import OrchestratorEngine
        from pca_lite.workspace.manager import WorkspaceManager
        ws = WorkspaceManager(Path("./workspace"))
        ws.init_workspace()
        engine = OrchestratorEngine(ws)
        plan = engine.load_or_create_plan(topic, files)

        console.print(f"[bold]Topic:[/bold] {plan.topic}")
        table = Table(title="计划步骤")
        table.add_column("ID", style="cyan")
        table.add_column("Agent", style="magenta")
        table.add_column("Task", style="green")
        table.add_column("Output", style="yellow")
        for step in plan.steps:
            table.add_row(step.id, step.agent.value, step.task, step.output)
        console.print(table)

        # Checkpoint 1: Confirm before execution
        if not skip_human_in_loop:
            confirmed = Confirm.ask(
                "[bold yellow]确认执行计划?[/bold yellow] 步骤数: "
                f"{len(plan.steps)} | 文件数: {len(files)}",
                default=False,
            )
            if not confirmed:
                console.print("[yellow]用户取消，退出[/yellow]")
                raise typer.Exit(0)

        state = engine.execute_plan(plan)

        # Checkpoint 2: After literature retrieval (step_1 completes)
        if "step_1" in state.completed_steps and not skip_human_in_loop:
            try:
                pool = ws.read_json("literature_pool.json")
                entries = pool.get("entries", pool) if isinstance(pool, dict) else []
                console.print(Panel(
                    f"[bold]文献池大小:[/bold] {len(entries)}\n"
                    f"[bold]已完成步骤:[/bold] {len(state.completed_steps)}",
                    title="文献检索完成",
                ))
                proceed = Confirm.ask("[bold yellow]是否继续撰写综述?[/bold yellow]", default=True)
                if not proceed:
                    console.print("[yellow]已暂停，使用 --resume 恢复[/yellow]")
                    return
            except Exception:
                pass

        console.print(f"[green]完成，已执行步骤: {state.completed_steps}[/green]")

        # Checkpoint 3: Before finalizing (when draft.md exists)
        if not skip_human_in_loop:
            draft_path = ws.workspace_dir / "draft.md"
            if draft_path.exists():
                confirmed = Confirm.ask(
                    "[bold yellow]确认输出最终综述?[/bold yellow]",
                    default=True,
                )
                if not confirmed:
                    console.print("[yellow]草稿未提交，请修改后重试[/yellow]")
                    return

        return

    console.print("[red]错误: 必须提供 --topic 或 --resume[/red]")
    raise typer.Exit(1)


@app.command(name="config")
def config_cmd(
    action: str = typer.Argument(help="操作: show | init"),
):
    if action == "show":
        config = load_config()
        masked_key = mask_key(config.llm.api_key) if config.llm.api_key else ""
        console.print(Panel(
            f"[bold]provider:[/bold] {config.llm.provider}\n"
            f"[bold]base_url:[/bold] {config.llm.base_url}\n"
            f"[bold]model:[/bold] {config.llm.model}\n"
            f"[bold]api_key:[/bold] {masked_key}\n"
            f"[bold]embedding mode:[/bold] {config.embedding.mode}",
            title="PCA-Lite 配置",
        ))
    elif action == "init":
        interactive_setup()
        console.print("[green]配置初始化完成[/green]")
    else:
        console.print(f"[red]错误: 未知操作 '{action}'，支持 show | init[/red]")
        raise typer.Exit(1)
