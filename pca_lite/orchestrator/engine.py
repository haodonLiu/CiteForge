from datetime import datetime
from pathlib import Path

from pca_lite.core.models import TaskPlan, Step, Sources, Constraints, State
from pca_lite.core.enums import AgentType
from pca_lite.workspace.manager import WorkspaceManager


class OrchestratorEngine:
    def __init__(self, workspace: WorkspaceManager):
        self.workspace = workspace

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
                    output="state.json",
                ),
                Step(
                    id="step_1",
                    agent=AgentType.RESEARCHER,
                    task="文献检索与校验（Week 1 stub）",
                    tools=[],
                    input_from=["step_0"],
                    output="literature_pool.json",
                ),
                Step(
                    id="step_2",
                    agent=AgentType.WRITER,
                    task="综述撰写（Week 1 stub）",
                    tools=[],
                    input_from=["step_1"],
                    output="draft.md",
                ),
            ],
        )

    def execute_plan(self, plan: TaskPlan) -> State:
        state_dict = self.workspace.read_json("state.json")
        state = State.model_validate(state_dict)

        for step in plan.steps:
            if step.id in state.completed_steps:
                print(f"[SKIP] 步骤已跳过: {step.id}")
                continue

            for dep in step.input_from:
                if dep not in state.completed_steps:
                    raise ValueError(f"依赖未满足: {step.id} 依赖 {dep}，但 {dep} 未完成")

            state.current_step = step.id
            state.timestamp = datetime.now().isoformat()
            self.workspace.write_json("state.json", state)

            try:
                self.execute_step(step)
                state.completed_steps.append(step.id)
                state.timestamp = datetime.now().isoformat()
                self.workspace.write_json("state.json", state)
            except Exception as e:
                retry_count = state.retry_counts.get(step.id, 0) + 1
                state.retry_counts[step.id] = retry_count
                if retry_count <= plan.constraints.max_retry:
                    print(f"[RETRY] 步骤 {step.id} 失败，重试 ({retry_count}/{plan.constraints.max_retry})")
                    state.timestamp = datetime.now().isoformat()
                    self.workspace.write_json("state.json", state)
                    # Do NOT mark completed — retry is still pending
                else:
                    print(f"[FAIL] 步骤 {step.id} 超过最大重试次数")
                    state.completed_steps.append(step.id)
                    self.workspace.write_json("state.json", state)

        return state

    def execute_step(self, step: Step) -> dict:
        print(f"[EXEC] 步骤 {step.id}: {step.task}")
        import time; time.sleep(0.1)
        return {}

    def resume(self) -> State:
        state_dict = self.workspace.read_json("state.json")
        state = State.model_validate(state_dict)
        tampered = self.workspace.verify_integrity(state)
        if tampered:
            print(f"[WARN] 以下文件已被修改: {tampered}")
            print("[WARN] 建议从头执行，当前将跳过这些文件继续")
        print(f"[RESUME] 从步骤 {state.current_step} 恢复，已完成: {state.completed_steps}")
        return state
