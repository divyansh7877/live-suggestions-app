"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSession } from "@/context/SessionContext";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useTranscription } from "@/hooks/useTranscription";
import { useSuggestions } from "@/hooks/useSuggestions";
import { useChat } from "@/hooks/useChat";
import { exportSession } from "@/lib/export";
import Header from "@/components/Header";
import TranscriptPanel from "@/components/TranscriptPanel";
import SuggestionsPanel from "@/components/SuggestionsPanel";
import ChatPanel from "@/components/ChatPanel";
import SettingsModal from "@/components/SettingsModal";
import { Suggestion } from "@/types";

export default function Home() {
  const { state, dispatch } = useSession();
  const { transcribe } = useTranscription();
  const { generate, isGenerating } = useSuggestions();
  const { sendMessage, expandSuggestion, isStreaming } = useChat();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);
  const pendingTranscribeRef = useRef(false);
  const skipNextAutoGenerateRef = useRef(false);

  const handleChunkReady = useCallback(
    async (blob: Blob) => {
      if (pendingTranscribeRef.current) return;
      pendingTranscribeRef.current = true;
      try {
        setError(null);
        await transcribe(blob);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Transcription failed");
      } finally {
        pendingTranscribeRef.current = false;
      }
    },
    [transcribe]
  );

  const handleError = useCallback((msg: string) => {
    setError(msg);
  }, []);

  const { start, stop, manualFlush } = useAudioRecorder({
    chunkDurationMs: state.settings.refreshInterval * 1000,
    onChunkReady: handleChunkReady,
    onError: handleError,
  });

  // Auto-generate suggestions after new transcript chunks
  const lastChunkCountRef = useRef(0);
  useEffect(() => {
    const currentCount = state.transcriptChunks.length;
    if (currentCount > lastChunkCountRef.current && currentCount > 0) {
      lastChunkCountRef.current = currentCount;
      if (skipNextAutoGenerateRef.current) {
        skipNextAutoGenerateRef.current = false;
        return;
      }
      generate().catch((err) => {
        setError(err instanceof Error ? err.message : "Suggestion generation failed");
      });
    }
  }, [state.transcriptChunks.length, generate]);

  const handleToggleMic = useCallback(async () => {
    if (!state.settings.apiKey) {
      setSettingsOpen(true);
      setError("Please add your Groq API key first.");
      return;
    }

    if (state.isRecording) {
      stop();
      dispatch({ type: "SET_RECORDING", payload: false });
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
        autoRefreshRef.current = null;
      }
    } else {
      setError(null);
      await start();
      dispatch({ type: "SET_RECORDING", payload: true });
    }
  }, [state.isRecording, state.settings.apiKey, start, stop, dispatch]);

  const handleRefresh = useCallback(async () => {
    if (!state.settings.apiKey) {
      setSettingsOpen(true);
      return;
    }
    try {
      setError(null);
      if (state.isRecording) {
        const blob = await manualFlush();
        if (blob) {
          // Suppress the auto-generate that fires when the new
          // chunk lands in state — we'll call generate() ourselves.
          skipNextAutoGenerateRef.current = true;
          await transcribe(blob);
        }
      }
      await generate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed");
    }
  }, [state.settings.apiKey, state.isRecording, manualFlush, transcribe, generate]);

  const handleSuggestionClick = useCallback(
    (suggestion: Suggestion, batchId: string, index: number) => {
      if (!state.settings.apiKey) {
        setSettingsOpen(true);
        return;
      }
      expandSuggestion(suggestion, batchId, index);
    },
    [state.settings.apiKey, expandSuggestion]
  );

  const handleSendMessage = useCallback(
    (message: string) => {
      if (!state.settings.apiKey) {
        setSettingsOpen(true);
        return;
      }
      sendMessage(message);
    },
    [state.settings.apiKey, sendMessage]
  );

  const handleExport = useCallback(() => {
    exportSession(state);
  }, [state]);

  return (
    <div className="flex flex-col h-screen">
      <Header
        isRecording={state.isRecording}
        isGenerating={isGenerating}
        onToggleMic={handleToggleMic}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {error && (
        <div className="px-6 py-2 bg-red-500/10 border-b border-red-500/20">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {!state.settings.apiKey && (
        <div className="px-6 py-2 bg-amber-500/10 border-b border-amber-500/20">
          <p className="text-xs text-amber-400">
            No API key set.{" "}
            <button
              onClick={() => setSettingsOpen(true)}
              className="underline hover:text-amber-300"
            >
              Open settings
            </button>{" "}
            to add your Groq API key.
          </p>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 min-h-0">
        <div className="border-r border-border overflow-hidden">
          <TranscriptPanel
            chunks={state.transcriptChunks}
            isRecording={state.isRecording}
          />
        </div>
        <div className="border-r border-border overflow-hidden">
          <SuggestionsPanel
            batches={state.suggestionBatches}
            isGenerating={isGenerating}
            onSuggestionClick={handleSuggestionClick}
          />
        </div>
        <div className="overflow-hidden">
          <ChatPanel
            messages={state.chatMessages}
            isStreaming={isStreaming}
            onSend={handleSendMessage}
          />
        </div>
      </div>

      <SettingsModal
        settings={state.settings}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={(updated) => dispatch({ type: "SET_SETTINGS", payload: updated })}
      />
    </div>
  );
}
