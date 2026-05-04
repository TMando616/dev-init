'use client';

import React from 'react';
import { Terminal, Trash2, AlertCircle } from 'lucide-react';
import { Button } from './ui';

interface ConsoleProps {
  logs: string[];
  error?: string;
  onClear: () => void;
}

export const Console: React.FC<ConsoleProps> = ({ logs, error, onClear }) => {
  return (
    <div className="flex flex-col h-full bg-slate-950 border-t border-slate-800 font-mono text-sm">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2 text-slate-400">
          <Terminal size={14} />
          <span className="text-[10px] uppercase tracking-wider font-sans font-bold">Console</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClear}
          className="h-6 px-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
        >
          <Trash2 size={12} className="mr-1.5" />
          Clear
        </Button>
      </div>

      {/* Console Output */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {logs.length === 0 && !error && (
          <p className="text-slate-600 italic">No output. Click &quot;Run&quot; to execute your code.</p>
        )}
        
        {logs.map((log, index) => (
          <div key={index} className="text-slate-300 break-all whitespace-pre-wrap">
            <span className="text-slate-600 mr-2">›</span>
            {log}
          </div>
        ))}

        {error && (
          <div className="flex items-start gap-2 text-red-400 bg-red-950/30 p-2 rounded border border-red-900/50 mt-2">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <div className="break-all whitespace-pre-wrap">
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
