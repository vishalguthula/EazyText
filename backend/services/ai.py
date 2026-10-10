import json
import re
import httpx
from typing import List, Dict, Any, Optional
from config import settings
from services.transcript import format_timestamp

class AIService:
    @staticmethod
    async def _call_ollama(prompt: str, system_prompt: str = "") -> str:
        """Calls Ollama HTTP API."""
        url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/generate"
        payload = {
            "model": settings.OLLAMA_MODEL,
            "prompt": prompt,
            "system": system_prompt,
            "stream": False
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                return data.get("response", "")
            else:
                raise Exception(f"Ollama API error {resp.status_code}: {resp.text}")

    @staticmethod
    async def _call_openai(prompt: str, system_prompt: str = "") -> str:
        """Calls OpenAI Chat Completion API."""
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": settings.OPENAI_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]
            else:
                raise Exception(f"OpenAI API error {resp.status_code}: {resp.text}")

    @staticmethod
    async def _call_gemini(prompt: str, system_prompt: str = "") -> str:
        """Calls Gemini API."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
        payload = {
            "contents": [{
                "parts": [{"text": f"{system_prompt}\n\n{prompt}"}]
            }]
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]
            else:
                raise Exception(f"Gemini API error {resp.status_code}: {resp.text}")

    @classmethod
    async def generate_text(cls, prompt: str, system_prompt: str = "") -> str:
        """Dispatches prompt to configured or available AI provider."""
        provider = settings.LLM_PROVIDER.lower()
        
        if provider == "ollama":
            return await cls._call_ollama(prompt, system_prompt)
        elif provider == "openai" and settings.OPENAI_API_KEY:
            return await cls._call_openai(prompt, system_prompt)
        elif provider == "gemini" and settings.GEMINI_API_KEY:
            return await cls._call_gemini(prompt, system_prompt)
        elif provider == "auto":
            try:
                return await cls._call_ollama(prompt, system_prompt)
            except Exception:
                if settings.GEMINI_API_KEY:
                    try:
                        return await cls._call_gemini(prompt, system_prompt)
                    except Exception:
                        pass
                if settings.OPENAI_API_KEY:
                    try:
                        return await cls._call_openai(prompt, system_prompt)
                    except Exception:
                        pass
                return cls._fallback_analysis_response(prompt)
        else:
            return cls._fallback_analysis_response(prompt)

    @classmethod
    def _fallback_analysis_response(cls, prompt: str) -> str:
        return ""

    @classmethod
    async def analyze_video(cls, video_title: str, channel: str, description: str, segments: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes video transcript & description.
        Returns JSON analysis object.
        """
        full_text_parts = []
        last_recorded_time = -90.0
        timeline_candidates = []
        
        for seg in segments:
            full_text_parts.append(f"[{seg['formatted_time']}] {seg['text']}")
            if seg['start'] - last_recorded_time >= 75.0:
                timeline_candidates.append({
                    "time": seg['formatted_time'],
                    "seconds": int(seg['start']),
                    "text": seg['text']
                })
                last_recorded_time = seg['start']

        transcript_preview = "\n".join(full_text_parts[:400])
        desc_preview = description[:800] if description else "No video description provided."

        system_prompt = (
            "You are EasyText AI, an expert YouTube video analyzer. "
            "Respond strictly in valid JSON format matching the requested schema."
        )

        user_prompt = f"""Analyze the following YouTube video.
Video Title: {video_title}
Channel: {channel}
Video Description:
{desc_preview}

Transcript snippet with timestamps:
{transcript_preview}

Output a single JSON object with EXACTLY the following structure:
{{
  "summary": "Comprehensive 3-4 sentence overview of what the video is about.",
  "timeline": [
    {{"time": "00:00", "seconds": 0, "title": "Introduction to the topic"}},
    {{"time": "01:30", "seconds": 90, "title": "Key Concept Explanation"}}
  ],
  "key_points": [
    "Key takeaways and takeaways from the video."
  ],
  "important_concepts": [
    {{"concept": "Concept Name", "detail": "Definition or explanation from video."}}
  ],
  "notes": "# Study Notes\\n\\n## Summary\\n...\\n\\n## Core Topics\\n- Point 1\\n- Point 2"
}}
JSON:"""

        try:
            raw_response = await cls.generate_text(user_prompt, system_prompt)
            json_match = re.search(r'\{.*\}', raw_response, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group(0))
                if isinstance(parsed, dict) and "summary" in parsed:
                    return parsed
        except Exception as e:
            print(f"LLM JSON parsing error: {e}")

        return cls._create_heuristic_analysis(video_title, description, segments, timeline_candidates)

    @classmethod
    def _create_heuristic_analysis(cls, video_title: str, description: str, segments: List[Dict[str, Any]], timeline_candidates: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Creates intelligent structured fallback analysis directly from transcript & description."""
        if not segments:
            summary_text = description[:250] if description else f"Video analysis for '{video_title}'."
            return {
                "summary": summary_text,
                "timeline": [{"time": "00:00", "seconds": 0, "title": "Video Start"}],
                "key_points": ["No transcript text available."],
                "important_concepts": [],
                "notes": f"# Study Notes\n{description[:500]}"
            }

        timeline = []
        for i, cand in enumerate(timeline_candidates[:8]):
            text_snippet = cand["text"]
            title_clean = text_snippet[:60].strip() + ("..." if len(text_snippet) > 60 else "")
            timeline.append({
                "time": cand["time"],
                "seconds": cand["seconds"],
                "title": title_clean if i > 0 else "Introduction & Overview"
            })

        if not timeline:
            timeline.append({"time": "00:00", "seconds": 0, "title": "Introduction & Overview"})

        intro_texts = [s["text"] for s in segments[:15]]
        combined_intro = " ".join(intro_texts)
        
        if description and len(description) > 30:
            summary = f"{description[:200]}... {combined_intro[:150]}"
        else:
            summary = f"This video '{video_title}' covers key concepts and insights. {combined_intro[:250]}..."

        step = max(1, len(segments) // 5)
        key_points = []
        for i in range(0, len(segments), step):
            seg_text = segments[i]["text"]
            if len(seg_text) > 20:
                key_points.append(f"[{segments[i]['formatted_time']}] {seg_text[:120]}...")
            if len(key_points) >= 5:
                break

        important_concepts = [
            {"concept": "Main Topic", "detail": f"Overview of {video_title}."}
        ]
        if len(segments) > 10:
            important_concepts.append({
                "concept": "Key Concept",
                "detail": segments[min(10, len(segments)-1)]["text"][:150]
            })

        notes = f"""# EasyText Study Notes: {video_title}

## Summary
{summary}

## Key Highlights & Timeline
""" + "\n".join([f"- **{t['time']}**: {t['title']}" for t in timeline]) + f"""

## Key Takeaways
""" + "\n".join([f"- {kp}" for kp in key_points])

        return {
            "summary": summary,
            "timeline": timeline,
            "key_points": key_points,
            "important_concepts": important_concepts,
            "notes": notes
        }

    @classmethod
    async def answer_chat_question(cls, question: str, video_title: str, context_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Answers a user question based strictly on RAG transcript context chunks.
        Returns: { "answer": str, "timestamps": [int, int] }
        """
        if not context_chunks:
            return {
                "answer": "I couldn't find this information in the video.",
                "timestamps": []
            }

        context_text = "\n\n".join([
            f"[{c['formatted_start']} - {c['formatted_end']}]: {c['text']}" for c in context_chunks
        ])

        system_prompt = (
            "You are EasyText AI, an intelligent YouTube assistant. "
            "Your job is to answer user questions accurately based ONLY on the provided video transcript excerpts.\n"
            "CRITICAL RULES:\n"
            "1. Only answer based on the given transcript excerpts.\n"
            "2. If the user's question cannot be answered using the transcript excerpts, respond EXACTLY with:\n"
            "   \"I couldn't find this information in the video.\"\n"
            "3. Include relevant timestamps in your response using format ▶ MM:SS or [MM:SS] whenever possible.\n"
            "4. Do NOT hallucinate or assume facts not present in the transcript."
        )

        user_prompt = f"""Video Title: {video_title}

Transcript Excerpts:
{context_text}

User Question: {question}

Answer:"""

        try:
            response_text = await cls.generate_text(user_prompt, system_prompt)
            if response_text.strip():
                ts_matches = re.findall(r'(?:▶\s*|\[)?(\d{1,2}:\d{2}(?::\d{2})?)(?:\])?', response_text)
                seconds_list = []
                for ts in ts_matches:
                    parts = list(map(int, ts.split(':')))
                    if len(parts) == 2:
                        seconds_list.append(parts[0]*60 + parts[1])
                    elif len(parts) == 3:
                        seconds_list.append(parts[0]*3600 + parts[1]*60 + parts[2])

                if not seconds_list and context_chunks:
                    top_chunk = context_chunks[0]
                    seconds_list.append(int(top_chunk["start_time"]))

                return {
                    "answer": response_text.strip(),
                    "timestamps": list(set(seconds_list))
                }
        except Exception as e:
            print(f"Error calling LLM for chat: {e}")

        best_chunk = context_chunks[0]
        match_time = best_chunk["formatted_start"]
        sec = int(best_chunk["start_time"])
        
        if best_chunk.get("score", 0) > 0.05:
            return {
                "answer": f"Based on the video at ▶ {match_time}:\n\n\"{best_chunk['text']}\"",
                "timestamps": [sec]
            }
        else:
            return {
                "answer": "I couldn't find this information in the video.",
                "timestamps": []
            }

    @classmethod
    async def generate_quiz(cls, video_title: str, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generates quiz questions based on transcript."""
        if not segments:
            return []

        step = max(1, len(segments) // 4)
        quiz_items = []
        
        for idx, i in enumerate(range(0, len(segments), step)):
            if idx >= 4:
                break
            seg = segments[i]
            time_str = seg["formatted_time"]
            sec = int(seg["start"])
            text = seg["text"]
            
            quiz_items.append({
                "id": idx + 1,
                "question": f"At {time_str}, what key detail is discussed regarding: '{text[:50]}...'?",
                "options": [
                    text[:80],
                    "An unrelated discussion on software development.",
                    "A summary of video metadata.",
                    "None of the above."
                ],
                "correct_option": 0,
                "explanation": f"Discussed around {time_str}: \"{text}\"",
                "timestamp": time_str,
                "seconds": sec
            })

        return quiz_items
