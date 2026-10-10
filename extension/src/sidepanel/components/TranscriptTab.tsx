import React, { useState } from 'react';
import { FileText, Search, Play, AlertCircle, Loader2 } from 'lucide-react';
import { TranscriptSegment } from '../../types';
import { seekYouTubePlayer } from '../services/chrome';

interface TranscriptTabProps {
  transcript: TranscriptSegment[];
  isLoading: boolean;
  error: string | null;
  onFetchTranscript: () => void;
}

export const TranscriptTab: React.FC<TranscriptTabProps> = ({
  transcript,
  isLoading,
  error,
  onFetchTranscript
}) => {
  const [search, setSearch] = useState('');

  const filtered = transcript.filter((seg) =>
    seg.text.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-indigo-400" />
        <p className="text-xs font-medium">Fetching YouTube captions & timestamps...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center space-y-3">
        <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-slate-200">Transcript Unavailable</h4>
          <p className="text-[11px] text-slate-400 mt-1 max-w-[260px] mx-auto">{error}</p>
        </div>
        <button
          onClick={onFetchTranscript}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (transcript.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400 space-y-3">
        <FileText className="w-8 h-8 mx-auto text-slate-600" />
        <p className="text-xs">No transcript loaded yet.</p>
        <button
          onClick={onFetchTranscript}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
        >
          Load Video Transcript
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search transcript..."
          className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
        <span>Showing {filtered.length} segments</span>
        <span className="text-[10px] text-slate-500">Click timestamp to jump</span>
      </div>

      {/* Transcript list */}
      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {filtered.map((seg, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all flex items-start space-x-2.5 group"
          >
            <button
              onClick={() => seekYouTubePlayer(seg.start)}
              title={`Jump to ${seg.formatted_time}`}
              className="flex-shrink-0 px-2 py-0.5 rounded-md bg-slate-800 group-hover:bg-indigo-600 text-indigo-300 group-hover:text-white font-mono text-[10px] font-semibold flex items-center space-x-1 border border-slate-700/60 transition-all"
            >
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>{seg.formatted_time}</span>
            </button>
            <p className="text-xs text-slate-300 leading-normal flex-1">
              {seg.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

