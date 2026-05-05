from enum import Enum


# Task execution status
class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


# Agent role types
class AgentType(str, Enum):
    PREPROCESSOR = "preprocessor"
    RESEARCHER = "researcher"
    ANALYST = "analyst"
    WRITER = "writer"
    ORCHESTRATOR = "orchestrator"


# Validation result
class ReviewResult(str, Enum):
    PASS = "pass"
    FAIL = "fail"
    NEEDS_RETRY = "needs_retry"
