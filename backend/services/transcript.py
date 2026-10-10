import math
from typing import List, Dict, Any
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound, VideoUnavailable

def format_timestamp(seconds: float) -> str:
    """Format seconds into HH:MM:SS or MM:SS."""
    total_seconds = int(seconds)
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    secs = total_seconds % 60
    
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"

class TranscriptService:
    @staticmethod
    def get_transcript(video_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves transcript for a YouTube video ID.
        Returns list of dicts: [{ start, duration, end, text, formatted_time }]
        """
        try:
            api = YouTubeTranscriptApi()
            
            raw_data = None
            # 1. Try fetching English or preferred languages directly
            try:
                raw_data = api.fetch(video_id, languages=['en', 'en-US', 'en-GB'])
            except Exception:
                pass
                
            # 2. Try fetching default transcript (any language/auto-generated)
            if not raw_data:
                try:
                    raw_data = api.fetch(video_id)
                except Exception:
                    pass

            # 3. Try listing transcripts and picking first available
            if not raw_data:
                try:
                    transcript_list = api.list(video_id)
                    for t in transcript_list:
                        raw_data = t.fetch()
                        if raw_data:
                            break
                except Exception:
                    pass

            if not raw_data:
                raise Exception("No transcript or captions available for this video.")

            formatted_data = []
            for item in raw_data:
                # Support FetchedTranscriptSnippet attributes, dict keys, or tuple
                if hasattr(item, 'text'):
                    text = item.text
                    start = item.start
                    duration = item.duration
                elif isinstance(item, dict):
                    text = item.get('text', '')
                    start = item.get('start', 0.0)
                    duration = item.get('duration', 0.0)
                else:
                    continue
                
                clean_text = str(text).replace('\n', ' ').strip()
                if not clean_text:
                    continue
                    
                start_sec = float(start)
                dur_sec = float(duration)
                
                formatted_data.append({
                    "start": start_sec,
                    "duration": dur_sec,
                    "end": start_sec + dur_sec,
                    "text": clean_text,
                    "formatted_time": format_timestamp(start_sec)
                })

            if not formatted_data:
                raise Exception("Transcript contains no text.")

            return formatted_data

        except (TranscriptsDisabled, NoTranscriptFound):
            raise Exception("Captions/transcripts are disabled or unavailable for this video.")
        except VideoUnavailable:
            raise Exception("The YouTube video is unavailable or private.")
        except Exception as e:
            raise Exception(f"Failed to fetch transcript: {str(e)}")

    @staticmethod
    def chunk_transcript(segments: List[Dict[str, Any]], max_chunk_words: int = 300) -> List[Dict[str, Any]]:
        """
        Groups transcript segments into larger semantic chunks for RAG and long-video AI processing.
        Returns list of chunks with start_time, end_time, text, and formatted range.
        """
        chunks = []
        current_chunk = []
        current_word_count = 0
        
        for seg in segments:
            words = seg["text"].split()
            current_chunk.append(seg)
            current_word_count += len(words)
            
            if current_word_count >= max_chunk_words:
                start_time = current_chunk[0]["start"]
                end_time = current_chunk[-1]["end"]
                combined_text = " ".join([s["text"] for s in current_chunk])
                
                chunks.append({
                    "start_time": start_time,
                    "end_time": end_time,
                    "formatted_start": format_timestamp(start_time),
                    "formatted_end": format_timestamp(end_time),
                    "text": combined_text,
                    "word_count": current_word_count
                })
                
                current_chunk = []
                current_word_count = 0
                
        # Remaining items
        if current_chunk:
            start_time = current_chunk[0]["start"]
            end_time = current_chunk[-1]["end"]
            combined_text = " ".join([s["text"] for s in current_chunk])
            chunks.append({
                "start_time": start_time,
                "end_time": end_time,
                "formatted_start": format_timestamp(start_time),
                "formatted_end": format_timestamp(end_time),
                "text": combined_text,
                "word_count": current_word_count
            })

        return chunks
