import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import os
import pickle
from typing import List, Dict

class VectorDB:
    def __init__(self, index_path="data/index.faiss", meta_path="data/index.pkl"):
        self.index_path = index_path
        self.meta_path = meta_path
        # Use a small, fast model for demo/local
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.dimension = 384
        
        if os.path.exists(index_path) and os.path.exists(meta_path):
            self.index = faiss.read_index(index_path)
            with open(meta_path, "rb") as f:
                self.metadata = pickle.load(f)
        else:
            self.index = faiss.IndexFlatL2(self.dimension)
            self.metadata = []

    def add_documents(self, texts: List[str], metas: List[Dict]):
        embeddings = self.model.encode(texts)
        self.index.add(np.array(embeddings).astype("float32"))
        self.metadata.extend(metas)
        self.save()

    def search(self, query: str, k: int = 3):
        query_vector = self.model.encode([query])
        distances, indices = self.index.search(np.array(query_vector).astype("float32"), k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx != -1 and idx < len(self.metadata):
                results.append({
                    "content": self.metadata[idx]["content"],
                    "metadata": self.metadata[idx],
                    "score": float(distances[0][i])
                })
        return results

    def reset(self):
        self.index = faiss.IndexFlatL2(self.dimension)
        self.metadata = []
        self.save()

    def save(self):
        os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
        faiss.write_index(self.index, self.index_path)
        with open(self.meta_path, "wb") as f:
            pickle.dump(self.metadata, f)

db_instance = VectorDB()
