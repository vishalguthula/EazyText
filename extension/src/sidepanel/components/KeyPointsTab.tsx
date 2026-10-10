import React from 'react';
import { Award, BookOpen, CheckCircle2 } from 'lucide-react';
import { AnalysisData } from '../../types';

interface KeyPointsTabProps {
  analysis: AnalysisData | null;
}

export const KeyPointsTab: React.FC<KeyPointsTabProps> = ({ analysis }) => {
  if (!analysis) {
    return (
      <div className="p-6 text-center text-slate-400">
        <Award className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p className="text-xs">Click "Analyze Video" to extract key points and concepts.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Key Takeaways section */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>Key Points & Takeaways</span>
        </div>

        <div className="space-y-2">
          {analysis.key_points.map((point, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 flex items-start space-x-2.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></span>
              <span className="leading-relaxed">{point}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Important Concepts section */}
      {analysis.important_concepts && analysis.important_concepts.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-violet-400">
            <BookOpen className="w-4 h-4" />
            <span>Important Concepts & Terms</span>
          </div>

          <div className="space-y-2.5">
            {analysis.important_concepts.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-violet-500/30 transition-all space-y-1"
              >
                <h4 className="text-xs font-bold text-violet-200">{item.concept}</h4>
                <p className="text-[11px] text-slate-400 leading-normal">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

