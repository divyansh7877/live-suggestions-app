"use client";

import { SuggestionBatch, Suggestion } from "@/types";
import SuggestionCard from "./SuggestionCard";
import { Loader2 } from "lucide-react";

interface SuggestionsPanelProps {
  batches: SuggestionBatch[];
  isGenerating: boolean;
  onSuggestionClick: (suggestion: Suggestion, batchId: string, index: number) => void;
}

export default function SuggestionsPanel({
  batches,
  isGenerating,
  onSuggestionClick,
}: SuggestionsPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
          Suggestions
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {isGenerating && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm">
            <Loader2 size={14} className="animate-spin" />
            Generating suggestions...
          </div>
        )}

        {batches.length === 0 && !isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <p className="text-sm">
              Suggestions will appear here as you speak.
            </p>
          </div>
        ) : (
          batches.map((batch) => (
            <div key={batch.id}>
              <span className="text-[10px] text-text-muted uppercase tracking-wider">
                {batch.timestamp}
              </span>
              <div className="space-y-2 mt-1.5">
                {batch.suggestions.map((s, i) => (
                  <SuggestionCard
                    key={`${batch.id}-${i}`}
                    suggestion={s}
                    onClick={() => onSuggestionClick(s, batch.id, i)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
