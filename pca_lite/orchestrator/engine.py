from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path

from pca_lite.core.consts import FILE_DRAFT, FILE_LITERATURE_POOL, FILE_STATE
from pca_lite.core.exceptions import PipelineError
from pca_lite.core.models import TaskPlan, Step, Sources, Constraints, State
from pca_lite.core.enums import AgentType
from pca_lite.workspace.manager import WorkspaceManager


class OrchestratorEngine:
    def __init__(self, workspace: WorkspaceManager, max_workers: int = 4):
        self.workspace = workspace
        self.max_workers = max_workers

    def load_or_create_plan(self, topic: str, files: list[Path]) -> TaskPlan:
        return TaskPlan(
            topic=topic,
            created_at=datetime.now().isoformat(),
            review_type="default",
            sources=Sources(local_files=files, search_queries=[]),
            constraints=Constraints(),
            steps=[
                Step(
                    id="step_0",
                    agent=AgentType.ORCHESTRATOR,
                    task="初始化工作区",
                    tools=[],
                    input_from=[],
                    output=FILE_STATE,
                ),
                Step(
                    id="step_1",
                    agent=AgentType.RESEARCHER,
                    task="文献检索与校验（Week 1 stub）",
                    tools=[],
                    input_from=["step_0"],
                    output=FILE_LITERATURE_POOL,
                ),
                Step(
                    id="step_2",
                    agent=AgentType.WRITER,
                    task="综述撰写（Week 1 stub）",
                    tools=[],
                    input_from=["step_1"],
                    output=FILE_DRAFT,
                ),
            ],
        )

    def execute_plan(self, plan: TaskPlan) -> State:
        state_dict = self.workspace.read_json(FILE_STATE)
        state = State.model_validate(state_dict)

        groups: dict[str | None, list[Step]] = {}
        for step in plan.steps:
            group_key = step.parallel_group
            if group_key not in groups:
                groups[group_key] = []
            groups[group_key].append(step)

        for group_key, steps_in_group in groups.items():
            if group_key is None:
                for step in steps_in_group:
                    self._execute_single_step(step, state, plan)
            else:
                self._execute_parallel_group(steps_in_group, state, plan)

        return state

    def _execute_single_step(self, step: Step, state: State, plan: TaskPlan) -> None:
        if step.id in state.completed_steps:
            print(f"[SKIP] 步骤已跳过: {step.id}")
            return

        for dep in step.input_from:
            if dep not in state.completed_steps:
                raise ValueError(f"依赖未满足: {step.id} 依赖 {dep}，但 {dep} 未完成")

        state.current_step = step.id
        state.timestamp = datetime.now().isoformat()
        self.workspace.write_json(FILE_STATE, state)

        try:
            self.execute_step(step)
            state.completed_steps.append(step.id)
            state.timestamp = datetime.now().isoformat()
            self.workspace.write_json(FILE_STATE, state)
        except PipelineError as e:
            retry_count = state.retry_counts.get(step.id, 0) + 1
            state.retry_counts[step.id] = retry_count
            if retry_count <= plan.constraints.max_retry:
                print(f"[RETRY] 步骤 {step.id} 失败，重试 ({retry_count}/{plan.constraints.max_retry})")
                state.timestamp = datetime.now().isoformat()
                self.workspace.write_json(FILE_STATE, state)
            else:
                print(f"[FAIL] 步骤 {step.id} 超过最大重试次数")
                state.completed_steps.append(step.id)
                self.workspace.write_json(FILE_STATE, state)

    def _execute_parallel_group(
        self, steps: list[Step], state: State, plan: TaskPlan
    ) -> None:
        for step in steps:
            if step.id in state.completed_steps:
                continue
            for dep in step.input_from:
                if dep not in state.completed_steps:
                    raise ValueError(f"依赖未满足: {step.id} 依赖 {dep}，但 {dep} 未完成")

        state.current_step = ",".join(s.id for s in steps)
        state.timestamp = datetime.now().isoformat()
        self.workspace.write_json(FILE_STATE, state)

        with ThreadPoolExecutor(max_workers=min(len(steps), self.max_workers)) as executor:
            futures = {
                executor.submit(self._run_step_safe, step): step
                for step in steps
            }
            all_success = True
            for future in as_completed(futures):
                step = futures[future]
                try:
                    future.result()
                except PipelineError as e:
                    all_success = False
                    print(f"[FAIL] Parallel step {step.id} failed: {e}")

        for step in steps:
            if all_success and step.id not in state.completed_steps:
                state.completed_steps.append(step.id)

        state.timestamp = datetime.now().isoformat()
        self.workspace.write_json(FILE_STATE, state)

    def _run_step_safe(self, step: Step) -> None:
        self.execute_step(step)

    def execute_step(self, step: Step) -> dict:
        print(f"[EXEC] 步骤 {step.id}: {step.task}")
        import time; time.sleep(0.1)
        return {}

    def resume(self) -> State:
        state_dict = self.workspace.read_json(FILE_STATE)
        state = State.model_validate(state_dict)
        tampered = self.workspace.verify_integrity(state)
        if tampered:
            print(f"[WARN] 以下文件已被修改: {tampered}")
            print("[WARN] 建议从头执行，当前将跳过这些文件继续")
        print(f"[RESUME] 从步骤 {state.current_step} 恢复，已完成: {state.completed_steps}")
        return state
