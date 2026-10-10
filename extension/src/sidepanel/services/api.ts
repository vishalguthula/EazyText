const API_BASE = "http://127.0.0.1:8000";

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: "GET" });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function fetchVideoTranscript(videoId: string) {
  try {
    const res = await fetch(`${API_BASE}/api/video/transcript`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ video_id: videoId })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: "Failed to fetch transcript" }));
      throw new Error(errData.detail || "Transcript unavailable");
    }
    return await res.json();
  } catch (e: any) {
    if (e.message === "Failed to fetch" || e.name === "TypeError") {
      throw new Error("Backend API server is offline. Please run 'python main.py' in the backend folder.");
    }
    throw e;
  }
}

export async function fetchVideoAnalysis(videoId: string, title: string, channel: string) {
  try {
    const res = await fetch(`${API_BASE}/api/video/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ video_id: videoId, title, channel })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: "Analysis failed" }));
      throw new Error(errData.detail || "Failed to analyze video");
    }
    return await res.json();
  } catch (e: any) {
    if (e.message === "Failed to fetch" || e.name === "TypeError") {
      throw new Error("Backend API server is offline. Please run 'python main.py' in the backend folder.");
    }
    throw e;
  }
}

export async function sendChatMessage(videoId: string, question: string, title: string) {
  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ video_id: videoId, question, title })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: "Chat request failed" }));
      throw new Error(errData.detail || "EasyText AI chat error");
    }
    return await res.json();
  } catch (e: any) {
    if (e.message === "Failed to fetch" || e.name === "TypeError") {
      throw new Error("Backend API server is offline. Please run 'python main.py' in the backend folder.");
    }
    throw e;
  }
}

export async function fetchVideoQuiz(videoId: string, title: string) {
  try {
    const res = await fetch(`${API_BASE}/api/video/quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ video_id: videoId, title })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: "Quiz generation failed" }));
      throw new Error(errData.detail || "Failed to generate quiz");
    }
    return await res.json();
  } catch (e: any) {
    if (e.message === "Failed to fetch" || e.name === "TypeError") {
      throw new Error("Backend API server is offline. Please run 'python main.py' in the backend folder.");
    }
    throw e;
  }
}

export async function exportVideoNotes(videoId: string, title: string, summary: string, notes: string, format: "markdown" | "json") {
  const res = await fetch(`${API_BASE}/api/video/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ video_id: videoId, title, summary, notes, format })
  });
  if (!res.ok) {
    throw new Error("Export failed");
  }
  return res.json();
}
