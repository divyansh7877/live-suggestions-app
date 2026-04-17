"use client";

import { useState, useEffect } from "react";
import { X, RotateCcw, Eye, EyeOff } from "lucide-react";
import { SessionSettings } from "@/types";
import {
  DEFAULT_SUGGEST_PROMPT,
  DEFAULT_DETAIL_PROMPT,
  DEFAULT_CHAT_PROMPT,
  DEFAULT_SETTINGS,
} from "@/lib/prompts";

interface SettingsModalProps {
  settings: SessionSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: Partial<SessionSettings>) => void;
}

export default function SettingsModal({
  settings,
  isOpen,
  onClose,
  onSave,
}: SettingsModalProps) {
  const [local, setLocal] = useState(settings);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setLocal(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(local);
    onClose();
  };

  const handleReset = () => {
    setLocal({
      ...local,
      suggestPrompt: DEFAULT_SUGGEST_PROMPT,
      detailPrompt: DEFAULT_DETAIL_PROMPT,
      chatPrompt: DEFAULT_CHAT_PROMPT,
      ...DEFAULT_SETTINGS,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface rounded-xl border border-border w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">Settings</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* API Key */}
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">
              Groq API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={local.apiKey}
                onChange={(e) => setLocal({ ...local, apiKey: e.target.value })}
                placeholder="gsk_..."
                className="w-full px-3 py-2 pr-10 rounded-lg bg-surface-light border border-border text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Get your key at{" "}
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                console.groq.com/keys
              </a>
            </p>
          </div>

          {/* Context Windows */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-primary block mb-1.5">
                Suggestion Context (chars)
              </label>
              <input
                type="number"
                value={local.suggestContextWindow}
                onChange={(e) =>
                  setLocal({ ...local, suggestContextWindow: parseInt(e.target.value) || 3000 })
                }
                className="w-full px-3 py-2 rounded-lg bg-surface-light border border-border text-sm text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary block mb-1.5">
                Detail Context (chars)
              </label>
              <input
                type="number"
                value={local.detailContextWindow}
                onChange={(e) =>
                  setLocal({ ...local, detailContextWindow: parseInt(e.target.value) || 10000 })
                }
                className="w-full px-3 py-2 rounded-lg bg-surface-light border border-border text-sm text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Refresh Interval */}
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">
              Auto-refresh Interval (seconds)
            </label>
            <input
              type="number"
              value={local.refreshInterval}
              onChange={(e) =>
                setLocal({ ...local, refreshInterval: parseInt(e.target.value) || 30 })
              }
              className="w-full max-w-[200px] px-3 py-2 rounded-lg bg-surface-light border border-border text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          {/* Prompts */}
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">
              Live Suggestions Prompt
            </label>
            <textarea
              value={local.suggestPrompt}
              onChange={(e) => setLocal({ ...local, suggestPrompt: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 rounded-lg bg-surface-light border border-border text-xs text-text-primary font-mono focus:outline-none focus:border-primary resize-y"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">
              Detailed Answer Prompt
            </label>
            <textarea
              value={local.detailPrompt}
              onChange={(e) => setLocal({ ...local, detailPrompt: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 rounded-lg bg-surface-light border border-border text-xs text-text-primary font-mono focus:outline-none focus:border-primary resize-y"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">
              Chat Prompt
            </label>
            <textarea
              value={local.chatPrompt}
              onChange={(e) => setLocal({ ...local, chatPrompt: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 rounded-lg bg-surface-light border border-border text-xs text-text-primary font-mono focus:outline-none focus:border-primary resize-y"
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            <RotateCcw size={14} />
            Reset to defaults
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-light transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-sm bg-primary text-white hover:bg-primary-hover transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
