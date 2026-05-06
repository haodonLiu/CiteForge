"""Deduplication and clustering for literature entries."""
import re
from typing import Literal

from pca_lite.core.models import LiteratureEntry


class Deduplicator:
    """DOI and title-based deduplication."""

    def deduplicate(self, entries: list[LiteratureEntry]) -> list[LiteratureEntry]:
        """Return deduped list preserving first-seen entry per DOI/title."""
        seen_dois: set[str] = set()
        seen_titles: set[str] = set()
        result: list[LiteratureEntry] = []

        for entry in entries:
            if entry.doi and entry.doi.strip():
                normalized_doi = self._normalize_doi(entry.doi)
                if normalized_doi and normalized_doi in seen_dois:
                    continue
            else:
                normalized_doi = None

            norm_title = self._normalize_title(entry.title)
            if norm_title in seen_titles:
                continue

            if normalized_doi:
                seen_dois.add(normalized_doi)
            seen_titles.add(norm_title)

            result.append(entry)

        return result

    def _normalize_doi(self, doi: str) -> str:
        doi = doi.strip().lower()
        doi = re.sub(r"^https?://doi\.org/", "", doi)
        return doi

    def _normalize_title(self, title: str) -> str:
        title = title.lower().strip()
        title = re.sub(r"[^\w\s]", "", title)
        title = re.sub(r"\s+", " ", title)
        return title


class Clusterer:
    """Embeddings-based clustering (K-Means or HDBSCAN)."""

    def __init__(
        self,
        mode: Literal["kmeans", "hdbscan"] = "kmeans",
        n_clusters: int | None = 5,
        min_cluster_size: int = 3,
    ):
        self.mode = mode
        self.n_clusters = n_clusters
        self.min_cluster_size = min_cluster_size

    def cluster(self, embeddings: list[list[float]]) -> list[int]:
        """Cluster embeddings, return label per embedding.

        Returns:
            List of int cluster labels (same length as embeddings).
            Label -1 means noise (HDBSCAN only).
        """
        if not embeddings:
            return []

        if len(embeddings) < self.min_cluster_size:
            return [0] * len(embeddings)

        if self.mode == "kmeans":
            return self._kmeans(embeddings)
        else:
            return self._hdbscan(embeddings)

    def _kmeans(self, embeddings: list[list[float]]) -> list[int]:
        try:
            from sklearn.cluster import KMeans

            n = min(self.n_clusters or 5, len(embeddings))
            kmeans = KMeans(n_clusters=n, random_state=42, n_init="auto")
            return kmeans.fit_predict(embeddings).tolist()
        except ImportError:
            print("[WARN] scikit-learn not available, using fallback clustering")
            return self._fallback_cluster(embeddings)

    def _hdbscan(self, embeddings: list[list[float]]) -> list[int]:
        try:
            import numpy as np

            from sklearn.cluster import HDBSCAN

            clusterer = HDBSCAN(min_cluster_size=self.min_cluster_size)
            labels = clusterer.fit_predict(np.array(embeddings))
            return labels.tolist()
        except ImportError:
            print("[WARN] scikit-learn not available, using fallback clustering")
            return self._fallback_cluster(embeddings)

    def _fallback_cluster(self, embeddings: list[list[float]]) -> list[int]:
        """Simple equal-size binning fallback (no sklearn needed)."""
        n = min(self.n_clusters or 5, len(embeddings))
        labels = []
        for i in range(len(embeddings)):
            labels.append(i % n)
        return labels