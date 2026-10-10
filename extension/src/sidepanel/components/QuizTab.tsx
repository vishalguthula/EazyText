import React, { useState } from 'react';
import { HelpCircle, CheckCircle, XCircle, Play, Loader2, Sparkles } from 'lucide-react';
import { QuizItem, VideoDetails } from '../../types';
import { fetchVideoQuiz } from '../services/api';
import { seekYouTubePlayer } from '../services/chrome';

interface QuizTabProps {
  video: VideoDetails | null;
}

export const QuizTab: React.FC<QuizTabProps> = ({ video }) => {
  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateQuiz = async () => {
    if (!video) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchVideoQuiz(video.videoId, video.title);
      setQuiz(res.quiz || []);
      setSelectedAnswers({});
    } catch (e: any) {
      setError(e.message || "Failed to generate quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  };

  if (!video) {
    return (
      <div className="p-6 text-center text-slate-400">
        <p className="text-xs">No video loaded.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-indigo-400" />
        <p className="text-xs font-medium">Generating practice quiz questions...</p>
      </div>
    );
  }

  if (quiz.length === 0) {
    return (
      <div className="p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-slate-200">Practice Video Quiz</h3>
          <p className="text-[11px] text-slate-400 mt-1 max-w-[260px] mx-auto">
            Test your understanding of the video content with AI-generated questions.
          </p>
        </div>
        {error && <p className="text-[11px] text-red-400">{error}</p>}
        <button
          onClick={handleGenerateQuiz}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 inline-flex items-center space-x-1.5"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate Video Quiz</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400">
          <HelpCircle className="w-4 h-4" />
          <span>Video Practice Quiz ({quiz.length} Questions)</span>
        </div>

        <button
          onClick={handleGenerateQuiz}
          className="text-[10px] text-indigo-300 hover:underline font-medium"
        >
          Regenerate
        </button>
      </div>

      <div className="space-y-4">
        {quiz.map((q) => {
          const selected = selectedAnswers[q.id];
          const hasAnswered = selected !== undefined;

          return (
            <div key={q.id} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-xs font-semibold text-slate-100 leading-snug">
                  {q.id}. {q.question}
                </h4>
                <button
                  onClick={() => seekYouTubePlayer(q.seconds)}
                  className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono text-[10px] flex items-center space-x-1 flex-shrink-0 hover:bg-indigo-500 hover:text-white transition-all"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>{q.timestamp}</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {q.options.map((opt, optIdx) => {
                  const isCorrect = optIdx === q.correct_option;
                  const isSelected = selected === optIdx;

                  let styleClass = "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800";
                  if (hasAnswered) {
                    if (isCorrect) {
                      styleClass = "bg-emerald-500/15 border-emerald-500/40 text-emerald-200 font-medium";
                    } else if (isSelected && !isCorrect) {
                      styleClass = "bg-red-500/15 border-red-500/40 text-red-200";
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={hasAnswered}
                      onClick={() => handleSelectOption(q.id, optIdx)}
                      className={`w-full text-left p-2 rounded-lg border text-xs transition-all flex items-center justify-between space-x-2 ${styleClass}`}
                    >
                      <span>{opt}</span>
                      {hasAnswered && isCorrect && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                      {hasAnswered && isSelected && !isCorrect && <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {hasAnswered && (
                <div className="p-2 rounded-lg bg-slate-950/60 text-[11px] text-slate-400 border border-slate-800/80">
                  <span className="font-semibold text-indigo-300">Explanation: </span>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

