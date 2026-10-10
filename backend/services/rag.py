from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class RAGEngine:
    def __init__(self):
        # Store index structures per video_id: { video_id: { "chunks": [...], "vectorizer": TfidfVectorizer, "matrix": matrix } }
        self._indexes: Dict[str, Dict[str, Any]] = {}

    def index_transcript(self, video_id: str, chunks: List[Dict[str, Any]]):
        """Indexes transcript chunks for a video using TF-IDF + Cosine similarity vector search."""
        if not chunks:
            return

        corpus = [chunk["text"] for chunk in chunks]
        
        # Fit vectorizer with n-grams up to 2 for better phrase matching
        vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
        tfidf_matrix = vectorizer.fit_transform(corpus)
        
        self._indexes[video_id] = {
            "chunks": chunks,
            "vectorizer": vectorizer,
            "matrix": tfidf_matrix
        }

    def is_indexed(self, video_id: str) -> bool:
        return video_id in self._indexes

    def search(self, video_id: str, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        """
        Searches transcript chunks for a given video_id and query.
        Returns list of relevant chunks with score and timestamp info.
        """
        if video_id not in self._indexes:
            return []

        index_data = self._indexes[video_id]
        chunks = index_data["chunks"]
        vectorizer = index_data["vectorizer"]
        tfidf_matrix = index_data["matrix"]

        # Vectorize query
        query_vec = vectorizer.transform([query])
        
        # Compute cosine similarity
        similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
        
        # Sort indices by similarity descending
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            score = float(similarities[idx])
            # Only include results with some relevance or top matching
            chunk = chunks[idx].copy()
            chunk["score"] = score
            results.append(chunk)

        # Sort selected results chronologically by start_time for cohesive context
        results.sort(key=lambda x: x["start_time"])
        return results

    def get_context_str(self, video_id: str, query: str, top_k: int = 4) -> str:
        """Retrieves and formats context for LLM prompt."""
        matches = self.search(video_id, query, top_k=top_k)
        if not matches:
            return "No matching transcript excerpts found."

        context_lines = []
        for m in matches:
            context_lines.append(f"[{m['formatted_start']} - {m['formatted_end']}]: {m['text']}")
            
        return "\n\n".join(context_lines)

rag_engine = RAGEngine()

