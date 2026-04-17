const GROQ_BASE = "https://api.groq.com/openai/v1";

export async function transcribeAudio(
  audioBlob: Blob,
  apiKey: string
): Promise<string> {
  const formData = new FormData();
  const ext = audioBlob.type.includes("mp4") ? "mp4" : "webm";
  formData.append("file", audioBlob, `audio.${ext}`);
  formData.append("model", "whisper-large-v3");
  formData.append("language", "en");
  formData.append("response_format", "text");

  const res = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Transcription failed (${res.status}): ${err}`);
  }

  return (await res.text()).trim();
}

export async function generateSuggestions(
  transcript: string,
  prompt: string,
  apiKey: string
): Promise<string> {
  const filledPrompt = prompt.replace("{transcript}", transcript);

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: filledPrompt }],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Suggestions failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

export async function streamChat(
  message: string,
  transcript: string,
  chatHistory: { role: string; content: string }[],
  prompt: string,
  apiKey: string
): Promise<ReadableStream<Uint8Array>> {
  const filledPrompt = prompt.replace("{transcript}", transcript);

  const messages = [
    { role: "system", content: filledPrompt },
    ...chatHistory.slice(-10),
    { role: "user", content: message },
  ];

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Chat failed (${res.status}): ${err}`);
  }

  return res.body!;
}

export async function getDetailedAnswer(
  suggestion: {
    type: string;
    title: string;
    preview: string;
    detail_context: string;
  },
  transcript: string,
  prompt: string,
  apiKey: string
): Promise<ReadableStream<Uint8Array>> {
  const filledPrompt = prompt
    .replace("{type}", suggestion.type)
    .replace("{title}", suggestion.title)
    .replace("{preview}", suggestion.preview)
    .replace("{detail_context}", suggestion.detail_context)
    .replace("{transcript}", transcript);

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: filledPrompt }],
      temperature: 0.5,
      max_tokens: 2048,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Detail answer failed (${res.status}): ${err}`);
  }

  return res.body!;
}

export function parseSSEStream(
  stream: ReadableStream<Uint8Array>,
  onToken: (token: string) => void,
  onDone: () => void
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  function read() {
    reader.read().then(({ done, value }) => {
      if (done) {
        onDone();
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") {
          onDone();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) onToken(delta);
        } catch {
          // skip malformed chunks
        }
      }

      read();
    });
  }

  read();
}
