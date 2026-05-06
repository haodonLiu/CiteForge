"""CiteForge CLI — Typer + Rich."""
import os
import re
import sys
from pathlib import Path

import typer
import yaml
from rich.console import Console
from rich.panel import Panel

from citeforge.core.consts import DIR_RAW_PDFS, FILE_DRAFT, FILE_LITERATURE_POOL
from rich.prompt import Confirm
from rich.table import Table

from citeforge.core.models import Config

app = typer.Typer(help="CiteForge: 面向论文综述的多 Agent 协作框架")
console = Console()

DEFAULT_CONFIG_PATH = Path.home() / ".pca" / "config.yaml"


def mask_key(key: str) -> str:
    if key:
        return "***"
    return ""


def load_config(config_path: Path | None = None) -> Config:
    path = (config_path or DEFAULT_CONFIG_PATH).expanduser().resolve()
    if not path.exists():
        console.print("[yellow]配置文件不存在，启动交互式引导...[/yellow]")
        return interactive_setup()

    try:
        content = path.read_text(encoding="utf-8")
    except OSError as e:
        console.print(f"[red]读取配置文件失败: {e}[/red]")
        raise typer.Exit(1)

    content = re.sub(r"\$\{(\w+)\}", lambda m: os.environ.get(m.group(1), m.group(0)), content)
    try:
        data = yaml.safe_load(content)
    except yaml.YAMLError as e:
        console.print(f"[red]YAML 解析失败: {e}[/red]")
        raise typer.Exit(1)

    try:
        config = Config(**data)
    except Exception as e:
        console.print(f"[red]配置模型验证失败: {e}[/red]")
        raise typer.Exit(1)

    errors = validate_config(config)
    if errors:
        for err in errors:
            console.print(f"[red]错误: {err}[/red]")
        raise typer.Exit(1)
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
    from citeforge.core.models import LLMConfig, EmbeddingConfig

    console.print("[bold]CiteForge 首次运行配置引导[/bold]")

    try:
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
            # Store API keys using ${ENV_VAR} pattern for environment variable reference
            env_ref = os.environ.get("PCA_LLM_API_KEY", api_key)
            env_ref_emb = os.environ.get("PCA_EMB_API_KEY", api_key_emb if embedding_mode != "local" else "")
            if api_key == env_ref:
                config_dict["llm"]["api_key"] = "${PCA_LLM_API_KEY}"
            else:
                config_dict["llm"]["api_key"] = api_key
            if embedding_mode == "local":
                config_dict["embedding"]["local_model"] = local_model
            else:
                if api_key_emb == env_ref_emb:
                    config_dict["embedding"]["api_key"] = "${PCA_EMB_API_KEY}"
                else:
                    config_dict["embedding"]["api_key"] = api_key_emb
            with open(config_path, "w", encoding="utf-8") as f:
                yaml.dump(config_dict, f, allow_unicode=True, default_flow_style=False)
            console.print(f"[green]配置已保存到 {config_path}[/green]")
            console.print("[dim]提示: API key 已保存，下次可通过环境变量 PCA_LLM_API_KEY / PCA_EMB_API_KEY 覆盖[/dim]")

        return config

    except (KeyboardInterrupt, EOFError):
        console.print("[yellow]\n配置中断，已退出[/yellow]")
        raise typer.Exit(0)


@app.command()
def run(
    topic: str = typer.Option(None, "--topic", "-t", help="综述主题"),
    files: list[Path] = typer.Option([], "--files", "-f", help="本地 PDF 文件路径"),
    config_path: Path = typer.Option(None, "--config", "-c", help="配置文件路径"),
    resume: Path = typer.Option(None, "--resume", "-r", help="断点恢复工作区路径"),
    skip_human_in_loop: bool = typer.Option(False, "--yes", "-y", help="跳过人机确认（自动化模式）"),
):
    try:
        if topic and resume:
            console.print("[red]错误: --topic 和 --resume 不能同时使用[/red]")
            raise typer.Exit(1)

        if resume:
            try:
                from citeforge.orchestrator.engine import OrchestratorEngine
                from citeforge.workspace.manager import WorkspaceManager
                ws = WorkspaceManager(resume)
                engine = OrchestratorEngine(ws)
                state = engine.resume()
                console.print(f"[green]恢复成功，已完成: {state.completed_steps}[/green]")
            except FileNotFoundError:
                console.print(f"[red]错误: 工作区路径不存在: {resume}[/red]")
                raise typer.Exit(1)
            except Exception as e:
                console.print(f"[red]恢复失败: {e}[/red]")
                raise typer.Exit(1)
            return

        if topic:
            config = load_config(config_path)
            from citeforge.orchestrator.engine import OrchestratorEngine
            from citeforge.workspace.manager import WorkspaceManager
            ws = WorkspaceManager(Path.home() / ".pca" / "workspace")
            try:
                ws.init_workspace()
            except OSError as e:
                console.print(f"[red]工作区初始化失败: {e}[/red]")
                raise typer.Exit(1)

            # Copy PDF files to workspace raw_pdfs/
            raw_dir = ws.workspace_dir / DIR_RAW_PDFS
            for f in files:
                f = Path(f).expanduser().resolve()
                if not f.exists():
                    console.print(f"[yellow]警告: 文件不存在，跳过: {f}[/yellow]")
                    continue
                safe_name = Path(f.name.replace("..", "_").replace("/", "_").replace("\\", "_"))
                dest = raw_dir / safe_name
                try:
                    import shutil
                    shutil.copy2(f, dest)
                    console.print(f"[dim]已复制: {safe_name}[/dim]")
                except OSError as e:
                    console.print(f"[yellow]警告: 复制失败 {f.name}: {e}[/yellow]")

            engine = OrchestratorEngine(ws)
            try:
                plan = engine.load_or_create_plan(topic, files)
            except Exception as e:
                console.print(f"[red]计划生成失败: {e}[/red]")
                raise typer.Exit(1)

            console.print(f"[bold]Topic:[/bold] {plan.topic}")
            table = Table(title="计划步骤")
            table.add_column("ID", style="cyan")
            table.add_column("Agent", style="magenta")
            table.add_column("Task", style="green")
            table.add_column("Output", style="yellow")
            for step in plan.steps:
                table.add_row(step.id, step.agent.value, step.task, step.output)
            console.print(table)

            if not skip_human_in_loop:
                try:
                    confirmed = Confirm.ask(
                        "[bold yellow]确认执行计划?[/bold yellow] 步骤数: "
                        f"{len(plan.steps)} | 文件数: {len(files)}",
                        default=False,
                    )
                    if not confirmed:
                        console.print("[yellow]用户取消，退出[/yellow]")
                        raise typer.Exit(0)
                except (KeyboardInterrupt, EOFError):
                    console.print("[yellow]\n操作中断[/yellow]")
                    raise typer.Exit(0)

            try:
                state = engine.execute_plan(plan)
            except Exception as e:
                console.print(f"[red]计划执行失败: {e}[/red]")
                raise typer.Exit(1)

            if "step_1" in state.completed_steps and not skip_human_in_loop:
                try:
                    pool = ws.read_json(FILE_LITERATURE_POOL)
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
                except (KeyboardInterrupt, EOFError):
                    raise
                except Exception as e:
                    console.print(f"[yellow]读取文献池失败: {e}[/yellow]")

            console.print(f"[green]完成，已执行步骤: {state.completed_steps}[/green]")

            if not skip_human_in_loop:
                draft_path = ws.workspace_dir / FILE_DRAFT
                if draft_path.exists():
                    try:
                        confirmed = Confirm.ask(
                            "[bold yellow]确认输出最终综述?[/bold yellow]",
                            default=True,
                        )
                        if not confirmed:
                            console.print("[yellow]草稿未提交，请修改后重试[/yellow]")
                            return
                    except (KeyboardInterrupt, EOFError):
                        console.print("[yellow]\n操作中断[/yellow]")
                        return

            return

        console.print("[red]错误: 必须提供 --topic 或 --resume[/red]")
        raise typer.Exit(1)

    except KeyboardInterrupt:
        console.print("\n[yellow]操作已中断[/yellow]")
        raise typer.Exit(130)
    except SystemExit:
        raise
    except Exception as e:
        console.print(f"[red]未知错误: {e}[/red]")
        raise typer.Exit(1)


@app.command(name="config")
def config_cmd(
    action: str = typer.Argument(help="操作: show | init"),
):
    if action == "show":
        try:
            config = load_config()
            masked_key = mask_key(config.llm.api_key) if config.llm.api_key else ""
            console.print(Panel(
                f"[bold]provider:[/bold] {config.llm.provider}\n"
                f"[bold]base_url:[/bold] {config.llm.base_url}\n"
                f"[bold]model:[/bold] {config.llm.model}\n"
                f"[bold]api_key:[/bold] {masked_key}\n"
                f"[bold]embedding mode:[/bold] {config.embedding.mode}",
                title="CiteForge 配置",
            ))
        except SystemExit:
            raise
        except Exception as e:
            console.print(f"[red]加载配置失败: {e}[/red]")
            raise typer.Exit(1)
    elif action == "init":
        interactive_setup()
        console.print("[green]配置初始化完成[/green]")
    else:
        console.print(f"[red]错误: 未知操作 '{action}'，支持 show | init[/red]")
        raise typer.Exit(1)