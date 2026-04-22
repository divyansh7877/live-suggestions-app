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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef(false);
  const flushResolverRef = useRef<((blob: Blob | null) => void) | null>(null);

  // Groq Whisper needs a self-contained, decodable file. A single
  // MediaRecorder writes container headers only at start and a cues
  // block at stop, so slicing a live stream with `timeslice` yields
  // header-less fragments that Whisper rejects. Instead we run one
  // recorder per chunk: stop produces a complete file, then we
  // immediately start a fresh recorder on the same live MediaStream.
  const startNewRecorder = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;

    const mimeType = getSupportedMimeType();
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const type = recorder.mimeType || mimeType;
      const blob = chunks.length > 0 ? new Blob(chunks, { type }) : null;
      const payload = blob && blob.size > 0 ? blob : null;

      const resolver = flushResolverRef.current;
      if (resolver) {
        flushResolverRef.current = null;
        resolver(payload);
      } else if (payload) {
        onChunkReady(payload);
      }

      if (isRecordingRef.current) {
        startNewRecorder();
      }
    };

    recorder.onerror = () => {
      onError("Recording error occurred");
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
  }, [onChunkReady, onError]);

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
      isRecordingRef.current = true;
      startNewRecorder();

      intervalRef.current = setInterval(() => {
        const recorder = mediaRecorderRef.current;
        if (
          isRecordingRef.current &&
          recorder &&
          recorder.state === "recording" &&
          flushResolverRef.current === null
        ) {
          recorder.stop();
        }
      }, chunkDurationMs);
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        onError("Microphone access denied. Please allow mic access and try again.");
      } else {
        onError("Failed to access microphone. Check your browser settings.");
      }
    }
  }, [chunkDurationMs, startNewRecorder, onError]);

  const stop = useCallback(() => {
    isRecordingRef.current = false;

    if (flushResolverRef.current) {
      flushResolverRef.current(null);
      flushResolverRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      // onstop will fire once more and emit the final chunk via
      // onChunkReady; it won't restart because isRecordingRef is false.
      recorder.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
  }, []);

  const manualFlush = useCallback((): Promise<Blob | null> => {
    const recorder = mediaRecorderRef.current;
    if (!isRecordingRef.current || !recorder || recorder.state !== "recording") {
      return Promise.resolve(null);
    }
    return new Promise<Blob | null>((resolve) => {
      flushResolverRef.current = resolve;
      try {
        recorder.stop();
      } catch {
        flushResolverRef.current = null;
        resolve(null);
        return;
      }
      // Safety net in case onstop never fires.
      setTimeout(() => {
        if (flushResolverRef.current === resolve) {
          flushResolverRef.current = null;
          resolve(null);
        }
      }, 2000);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (isRecordingRef.current) {
        stop();
      }
    };
  }, [stop]);

  return { start, stop, manualFlush };
}
