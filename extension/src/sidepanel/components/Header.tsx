import React from 'react';
import { Sparkles, Activity } from 'lucide-react';

interface HeaderProps {
  backendConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({ backendConnected }) => {
  return (
    <header className="px-4 py-3 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent leading-none">
            EasyText
          </h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide">AI YOUTUBE ASSISTANT</p>
        </div>
      </div>

      <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/50 text-[11px]">
        <span className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
        <span className="text-slate-300 font-medium">
          {backendConnected ? 'API Ready' : 'Connecting...'}
        </span>
      </div>
    </header>
  );
};

