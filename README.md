# EasyText — AI YouTube Assistant

**EasyText** is a modern Chrome Extension (Manifest V3 + React + Side Panel API) powered by a Python (FastAPI) backend. It understands entire YouTube videos to provide comprehensive AI analysis, timestamped timelines, transcripts, study notes, practice quizzes, and a RAG-powered AI chatbot that can jump directly to exact video positions!

---

## Features

- 🎬 **Automatic YouTube Video Detection**: Detects video ID, title, channel, duration, and thumbnail seamlessly. Automatically updates when navigating between YouTube videos while keeping data strictly isolated.
- 📝 **Full Video Summary**: High-level executive summary of the entire video.
- ⏱️ **Timestamped Timeline**: Interactive chapter timeline (`00:00 — Introduction`, `03:25 — Main concept`). Clicking any timestamp jumps the YouTube video player instantly!
- 📜 **Complete Transcript**: Searchable, filterable transcript with timestamp buttons.
- 💡 **Key Points & Important Concepts**: Extracted core takeaways and defined terms/tools/facts.
- 📓 **Structured AI Notes**: Generates study notes with 1-click Markdown (`.md`) and `.json` export options.
- ❓ **Interactive Practice Quiz**: Generates video comprehension questions with instant feedback and timestamp references.
- 💬 **EasyText AI Chatbot (RAG)**: RAG-powered vector search over transcript chunks.
  - Answers questions using video content.
  - Includes clickable timestamp badges (`▶ 12:30`).
  - Responds strictly with *"I couldn't find this information in the video."* if details are missing, preventing hallucinations.
- 🤖 **Configurable AI Engine**: Supports **Ollama** locally out of the box, with built-in support for OpenAI and Gemini cloud APIs.

---

## Project Structure

```text
eazyText/
├── extension/                 # Chrome Extension (Vite + React + TS + Tailwind)
│   ├── public/
│   │   └── manifest.json      # Manifest V3 configuration
│   ├── src/
│   │   ├── background/        # Background service worker (Side panel trigger & updates)
│   │   ├── content/           # Content script (YouTube video detection & seeking)
│   │   ├── sidepanel/         # React UI application
│   │   │   ├── components/    # Overview, Timeline, Transcript, Notes, Quiz, Chat tabs
│   │   │   └── services/      # API client & Chrome tabs messenger
│   │   └── types/             # TypeScript definitions
│   ├── dist/                  # Compiled Chrome Extension build
│   └── package.json
│
└── backend/                   # Python FastAPI Backend
    ├── main.py                # FastAPI entry point
    ├── config.py              # Environment configuration
    ├── requirements.txt
    ├── services/
    │   ├── transcript.py      # YouTube transcript retrieval & chunking
    │   ├── ai.py              # LLM integration (Ollama / OpenAI / Gemini)
    │   └── rag.py             # Vector search engine for transcript retrieval
    └── api/
        ├── video.py           # Video analysis & transcript API endpoints
        └── chat.py            # RAG AI Chatbot endpoint
```

---

## Quick Start Guide

### 1. Start the Backend Server

1. Open a terminal in the project root:
   ```bash
   cd backend
   ```

2. Activate the virtual environment (or create one if needed):
   - **Windows (PowerShell)**:
     ```powershell
     ..\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     source ../venv/bin/activate
     ```

3. Install backend dependencies (already installed):
   ```bash
   pip install -r requirements.txt
   ```

4. Run the FastAPI server:
   ```bash
   python main.py
   ```
   The backend API will start at `http://127.0.0.1:8000`.

---

### 2. Configure AI Providers (Optional)

EasyText automatically connects to **Ollama** locally at `http://localhost:11434` with model `llama3`. If Ollama is not running, it gracefully falls back to intelligent transcript extraction.

To configure cloud providers (OpenAI or Gemini) or change Ollama models, copy or edit `.env` in the `backend/` directory:

```env
# LLM Provider: auto, ollama, openai, gemini
LLM_PROVIDER=auto

# Ollama Settings
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# Cloud API Keys (Optional)
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

---

### 3. Load the Chrome Extension

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the build directory: `c:\Users\visha\OneDrive\Desktop\eazyText\extension\dist`.
5. Open any YouTube video (e.g. `https://www.youtube.com/watch?v=...`).
6. Click the **EasyText** extension icon or open the Chrome **Side Panel**.

---

## Verification & Testing

1. **Backend Health Check**: Navigate to `http://127.0.0.1:8000/` in your browser. It returns `{"status": "online"}`.
2. **Video Detection**: Open a video on YouTube. EasyText automatically populates the video title, thumbnail, channel, and duration.
3. **AI Analysis**: Click **[ Analyze Video ]** to generate the executive summary, chapter timeline, key points, concepts, and study notes.
4. **Seeking YouTube**: Click any timestamp badge (`01:35` or `▶ 12:30`) in the timeline, transcript, or AI chat to jump the YouTube video player to that exact time!
5. **RAG Chatbot**: Ask questions in the **Chat** tab to query the video transcript directly.

