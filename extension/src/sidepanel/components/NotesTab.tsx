import React, { useState } from 'react';
import { Notebook, Download, Check, FileCode, FileText } from 'lucide-react';
import { AnalysisData, VideoDetails } from '../../types';
import { exportVideoNotes } from '../services/api';

interface NotesTabProps {
  analysis: AnalysisData | null;
  video: VideoDetails | null;
}

export const NotesTab: React.FC<NotesTabProps> = ({ analysis, video }) => {
  const [copied, setCopied] = useState(false);

  if (!analysis || !analysis.notes) {
    return (
      <div className="p-6 text-center text-slate-400">
        <Notebook className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p className="text-xs">Click "Analyze Video" to generate AI study notes.</p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(analysis.notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async (format: 'markdown' | 'json') => {
    if (!video) return;
    try {
      const res = await exportVideoNotes(
        video.videoId,
        video.title,
        analysis.summary,
        analysis.notes,
        format
      );
      const blob = new Blob([res.content], { type: res.mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to export notes");
    }
  };

  return (
    <div className="p-4 space-y-3">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400">
          <Notebook className="w-4 h-4" />
          <span>Structured Study Notes</span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handleCopy}
            className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-medium border border-slate-700 flex items-center space-x-1"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <span>Copy</span>
            )}
          </button>

          <button
            onClick={() => handleExport('markdown')}
            title="Download Markdown"
            className="px-2 py-1 rounded-md bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-[10px] font-medium border border-indigo-500/30 flex items-center space-x-1"
          >
            <Download className="w-3 h-3" />
            <span>.MD</span>
          </button>

          <button
            onClick={() => handleExport('json')}
            title="Download JSON"
            className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium border border-slate-700 flex items-center space-x-1"
          >
            <FileCode className="w-3 h-3" />
            <span>.JSON</span>
          </button>
        </div>
      </div>

      {/* Notes container */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[420px] overflow-y-auto">
        {analysis.notes}
      </div>
    </div>
  );
};

