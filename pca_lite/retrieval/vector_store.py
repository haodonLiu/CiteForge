"""Chroma vector store wrapper."""
from pathlib import Path

import chromadb
from chromadb.config import Settings as ChromaSettings

from pca_lite.core.models import EmbeddingConfig


class VectorStore:
    def __init__(
        self,
        persist_dir: str = "./workspace/vector_index",
        collection_name: str = "papers",
    ):
        self.persist_dir = Path(persist_dir)
        self.persist_dir.mkdir(parents=True, exist_ok=True)
        self.collection_name = collection_name
        self.client = chromadb.PersistentClient(
            path=str(self.persist_dir),
            settings=ChromaSettings(allow_reset=True),
        )
        self._collection = None

    @property
    def collection(self):
        if self._collection is None:
            self._collection = self.client.get_or_create_collection(
                name=self.collection_name
            )
        return self._collection

    def add_texts(self, texts: list[str], embeddings: list[list[float]], metadatas: list[dict] | None = None, ids: list[str] | None = None):
        """Add texts with embeddings to the store."""
        if ids is None:
            ids = [f"chunk_{i}" for i in range(len(texts))]
        if metadatas is None:
            metadatas = [{}] * len(texts)

        self.collection.add(
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas,
            ids=ids,
        )

    def search(self, query_embedding: list[float], top_k: int = 5) -> list[dict]:
        """Search for similar texts."""
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
        )
        return [
            {
                "id": results["ids"][0][i],
                "text": results["documents"][0][i],
                "distance": results["distances"][0][i],
                "metadata": results["metadatas"][0][i],
            }
            for i in range(len(results["ids"][0]))
        ]

    def reset(self):
        """Reset the collection (for testing)."""
        self.client.reset()
        self._collection = None
