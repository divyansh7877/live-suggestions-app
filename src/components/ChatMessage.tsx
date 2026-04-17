"use client";

import { ChatMessage as ChatMessageType } from "@/types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3.5 py-2.5 ${
          isUser
            ? "bg-primary text-white"
            : "bg-surface-light border border-border text-text-primary"
        }`}
      >
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
          {message.isStreaming && (
            <span className="inline-flex gap-0.5 ml-1">
              <span className="typing-dot w-1 h-1 rounded-full bg-current" />
              <span className="typing-dot w-1 h-1 rounded-full bg-current" />
              <span className="typing-dot w-1 h-1 rounded-full bg-current" />
            </span>
          )}
        </div>
        <span className="text-[10px] opacity-50 mt-1 block">
          {message.timestamp}
        </span>
      </div>
    </div>
  );
}
