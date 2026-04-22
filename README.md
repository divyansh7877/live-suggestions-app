# Live Suggestions — AI Meeting Copilot

Real-time AI meeting copilot that listens to your mic, transcribes speech, surfaces contextual suggestions, and provides detailed answers through chat. Powered by Groq.

## Demo

[Deployed App](https://live-suggestions-app-six.vercel.app/)

## Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **Transcription:** Groq Whisper Large V3 (~189x real-time)
- **Text Generation:** Groq GPT-OSS 120B (131K context, ~500 tok/s)
- **Audio Capture:** MediaRecorder API (webm/opus, mp4 fallback for Safari)
- **State:** React Context + useReducer (no external libs)
- **Deploy:** Vercel

## How It Works

### Architecture

```
Browser Mic → MediaRecorder (30s chunks)
    → Groq Whisper Large V3 (transcription)
    → Groq GPT-OSS 120B (3 suggestions per batch)
    → Click suggestion → Groq GPT-OSS 120B (detailed answer, streamed)
```

All Groq calls are made directly from the client. The API key is stored in localStorage (never sent to any server besides Groq).

### Prompt Strategy

The suggestion engine uses a priority-based approach:

1. **Unanswered questions first.** If someone asked a question during the conversation, the first suggestion is always an answer.
2. **Fact-checks for dubious claims.** Statements with numbers, percentages, or definitive claims get automatically flagged for verification.
3. **Talking points for context.** Relevant information or perspectives that haven't been mentioned yet.
4. **Smart follow-up questions.** Questions that would advance the discussion, not generic prompts.
5. **Clarifications for ambiguity.** When something said could be misinterpreted.

The type mix adapts per batch. A batch during a Q&A section might be 2 answers + 1 question. During a brainstorm, it might be 2 talking points + 1 fact-check.

### Context Window Strategy

| Use Case | Default Window | Why |
|----------|---------------|-----|
| Suggestions | 3,000 chars | Speed matters most. Recent context drives relevance. |
| Detailed Answers | 10,000 chars | Accuracy matters. Needs broader context for thorough answers. |
| Chat | 10,000 chars + last 10 messages | Balances transcript awareness with conversation continuity. |

All configurable in Settings.

### Latency Optimizations

- **Parallel processing:** Transcription completes, suggestions generate immediately
- **Streaming chat:** Token-by-token rendering via SSE
- **Small suggestion context:** 3K chars keeps Groq response under 1s
- **Optimistic UI:** Loading states render instantly

## Tradeoffs

| Decision | Alternative | Why This Way |
|----------|-------------|-------------|
| Client-side Groq calls | Server proxy | Assignment says "user pastes their own key" — no reason to add a server layer |
| 30s fixed chunks | Voice Activity Detection | Matches the spec. VAD adds complexity without clear benefit for this use case |
| webm/opus audio | WAV | 16x smaller files. Whisper handles webm natively. Safari falls back to mp4 |
| JSON-structured suggestions | Free-form text | Reliable card rendering. Fallback parsing handles edge cases |
| React Context | Redux/Zustand | Sufficient for single-page session state. No external deps needed |

## Setup

```bash
git clone https://github.com/divyansh7877/live-suggestions-app.git
cd live-suggestions-app
npm install
npm run dev
```

Open http://localhost:3000, paste your Groq API key in Settings, click the mic.

## Settings

All customizable in the Settings modal:

- **Groq API Key** — get one at [console.groq.com/keys](https://console.groq.com/keys)
- **Suggestion prompt** — controls what types of suggestions are generated
- **Detail prompt** — controls the expanded answer when a suggestion is clicked
- **Chat prompt** — controls the conversational chat responses
- **Context windows** — how much transcript to send for each request
- **Refresh interval** — how often to auto-transcribe and generate suggestions

## Export

Click the export button (↓) to download a JSON file containing:
- Full transcript with timestamps
- Every suggestion batch with timestamps
- Complete chat history with timestamps

## File Structure

```
src/
├── app/
│   ├── page.tsx              # Main 3-column layout + orchestration
│   ├── layout.tsx            # Root layout with SessionProvider
│   └── globals.css           # Tailwind + custom styles
├── components/
│   ├── Header.tsx            # Controls bar
│   ├── TranscriptPanel.tsx   # Left column
│   ├── SuggestionsPanel.tsx  # Middle column
│   ├── SuggestionCard.tsx    # Individual suggestion card
│   ├── ChatPanel.tsx         # Right column
│   ├── ChatMessage.tsx       # Chat bubble
│   └── SettingsModal.tsx     # Settings overlay
├── hooks/
│   ├── useAudioRecorder.ts   # Mic capture + 30s chunking
│   ├── useTranscription.ts   # Groq Whisper integration
│   ├── useSuggestions.ts     # Suggestion generation + parsing
│   └── useChat.ts            # Chat + streaming + suggestion expansion
├── lib/
│   ├── groq.ts               # Groq API client (transcribe, suggest, chat, SSE)
│   ├── prompts.ts            # Default prompts and settings
│   └── export.ts             # Session export formatter
├── context/
│   └── SessionContext.tsx     # Global state (useReducer)
└── types/
    └── index.ts              # TypeScript interfaces
```
