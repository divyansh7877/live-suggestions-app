"use client";

import { useCallback } from "react";
import { useSession } from "@/context/SessionContext";
import { getDetailedAnswer, streamChat, parseSSEStream } from "@/lib/groq";
import { Suggestion } from "@/types";

export function useChat() {
  const { state, dispatch, getFullTranscript, getRecentTranscript } = useSession();

  const sendMessage = useCallback(
    async (message: string) => {
      if (!state.settings.apiKey) {
        throw new Error("No API key set.");
      }

      const userMsg = {
        id: crypto.randomUUID(),
        role: "user" as const,
        content: message,
        timestamp: new Date().toLocaleTimeString(),
      };
      dispatch({ type: "ADD_CHAT_MESSAGE", payload: userMsg });

      const assistantId = crypto.randomUUID();
      dispatch({
        type: "ADD_CHAT_MESSAGE",
        payload: {
          id: assistantId,
          role: "assistant",
          content: "",
          timestamp: new Date().toLocaleTimeString(),
          isStreaming: true,
        },
      });

      dispatch({ type: "SET_STREAMING_CHAT", payload: true });

      try {
        const transcript = getRecentTranscript(state.settings.detailContextWindow);
        const history = state.chatMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const stream = await streamChat(
          message,
          transcript,
          history,
          state.settings.chatPrompt,
          state.settings.apiKey
        );

        let accumulated = "";
        parseSSEStream(
          stream,
          (token) => {
            accumulated += token;
            dispatch({
              type: "UPDATE_CHAT_MESSAGE",
              payload: { id: assistantId, content: accumulated, isStreaming: true },
            });
          },
          () => {
            dispatch({
              type: "UPDATE_CHAT_MESSAGE",
              payload: { id: assistantId, content: accumulated, isStreaming: false },
            });
            dispatch({ type: "SET_STREAMING_CHAT", payload: false });
          }
        );
      } catch (err) {
        dispatch({
          type: "UPDATE_CHAT_MESSAGE",
          payload: {
            id: assistantId,
            content: `Error: ${err instanceof Error ? err.message : "Failed to get response"}`,
            isStreaming: false,
          },
        });
        dispatch({ type: "SET_STREAMING_CHAT", payload: false });
      }
    },
    [state.settings, state.chatMessages, dispatch, getRecentTranscript]
  );

  const expandSuggestion = useCallback(
    async (suggestion: Suggestion, batchId: string, suggestionIndex: number) => {
      if (!state.settings.apiKey) {
        throw new Error("No API key set.");
      }

      const userMsg = {
        id: crypto.randomUUID(),
        role: "user" as const,
        content: `📌 **${suggestion.title}**\n${suggestion.preview}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      dispatch({ type: "ADD_CHAT_MESSAGE", payload: userMsg });

      const assistantId = crypto.randomUUID();
      dispatch({
        type: "ADD_CHAT_MESSAGE",
        payload: {
          id: assistantId,
          role: "assistant",
          content: "",
          timestamp: new Date().toLocaleTimeString(),
          isStreaming: true,
        },
      });

      dispatch({ type: "SET_STREAMING_CHAT", payload: true });

      try {
        const transcript = getFullTranscript().slice(
          -state.settings.detailContextWindow
        );

        const stream = await getDetailedAnswer(
          suggestion,
          transcript,
          state.settings.detailPrompt,
          state.settings.apiKey
        );

        let accumulated = "";
        parseSSEStream(
          stream,
          (token) => {
            accumulated += token;
            dispatch({
              type: "UPDATE_CHAT_MESSAGE",
              payload: { id: assistantId, content: accumulated, isStreaming: true },
            });
          },
          () => {
            dispatch({
              type: "UPDATE_CHAT_MESSAGE",
              payload: { id: assistantId, content: accumulated, isStreaming: false },
            });
            dispatch({ type: "SET_STREAMING_CHAT", payload: false });
            dispatch({
              type: "UPDATE_SUGGESTION_ANSWER",
              payload: { batchId, suggestionIndex, answer: accumulated },
            });
          }
        );
      } catch (err) {
        dispatch({
          type: "UPDATE_CHAT_MESSAGE",
          payload: {
            id: assistantId,
            content: `Error: ${err instanceof Error ? err.message : "Failed"}`,
            isStreaming: false,
          },
        });
        dispatch({ type: "SET_STREAMING_CHAT", payload: false });
      }
    },
    [state.settings, dispatch, getFullTranscript]
  );

  return { sendMessage, expandSuggestion, isStreaming: state.isStreamingChat };
}
