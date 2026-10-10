import React from 'react';
import { FileText, Clock, AlignLeft, Award } from 'lucide-react';
import { AnalysisData } from '../../types';

interface OverviewTabProps {
  analysis: AnalysisData | null;
  onNavigateTab: (tab: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ analysis, onNavigateTab }) => {
  if (!analysis) {
    return (
      <div className="p-6 text-center text-slate-400">
        <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p className="text-xs">Click "Analyze Video" above to generate a full video overview.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Video Summary Card */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
        <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold">
          <AlignLeft className="w-4 h-4" />
          <span>Executive Summary</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-normal">
          {analysis.summary}
        </p>
      </div>

      {/* Highlights Quick Stats */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => onNavigateTab('timeline')}
          className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/30 text-left transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center space-x-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Timeline</span>
            </span>
            <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded">
              {analysis.timeline.length} chapters
            </span>
          </div>
          <p className="text-[11px] text-slate-400 line-clamp-1 group-hover:text-slate-200">
            {analysis.timeline[0]?.title || 'Jump to key parts'}
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('keypoints')}
          className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-emerald-500/30 text-left transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center space-x-1.5 font-medium">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>Key Points</span>
            </span>
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded">
              {analysis.key_points.length} extracted
            </span>
          </div>
          <p className="text-[11px] text-slate-400 line-clamp-1 group-hover:text-slate-200">
            {analysis.key_points[0] || 'Core takeaways'}
          </p>
        </button>
      </div>
    </div>
  );
};

