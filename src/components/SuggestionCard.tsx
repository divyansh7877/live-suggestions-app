"use client";

import { Suggestion, SuggestionType } from "@/types";
import {
  HelpCircle,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

interface SuggestionCardProps {
  suggestion: Suggestion;
  onClick: () => void;
}

const typeConfig: Record<SuggestionType, { icon: typeof HelpCircle; color: string; label: string }> = {
  QUESTION: { icon: HelpCircle, color: "text-accent-blue", label: "Question" },
  TALKING_POINT: { icon: Lightbulb, color: "text-accent-amber", label: "Talking Point" },
  ANSWER: { icon: MessageSquare, color: "text-accent-green", label: "Answer" },
  FACT_CHECK: { icon: AlertTriangle, color: "text-accent-red", label: "Fact Check" },
  CLARIFICATION: { icon: CheckCircle, color: "text-accent-purple", label: "Clarification" },
};

export default function SuggestionCard({ suggestion, onClick }: SuggestionCardProps) {
  const config = typeConfig[suggestion.type] || typeConfig.TALKING_POINT;
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className="suggestion-card w-full text-left p-3 rounded-lg bg-surface-light border border-border hover:border-primary/50 cursor-pointer"
    >
      <div className="flex items-start gap-2.5">
        <Icon size={16} className={`${config.color} mt-0.5 flex-shrink-0`} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] uppercase tracking-wider font-medium ${config.color}`}>
              {config.label}
            </span>
          </div>
          <p className="text-sm font-medium text-text-primary leading-snug">
            {suggestion.title}
          </p>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
            {suggestion.preview}
          </p>
        </div>
      </div>
    </button>
  );
}
