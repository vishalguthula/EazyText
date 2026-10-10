import React from 'react';
import { Youtube, Play, Loader2, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { VideoDetails } from '../../types';

interface VideoCardProps {
  video: VideoDetails | null;
  onAnalyze: () => void;
  onRefresh: () => void;
  isAnalyzing: boolean;
  hasAnalyzed: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onAnalyze,
  onRefresh,
  isAnalyzing,
  hasAnalyzed
}) => {
  if (!video) {
    return (
      <div className="m-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-amber-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-200">No YouTube Video Detected</h3>
          <p className="text-xs text-slate-400 mt-1">
            Open a video on YouTube (youtube.com/watch?v=...) to use EasyText.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="inline-flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Check Current Tab</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mx-4 my-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-md">
      <div className="flex items-start space-x-3">
        {video.thumbnail ? (
          <div className="relative group flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border border-slate-700/50 bg-slate-950">
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <Play className="w-5 h-5 text-white drop-shadow-md opacity-80" />
            </div>
            {video.duration && (
              <span className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 text-[9px] font-mono text-slate-200 rounded">
                {video.duration}
              </span>
            )}
          </div>
        ) : (
          <div className="w-24 h-16 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0">
            <Youtube className="w-8 h-8" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1 text-[10px] text-indigo-400 font-semibold uppercase tracking-wider mb-0.5">
            <Youtube className="w-3 h-3 text-red-500" />
            <span>Current Video</span>
          </div>
          <h2 className="text-xs font-semibold text-slate-100 leading-snug line-clamp-2" title={video.title}>
            {video.title}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{video.channel}</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-md ${
            hasAnalyzed
              ? 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
          }`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Analyzing Video...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>{hasAnalyzed ? 'Re-Analyze Video' : 'Analyze Video'}</span>
            </>
          )}
        </button>

        <button
          onClick={onRefresh}
          title="Detect Current Video"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/50 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

