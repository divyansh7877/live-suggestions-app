export type SuggestionType =
  | "QUESTION"
  | "TALKING_POINT"
  | "ANSWER"
  | "FACT_CHECK"
  | "CLARIFICATION";

export interface Suggestion {
  type: SuggestionType;
  title: string;
  preview: string;
  detail_context: string;
  detailedAnswer?: string;
}

export interface SuggestionBatch {
  id: string;
  timestamp: string;
  suggestions: Suggestion[];
}

export interface TranscriptChunk {
  id: string;
  timestamp: string;
  text: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface SessionSettings {
  apiKey: string;
  suggestPrompt: string;
  detailPrompt: string;
  chatPrompt: string;
  suggestContextWindow: number;
  detailContextWindow: number;
  refreshInterval: number;
}

export interface SessionState {
  settings: SessionSettings;
  isRecording: boolean;
  transcriptChunks: TranscriptChunk[];
  suggestionBatches: SuggestionBatch[];
  chatMessages: ChatMessage[];
  isGeneratingSuggestions: boolean;
  isStreamingChat: boolean;
}

export interface ExportData {
  exportedAt: string;
  session: {
    transcript: { timestamp: string; text: string }[];
    suggestionBatches: {
      timestamp: string;
      suggestions: {
        type: string;
        title: string;
        preview: string;
        detailedAnswer?: string;
      }[];
    }[];
    chat: { role: string; content: string; timestamp: string }[];
  };
}
