from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from services.transcript import TranscriptService
from services.ai import AIService
from services.rag import rag_engine

router = APIRouter(prefix="/api", tags=["chat"])

class ChatRequest(BaseModel):
    video_id: str
    question: str
    title: Optional[str] = "YouTube Video"

@router.post("/chat")
async def chat_with_video(req: ChatRequest):
    """
    RAG Chat Endpoint.
    1. Indexes transcript if not present in memory.
    2. Retrieves top relevant transcript chunks via vector similarity search.
    3. Prompts LLM to answer using only retrieved context.
    4. Returns answer + clickable timestamps.
    """
    if not req.video_id:
        raise HTTPException(status_code=400, detail="video_id is required")

    try:
        # Check if RAG index exists for video
        if not rag_engine.is_indexed(req.video_id):
            try:
                segments = TranscriptService.get_transcript(req.video_id)
                chunks = TranscriptService.chunk_transcript(segments)
                rag_engine.index_transcript(req.video_id, chunks)
            except Exception as e:
                return {
                    "success": False,
                    "answer": f"Could not retrieve transcript for this video: {str(e)}",
                    "timestamps": []
                }

        # Perform RAG retrieval
        context_chunks = rag_engine.search(req.video_id, req.question, top_k=4)

        # Generate timestamped answer
        chat_res = await AIService.answer_chat_question(
            question=req.question,
            video_title=req.title or "YouTube Video",
            context_chunks=context_chunks
        )

        return {
            "success": True,
            "video_id": req.video_id,
            "question": req.question,
            "answer": chat_res["answer"],
            "timestamps": chat_res["timestamps"],
            "sources": [
                {
                    "start": c["formatted_start"],
                    "end": c["formatted_end"],
                    "seconds": int(c["start_time"]),
                    "text": c["text"]
                }
                for c in context_chunks
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

