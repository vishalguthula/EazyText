import React from 'react';
import { Clock, Play, ListOrdered } from 'lucide-react';
import { TimelineItem } from '../../types';
import { seekYouTubePlayer } from '../services/chrome';

interface TimelineTabProps {
  timeline: TimelineItem[];
}

export const TimelineTab: React.FC<TimelineTabProps> = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400">
        <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p className="text-xs">No timeline generated yet. Click "Analyze Video".</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
        <div className="flex items-center space-x-1.5 font-semibold text-slate-300">
          <ListOrdered className="w-4 h-4 text-indigo-400" />
          <span>Interactive Timeline</span>
        </div>
        <span className="text-[11px] text-slate-500">Click time to jump</span>
      </div>

      <div className="relative border-l-2 border-indigo-500/20 ml-3 pl-4 space-y-3">
        {timeline.map((item, idx) => (
          <div key={idx} className="relative group">
            {/* Timeline bullet icon */}
            <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-slate-900 border-2 border-indigo-500 group-hover:scale-125 group-hover:bg-indigo-500 transition-all"></div>

            <button
              onClick={() => seekYouTubePlayer(item.seconds)}
              className="w-full p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-left transition-all flex items-start justify-between space-x-3 group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-200 group-hover:text-indigo-200 transition-colors leading-snug">
                  {item.title}
                </p>
              </div>

              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 font-mono text-[11px] font-semibold border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-all flex-shrink-0">
                <Play className="w-3 h-3 fill-current" />
                <span>{item.time}</span>
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

