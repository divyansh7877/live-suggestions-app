"use client";

import { useRef, useEffect, useState } from "react";
import { ChatMessage as ChatMessageType } from "@/types";
import ChatMessage from "./ChatMessage";
import { Send } from "lucide-react";

interface ChatPanelProps {
  messages: ChatMessageType[];
  isStreaming: boolean;
  onSend: (message: string) => void;
}

export default function ChatPanel({ messages, isStreaming, onSend }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, messages[messages.length - 1]?.content]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
          Chat
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <p className="text-sm">
              Click a suggestion or type a question.
            </p>
          </div>
        ) : (
          messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-border">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the meeting..."
            className="flex-1 px-3 py-2 rounded-lg bg-surface-light border border-border text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="px-3 py-2 rounded-lg bg-primary text-white disabled:opacity-50 hover:bg-primary-hover transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
