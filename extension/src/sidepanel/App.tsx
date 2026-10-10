import React, { useState, useEffect } from 'react';
import {
  AlignLeft,
  Clock,
  FileText,
  Award,
  Notebook,
  HelpCircle,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { VideoDetails, AnalysisData, TranscriptSegment, ChatMessage } from '../types';
import { Header } from './components/Header';
import { VideoCard } from './components/VideoCard';
import { OverviewTab } from './components/OverviewTab';
import { TimelineTab } from './components/TimelineTab';
import { TranscriptTab } from './components/TranscriptTab';
import { KeyPointsTab } from './components/KeyPointsTab';
import { NotesTab } from './components/NotesTab';
import { QuizTab } from './components/QuizTab';
import { ChatTab } from './components/ChatTab';
import { getCurrentYouTubeVideo } from './services/chrome';
import { checkBackendHealth, fetchVideoAnalysis, fetchVideoTranscript } from './services/api';

export const App: React.FC = () => {
  const [video, setVideo] = useState<VideoDetails | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFetchingTranscript, setIsFetchingTranscript] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [backendConnected, setBackendConnected] = useState(false);

  // Check backend health periodically
  useEffect(() => {
    const verifyHealth = async () => {
      const isOk = await checkBackendHealth();
      setBackendConnected(isOk);
    };
    verifyHealth();
    const interval = setInterval(verifyHealth, 3000);
    return () => clearInterval(interval);
  }, []);

  // Detect current video on load
  const loadCurrentVideo = async () => {
    const details = await getCurrentYouTubeVideo();
    if (details) {
      if (!video || video.videoId !== details.videoId) {
        // Reset state for new video to prevent data mixing!
        setVideo(details);
        setAnalysis(null);
        setTranscript([]);
        setChatMessages([]);
        setTranscriptError(null);
        setAnalysisError(null);
      }
    }
  };

  useEffect(() => {
    loadCurrentVideo();

    // Listen for YOUTUBE_NAVIGATED event from background worker
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      const listener = (message: any) => {
        if (message.type === 'VIDEO_CHANGED' && message.videoDetails) {
          const newVid = message.videoDetails;
          setVideo((prev: VideoDetails | null) => {
            if (!prev || prev.videoId !== newVid.videoId) {
              setAnalysis(null);
              setTranscript([]);
              setChatMessages([]);
              setTranscriptError(null);
              setAnalysisError(null);
              return newVid;
            }
            return prev;
          });
        }
      };
      chrome.runtime.onMessage.addListener(listener);
      return () => chrome.runtime.onMessage.removeListener(listener);
    }
  }, []);

  const handleFetchTranscript = async () => {
    if (!video) return;
    setIsFetchingTranscript(true);
    setTranscriptError(null);
    try {
      const res = await fetchVideoTranscript(video.videoId);
      setTranscript(res.transcript || []);
    } catch (e: any) {
      setTranscriptError(e.message || "Failed to retrieve video transcript.");
    } finally {
      setIsFetchingTranscript(false);
    }
  };

  const handleAnalyzeVideo = async () => {
    if (!video) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      // 1. Ensure transcript is fetched
      let currentTranscript = transcript;
      if (currentTranscript.length === 0) {
        try {
          const res = await fetchVideoTranscript(video.videoId);
          currentTranscript = res.transcript || [];
          setTranscript(currentTranscript);
        } catch (err: any) {
          setTranscriptError(err.message);
        }
      }

      // 2. Perform AI analysis
      const analysisRes = await fetchVideoAnalysis(video.videoId, video.title, video.channel);
      if (analysisRes.analysis) {
        setAnalysis(analysisRes.analysis);
      }
    } catch (e: any) {
      setAnalysisError(e.message || "Failed to analyze video");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: AlignLeft },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'transcript', label: 'Transcript', icon: FileText },
    { id: 'keypoints', label: 'Key Points', icon: Award },
    { id: 'notes', label: 'Notes', icon: Notebook },
    { id: 'quiz', label: 'Quiz', icon: HelpCircle },
    { id: 'chat', label: 'Chat', icon: MessageSquare }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500">
      {/* Header */}
      <Header backendConnected={backendConnected} />

      {/* Backend Offline Warning Banner */}
      {!backendConnected && (
        <div className="mx-4 mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-2 text-amber-300 text-[11px]">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
          <div>
            <p className="font-semibold">Backend API Server is Offline</p>
            <p className="text-[10px] text-amber-300/80 mt-0.5">
              Run <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-200">python main.py</code> in the backend folder to enable AI features.
            </p>
          </div>
        </div>
      )}

      {/* Analysis Error Banner */}
      {analysisError && (
        <div className="mx-4 mt-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-[11px]">
          <p className="font-semibold">Analysis Failed</p>
          <p className="text-[10px] text-red-300/80 mt-0.5">{analysisError}</p>
        </div>
      )}

      {/* Current Video Info Card */}
      <VideoCard
        video={video}
        onAnalyze={handleAnalyzeVideo}
        onRefresh={loadCurrentVideo}
        isAnalyzing={isAnalyzing}
        hasAnalyzed={!!analysis}
      />

      {/* Navigation Tabs Bar */}
      <div className="px-3 border-b border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center space-x-1 overflow-x-auto py-1.5 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'transcript' && transcript.length === 0 && !isFetchingTranscript) {
                    handleFetchTranscript();
                  }
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="flex-1 pb-4">
        {activeTab === 'overview' && (
          <OverviewTab analysis={analysis} onNavigateTab={(t: string) => setActiveTab(t)} />
        )}
        {activeTab === 'timeline' && (
          <TimelineTab timeline={analysis?.timeline || []} />
        )}
        {activeTab === 'transcript' && (
          <TranscriptTab
            transcript={transcript}
            isLoading={isFetchingTranscript}
            error={transcriptError}
            onFetchTranscript={handleFetchTranscript}
          />
        )}
        {activeTab === 'keypoints' && (
          <KeyPointsTab analysis={analysis} />
        )}
        {activeTab === 'notes' && (
          <NotesTab analysis={analysis} video={video} />
        )}
        {activeTab === 'quiz' && (
          <QuizTab video={video} />
        )}
        {activeTab === 'chat' && (
          <ChatTab
            video={video}
            messages={chatMessages}
            onSendMessage={(msg: ChatMessage) => setChatMessages((prev) => [...prev, msg])}
          />
        )}
      </main>
    </div>
  );
};
