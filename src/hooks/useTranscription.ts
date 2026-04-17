"use client";

import { useCallback } from "react";
import { useSession } from "@/context/SessionContext";
import { transcribeAudio } from "@/lib/groq";

export function useTranscription() {
  const { state, dispatch } = useSession();

  const transcribe = useCallback(
    async (audioBlob: Blob) => {
      if (!state.settings.apiKey) {
        throw new Error("No API key set. Open settings to add your Groq API key.");
      }

      const text = await transcribeAudio(audioBlob, state.settings.apiKey);

      if (text && text.trim()) {
        dispatch({
          type: "ADD_TRANSCRIPT",
          payload: {
            id: crypto.randomUUID(),
            timestamp: new Date().toLocaleTimeString(),
            text: text.trim(),
          },
        });
      }

      return text;
    },
    [state.settings.apiKey, dispatch]
  );

  return { transcribe };
}
