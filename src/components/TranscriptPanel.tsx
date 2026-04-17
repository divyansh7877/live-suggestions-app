"use client";

import { useRef, useEffect } from "react";
import { TranscriptChunk } from "@/types";

interface TranscriptPanelProps {
  chunks: TranscriptChunk[];
  isRecording: boolean;
}

export default function TranscriptPanel({ chunks, isRecording }: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chunks]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
          Transcript
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {chunks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <p className="text-sm">
              {isRecording
                ? "Listening... transcript will appear shortly."
                : "Click the mic button to start recording."}
            </p>
          </div>
        ) : (
          chunks.map((chunk) => (
            <div key={chunk.id} className="group">
              <span className="text-xs text-text-muted">{chunk.timestamp}</span>
              <p className="text-sm text-text-primary leading-relaxed mt-0.5">
                {chunk.text}
              </p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
