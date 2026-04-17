"use client";

import React, { createContext, useContext, useReducer, useCallback } from "react";
import {
  SessionState,
  SessionSettings,
  TranscriptChunk,
  SuggestionBatch,
  ChatMessage,
} from "@/types";
import {
  DEFAULT_SUGGEST_PROMPT,
  DEFAULT_DETAIL_PROMPT,
  DEFAULT_CHAT_PROMPT,
  DEFAULT_SETTINGS,
} from "@/lib/prompts";

type Action =
  | { type: "SET_SETTINGS"; payload: Partial<SessionSettings> }
  | { type: "SET_RECORDING"; payload: boolean }
  | { type: "ADD_TRANSCRIPT"; payload: TranscriptChunk }
  | { type: "ADD_SUGGESTION_BATCH"; payload: SuggestionBatch }
  | { type: "UPDATE_SUGGESTION_ANSWER"; payload: { batchId: string; suggestionIndex: number; answer: string } }
  | { type: "ADD_CHAT_MESSAGE"; payload: ChatMessage }
  | { type: "UPDATE_CHAT_MESSAGE"; payload: { id: string; content: string; isStreaming?: boolean } }
  | { type: "SET_GENERATING_SUGGESTIONS"; payload: boolean }
  | { type: "SET_STREAMING_CHAT"; payload: boolean };

function loadSettings(): SessionSettings {
  if (typeof window === "undefined") {
    return {
      apiKey: "",
      suggestPrompt: DEFAULT_SUGGEST_PROMPT,
      detailPrompt: DEFAULT_DETAIL_PROMPT,
      chatPrompt: DEFAULT_CHAT_PROMPT,
      ...DEFAULT_SETTINGS,
    };
  }
  try {
    const saved = localStorage.getItem("ls-settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        apiKey: parsed.apiKey || "",
        suggestPrompt: parsed.suggestPrompt || DEFAULT_SUGGEST_PROMPT,
        detailPrompt: parsed.detailPrompt || DEFAULT_DETAIL_PROMPT,
        chatPrompt: parsed.chatPrompt || DEFAULT_CHAT_PROMPT,
        suggestContextWindow: parsed.suggestContextWindow || DEFAULT_SETTINGS.suggestContextWindow,
        detailContextWindow: parsed.detailContextWindow || DEFAULT_SETTINGS.detailContextWindow,
        refreshInterval: parsed.refreshInterval || DEFAULT_SETTINGS.refreshInterval,
      };
    }
  } catch {}
  return {
    apiKey: "",
    suggestPrompt: DEFAULT_SUGGEST_PROMPT,
    detailPrompt: DEFAULT_DETAIL_PROMPT,
    chatPrompt: DEFAULT_CHAT_PROMPT,
    ...DEFAULT_SETTINGS,
  };
}

const initialState: SessionState = {
  settings: loadSettings(),
  isRecording: false,
  transcriptChunks: [],
  suggestionBatches: [],
  chatMessages: [],
  isGeneratingSuggestions: false,
  isStreamingChat: false,
};

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case "SET_SETTINGS": {
      const newSettings = { ...state.settings, ...action.payload };
      if (typeof window !== "undefined") {
        localStorage.setItem("ls-settings", JSON.stringify(newSettings));
      }
      return { ...state, settings: newSettings };
    }
    case "SET_RECORDING":
      return { ...state, isRecording: action.payload };
    case "ADD_TRANSCRIPT":
      return {
        ...state,
        transcriptChunks: [...state.transcriptChunks, action.payload],
      };
    case "ADD_SUGGESTION_BATCH":
      return {
        ...state,
        suggestionBatches: [action.payload, ...state.suggestionBatches],
      };
    case "UPDATE_SUGGESTION_ANSWER": {
      const batches = state.suggestionBatches.map((b) => {
        if (b.id !== action.payload.batchId) return b;
        const suggestions = [...b.suggestions];
        suggestions[action.payload.suggestionIndex] = {
          ...suggestions[action.payload.suggestionIndex],
          detailedAnswer: action.payload.answer,
        };
        return { ...b, suggestions };
      });
      return { ...state, suggestionBatches: batches };
    }
    case "ADD_CHAT_MESSAGE":
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload],
      };
    case "UPDATE_CHAT_MESSAGE":
      return {
        ...state,
        chatMessages: state.chatMessages.map((m) =>
          m.id === action.payload.id
            ? { ...m, content: action.payload.content, isStreaming: action.payload.isStreaming }
            : m
        ),
      };
    case "SET_GENERATING_SUGGESTIONS":
      return { ...state, isGeneratingSuggestions: action.payload };
    case "SET_STREAMING_CHAT":
      return { ...state, isStreamingChat: action.payload };
    default:
      return state;
  }
}

interface ContextValue {
  state: SessionState;
  dispatch: React.Dispatch<Action>;
  getFullTranscript: () => string;
  getRecentTranscript: (charLimit: number) => string;
}

const SessionContext = createContext<ContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const getFullTranscript = useCallback(() => {
    return state.transcriptChunks.map((c) => c.text).join("\n\n");
  }, [state.transcriptChunks]);

  const getRecentTranscript = useCallback(
    (charLimit: number) => {
      const full = state.transcriptChunks.map((c) => c.text).join("\n\n");
      if (full.length <= charLimit) return full;
      return full.slice(-charLimit);
    },
    [state.transcriptChunks]
  );

  return (
    <SessionContext.Provider value={{ state, dispatch, getFullTranscript, getRecentTranscript }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
