import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, Play, Loader2, Bot, User, CornerDownRight } from 'lucide-react';
import { ChatMessage, VideoDetails } from '../../types';
import { sendChatMessage } from '../services/api';
import { seekYouTubePlayer } from '../services/chrome';

interface ChatTabProps {
  video: VideoDetails | null;
  messages: ChatMessage[];
  onSendMessage: (msg: ChatMessage) => void;
}

const QUICK_PROMPTS = [
  "What is this video about?",
  "Explain the main concept.",
  "What are the important points?",
  "Explain this video like I'm a beginner.",
  "Where is the key topic explained?",
  "What did the speaker conclude?"
];

export const ChatTab: React.FC<ChatTabProps> = ({ video, messages, onSendMessage }) => {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSend = async (textToSend?: string) => {
    const question = (textToSend || input).trim();
    if (!question || !video || isSending) return;

    if (!textToSend) setInput('');

    // User message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: question,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    onSendMessage(userMsg);

    setIsSending(true);

    try {
      const res = await sendChatMessage(video.videoId, question, video.title);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.answer || "I couldn't process this request.",
        timestamps: res.timestamps || [],
        sources: res.sources || [],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      onSendMessage(aiMsg);
    } catch (e: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `Error: ${e.message || "Failed to communicate with EasyText AI."}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      onSendMessage(errorMsg);
    } finally {
      setIsSending(false);
    }
  };

  const parseTextWithTimestamps = (text: string, timestamps?: number[]) => {
    // Regex for ▶ MM:SS or [MM:SS] or MM:SS
    const tsRegex = /(?:▶\s*|\[)?(\d{1,2}:\d{2}(?::\d{2})?)(?:\])?/g;

    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = tsRegex.exec(text)) !== null) {
      // Push text before timestamp
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const tsStr = match[1];
      const timeParts = tsStr.split(':').map(Number);
      let seconds = 0;
      if (timeParts.length === 2) seconds = timeParts[0] * 60 + timeParts[1];
      else if (timeParts.length === 3) seconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];

      parts.push(
        <button
          key={match.index}
          onClick={() => seekYouTubePlayer(seconds)}
          className="inline-flex items-center space-x-1 px-1.5 py-0.5 my-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500 hover:text-white text-indigo-300 font-mono text-[10px] font-semibold border border-indigo-500/30 transition-all"
        >
          <Play className="w-2.5 h-2.5 fill-current" />
          <span>{tsStr}</span>
        </button>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="flex flex-col h-[460px]">
      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 space-y-3.5 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-200">EasyText AI RAG Chatbot</h3>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[250px] mx-auto">
                Ask questions about the current YouTube video. EasyText AI searches exact transcript timestamps.
              </p>
            </div>

            {/* Quick Prompts */}
            <div className="pt-2 text-left">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2 px-1">
                Suggested Questions:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200 transition-all flex items-center space-x-1.5"
                  >
                    <CornerDownRight className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                    <span>{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-2 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'ai' && (
                <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">
                  {parseTextWithTimestamps(msg.text, msg.timestamps)}
                </div>

                {/* Additional Timestamp Jump Badges */}
                {msg.sender === 'ai' && msg.timestamps && msg.timestamps.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-slate-400 font-medium">Jump to video:</span>
                    {msg.timestamps.map((sec, idx) => {
                      const mins = Math.floor(sec / 60);
                      const s = sec % 60;
                      const formatted = `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                      return (
                        <button
                          key={idx}
                          onClick={() => seekYouTubePlayer(sec)}
                          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-indigo-500/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-mono text-[10px] font-semibold border border-indigo-500/30 transition-all"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>{formatted}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 flex-shrink-0 mt-0.5 border border-slate-700">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))
        )}

        {isSending && (
          <div className="flex items-center space-x-2 text-xs text-slate-400 py-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-400 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="italic">EasyText AI is searching transcript...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSending || !video}
            placeholder={video ? "Ask about this video..." : "Detect video first..."}
            className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim() || !video}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white transition-all shadow-md shadow-indigo-600/20"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};

