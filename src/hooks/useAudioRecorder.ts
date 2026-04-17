"use client";

import { useRef, useCallback, useEffect } from "react";

interface UseAudioRecorderOptions {
  chunkDurationMs: number;
  onChunkReady: (blob: Blob) => void;
  onError: (error: string) => void;
}

function getSupportedMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const t of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return "audio/webm";
}

export function useAudioRecorder({
  chunkDurationMs,
  onChunkReady,
  onError,
}: UseAudioRecorderOptions) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef(false);

  const flush = useCallback(() => {
    if (chunksRef.current.length === 0) return;
    const mimeType = mediaRecorderRef.current?.mimeType || getSupportedMimeType();
    const blob = new Blob(chunksRef.current, { type: mimeType });
    chunksRef.current = [];
    if (blob.size > 0) {
      onChunkReady(blob);
    }
  }, [onChunkReady]);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onerror = () => {
        onError("Recording error occurred");
      };

      recorder.start(1000);
      isRecordingRef.current = true;

      intervalRef.current = setInterval(() => {
        if (isRecordingRef.current && chunksRef.current.length > 0) {
          flush();
        }
      }, chunkDurationMs);
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        onError("Microphone access denied. Please allow mic access and try again.");
      } else {
        onError("Failed to access microphone. Check your browser settings.");
      }
    }
  }, [chunkDurationMs, flush, onError]);

  const stop = useCallback(() => {
    isRecordingRef.current = false;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    flush();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
  }, [flush]);

  const manualFlush = useCallback(() => {
    if (isRecordingRef.current && mediaRecorderRef.current) {
      mediaRecorderRef.current.requestData();
      setTimeout(() => flush(), 100);
    }
  }, [flush]);

  useEffect(() => {
    return () => {
      if (isRecordingRef.current) {
        stop();
      }
    };
  }, [stop]);

  return { start, stop, manualFlush };
}
