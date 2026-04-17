import { ExportData, SessionState } from "@/types";

export function exportSession(state: SessionState): void {
  const data: ExportData = {
    exportedAt: new Date().toISOString(),
    session: {
      transcript: state.transcriptChunks.map((c) => ({
        timestamp: c.timestamp,
        text: c.text,
      })),
      suggestionBatches: state.suggestionBatches.map((b) => ({
        timestamp: b.timestamp,
        suggestions: b.suggestions.map((s) => ({
          type: s.type,
          title: s.title,
          preview: s.preview,
          detailedAnswer: s.detailedAnswer,
        })),
      })),
      chat: state.chatMessages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      })),
    },
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `session-export-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
