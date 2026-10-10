from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from services.transcript import TranscriptService
from services.ai import AIService
from services.rag import rag_engine

router = APIRouter(prefix="/api/video", tags=["video"])

class VideoRequest(BaseModel):
    video_id: str
    title: Optional[str] = "YouTube Video"
    channel: Optional[str] = ""
    description: Optional[str] = ""

class ExportRequest(BaseModel):
    video_id: str
    title: Optional[str] = "YouTube Video"
    notes: Optional[str] = ""
    summary: Optional[str] = ""
    format: str = "markdown"

@router.post("/transcript")
def get_transcript(req: VideoRequest):
    """Retrieves full timestamped transcript and indexes it into RAG engine."""
    try:
        segments = TranscriptService.get_transcript(req.video_id)
        chunks = TranscriptService.chunk_transcript(segments)
        
        # Index in RAG engine (isolated per video_id)
        rag_engine.index_transcript(req.video_id, chunks)
        
        return {
            "success": True,
            "video_id": req.video_id,
            "count": len(segments),
            "transcript": segments
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/analyze")
async def analyze_video(req: VideoRequest):
    """Generates full AI analysis (summary, timeline, key points, concepts, notes)."""
    try:
        # Fetch transcript
        segments = TranscriptService.get_transcript(req.video_id)
        chunks = TranscriptService.chunk_transcript(segments)
        
        # Ensure indexed in RAG engine under video_id
        rag_engine.index_transcript(req.video_id, chunks)
        
        # Generate AI analysis
        analysis = await AIService.analyze_video(
            video_title=req.title or "YouTube Video",
            channel=req.channel or "",
            description=req.description or "",
            segments=segments
        )
        
        return {
            "success": True,
            "video_id": req.video_id,
            "analysis": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/quiz")
async def generate_quiz(req: VideoRequest):
    """Generates interactive quiz based on video transcript."""
    try:
        segments = TranscriptService.get_transcript(req.video_id)
        quiz = await AIService.generate_quiz(req.title or "YouTube Video", segments)
        return {
            "success": True,
            "video_id": req.video_id,
            "quiz": quiz
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/export")
def export_content(req: ExportRequest):
    """Exports notes and video analysis."""
    if req.format.lower() == "markdown":
        content = f"# EasyText Export: {req.title}\n\n"
        if req.summary:
            content += f"## Summary\n{req.summary}\n\n"
        if req.notes:
            content += f"## Study Notes\n{req.notes}\n"
        filename = f"{req.video_id}_notes.md"
        mime = "text/markdown"
    else:
        import json
        content = json.dumps({
            "video_id": req.video_id,
            "title": req.title,
            "summary": req.summary,
            "notes": req.notes
        }, indent=2)
        filename = f"{req.video_id}_notes.json"
        mime = "application/json"

    return {
        "success": True,
        "filename": filename,
        "content": content,
        "mime": mime
    }
