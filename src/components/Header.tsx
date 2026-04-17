"use client";

import { Settings, Download, RefreshCw, Mic, MicOff } from "lucide-react";

interface HeaderProps {
  isRecording: boolean;
  isGenerating: boolean;
  onToggleMic: () => void;
  onRefresh: () => void;
  onExport: () => void;
  onOpenSettings: () => void;
}

export default function Header({
  isRecording,
  isGenerating,
  onToggleMic,
  onRefresh,
  onExport,
  onOpenSettings,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-surface">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-text-primary">
          Live Suggestions
        </h1>
        {isRecording && (
          <span className="flex items-center gap-1.5 text-xs text-red-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            Recording
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleMic}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isRecording
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              : "bg-primary/20 text-primary hover:bg-primary/30"
          }`}
        >
          {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          {isRecording ? "Stop" : "Start"}
        </button>

        <button
          onClick={onRefresh}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-surface-light hover:bg-surface-lighter text-text-secondary transition-colors disabled:opacity-50"
          title="Refresh transcript and suggestions"
        >
          <RefreshCw size={14} className={isGenerating ? "animate-spin" : ""} />
          Refresh
        </button>

        <button
          onClick={onExport}
          className="p-2 rounded-lg bg-surface-light hover:bg-surface-lighter text-text-secondary transition-colors"
          title="Export session"
        >
          <Download size={16} />
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-surface-light hover:bg-surface-lighter text-text-secondary transition-colors"
          title="Settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
