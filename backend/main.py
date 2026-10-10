from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.video import router as video_router
from api.chat import router as chat_router
from config import settings

app = FastAPI(
    title="EasyText Backend API",
    description="Backend API for EasyText AI YouTube Assistant",
    version="1.0.0"
)

# Enable CORS for Chrome Extensions and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow chrome-extension:// origins and local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(video_router)
app.include_router(chat_router)

@app.get("/")
def root():
    return {
        "status": "online",
        "app": "EasyText API",
        "llm_provider": settings.LLM_PROVIDER,
        "ollama_url": settings.OLLAMA_BASE_URL
    }

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)

