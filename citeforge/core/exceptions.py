"""CiteForge exception hierarchy.

All library errors inherit from PCAException.
Agents, ingestion, retrieval, and orchestration use these types.
"""


class PCAException(Exception):
    """Base exception for all CiteForge errors."""

    pass


class ResourceNotFoundError(PCAException):
    """A required file or resource was not found."""

    pass


class ExtractionError(PCAException):
    """PDF text extraction or parsing failed."""

    pass


class LLMError(PCAException):
    """LLM API call failed after retries."""

    pass


class LLMTimeoutError(LLMError):
    """LLM request timed out."""

    pass


class SearchError(PCAException):
    """Web search provider failed."""

    pass


class PipelineError(PCAException):
    """A pipeline step failed (used by orchestrator)."""

    pass


class ValidationError(PCAException):
    """Input validation failed."""

    pass
