"use client";

import { useCallback } from "react";
import { useSession } from "@/context/SessionContext";
import { generateSuggestions } from "@/lib/groq";
import { Suggestion } from "@/types";

export function useSuggestions() {
  const { state, dispatch, getRecentTranscript } = useSession();

  const generate = useCallback(async () => {
    if (!state.settings.apiKey) {
      throw new Error("No API key. Open settings to add your Groq API key.");
    }

    const transcript = getRecentTranscript(state.settings.suggestContextWindow);
    if (!transcript.trim()) return;

    dispatch({ type: "SET_GENERATING_SUGGESTIONS", payload: true });

    try {
      const raw = await generateSuggestions(
        transcript,
        state.settings.suggestPrompt,
        state.settings.apiKey
      );

      let suggestions: Suggestion[];
      try {
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        suggestions = JSON.parse(cleaned);
      } catch {
        const match = raw.match(/\[[\s\S]*\]/);
        if (match) {
          suggestions = JSON.parse(match[0]);
        } else {
          throw new Error("Failed to parse suggestions response");
        }
      }

      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        throw new Error("No suggestions generated");
      }

      const validSuggestions = suggestions.slice(0, 3).map((s) => ({
        type: s.type || "TALKING_POINT",
        title: s.title || "Suggestion",
        preview: s.preview || "",
        detail_context: s.detail_context || "",
      })) as Suggestion[];

      dispatch({
        type: "ADD_SUGGESTION_BATCH",
        payload: {
          id: crypto.randomUUID(),
          timestamp: new Date().toLocaleTimeString(),
          suggestions: validSuggestions,
        },
      });
    } finally {
      dispatch({ type: "SET_GENERATING_SUGGESTIONS", payload: false });
    }
  }, [state.settings, dispatch, getRecentTranscript]);

  return { generate, isGenerating: state.isGeneratingSuggestions };
}
