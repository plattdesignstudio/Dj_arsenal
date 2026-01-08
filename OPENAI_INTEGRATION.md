# 🎚️ OpenAI Integration Guide

## Overview

DJ Arsenal now includes comprehensive OpenAI API integration with 7 distinct patterns tailored for DJ performance, music flow, and crowd interaction.

## 🧩 Integration Patterns

### 1. Text → Text (DJ Intelligence Engine)
**Endpoint:** `/api/ai/dj-intel/query`

Real-time DJ reasoning and decision making.

**Example Usage:**
```typescript
import { djIntelligenceApi } from "@/lib/api"

// Get track suggestion
const result = await djIntelligenceApi.query({
  query: "Suggest the next track for a 124 BPM peak-hour club set",
  currentBpm: 124,
  currentEnergy: 0.8,
  eventType: "Club Night",
  personaId: "nova"
})

// Stream response for live UI
await djIntelligenceApi.queryStream(
  { query: "How do I recover energy in 2 tracks?" },
  (chunk) => console.log(chunk)
)
```

**Quick Actions:**
- `djIntelligenceApi.suggestNextTrack()` - Quick track suggestion
- `djIntelligenceApi.recoverEnergy()` - Energy recovery strategy
- `djIntelligenceApi.suggestBpmRamp()` - BPM transition strategy

### 2. Text → Audio (AI DJ Voice Engine)
**Endpoint:** `/api/ai-voice/generate-enhanced`

Generate DJ-ready vocal audio with beat-aware metadata.

**Example Usage:**
```typescript
import { enhancedAIVoiceApi } from "@/lib/api"

const result = await enhancedAIVoiceApi.generate({
  text: "Everybody hands up — let's take this higher!",
  personaId: "hype_master",
  tempo: 128,
  key: "A minor",
  style: "festival",
  voice: "echo",
  speed: 1.1
})

// result includes:
// - audio_url: URL to generated audio
// - duration: Estimated duration
// - beat_markers: Array of beat timestamps
// - suggested_drop_timing: Best moment for drop
```

### 3. Audio → Text (Live DJ Transcription)
**Endpoint:** `/api/ai/transcribe/transcribe`

Transcribe mic input, crowd chants, and live MC moments.

**Example Usage:**
```typescript
import { transcriptionApi } from "@/lib/api"

// From file upload
const result = await transcriptionApi.transcribeFile(
  audioFile,
  "en",
  "DJ hype phrases, crowd chants"
)

// From base64
const result = await transcriptionApi.transcribeBytes(
  base64Audio,
  "recording.mp3"
)
```

### 4. Text → Embeddings (Track & Set Intelligence)
**Endpoint:** `/api/ai/embeddings/generate`

Semantic intelligence for tracks, sets, and recommendations.

**Example Usage:**
```typescript
import { embeddingsApi } from "@/lib/api"

// Generate embeddings for texts
const result = await embeddingsApi.generate({
  texts: [
    "Techno track, 128 BPM, dark, energetic",
    "House track, 120 BPM, uplifting, groovy"
  ]
})

// Embed a specific track
const trackEmbedding = await embeddingsApi.embedTrack(trackId)

// Embed a set
const setEmbedding = await embeddingsApi.embedSet(setId)
```

**Note:** For production, use pgvector extension for efficient similarity search.

### 5. Image → Text (DJ Visual Context)
**Endpoint:** `/api/ai/visuals/analyze-crowd`

Analyze crowd/venue images for energy estimation.

**Example Usage:**
```typescript
import { visualsApi } from "@/lib/api"

const analysis = await visualsApi.analyzeCrowd({
  imageUrl: "https://example.com/crowd-photo.jpg",
  context: "peak hour, main stage"
})

// Returns:
// - energy_estimate: 0.0 - 1.0
// - mood_tags: ["energetic", "hyped", "vibrant"]
// - crowd_size: "large"
// - lighting: "strobe, colorful"
// - vibe: "electric"
```

### 6. Text → Image (DJ Branding & Artist Mode)
**Endpoint:** `/api/ai/visuals/generate`

Generate DJ logos, posters, flyers, and branding.

**Example Usage:**
```typescript
import { visualsApi } from "@/lib/api"

// Generate logo
const logo = await visualsApi.generateLogo(
  "DJ NOVA",
  "club",
  "futuristic, neon, dark"
)

// Generate event poster
const poster = await visualsApi.generatePoster(
  "Summer Festival 2024",
  "July 15, 2024",
  "Central Park",
  "festival"
)

// Custom generation
const visual = await visualsApi.generate({
  prompt: "DJ logo with neon colors and electronic aesthetic",
  style: "club",
  size: "1024x1024",
  quality: "hd"
})
```

### 7. DJ Persona System
**Endpoint:** `/api/personas/`

Built-in personas with unique voice styles and prompts.

**Available Personas:**
- `nova` - Futuristic, confident, hypnotic
- `hype_master` - Infectious energy, authentic
- `underground` - Deep knowledge, authoritative
- `festival` - Commanding, theatrical
- `smooth` - Subtle, sophisticated

**Example Usage:**
```typescript
import { personasApi } from "@/lib/api"

// List all personas
const personas = await personasApi.list()

// Get specific persona
const persona = await personasApi.get("nova")
```

## 🎛️ UI Components

### DJAIControls Component

Pre-built component with action buttons:

```tsx
import { DJAIControls } from "@/components/dashboard/DJAIControls"

<DJAIControls
  currentBpm={128}
  currentKey="A minor"
  currentEnergy={0.8}
  eventType="Club Night"
  personaId="nova"
  onVoiceGenerated={(audioUrl) => {
    // Handle generated audio
  }}
/>
```

**Actions:**
- **Hype Crowd** - Generate hype phrase with voice
- **Recover Energy** - Get energy recovery strategy
- **Generate Drop** - Create DJ drop intro
- **Suggest Track** - AI track suggestion with streaming

## 🔧 Configuration

### Environment Variables

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### Backend Setup

The OpenAI service is automatically initialized when the backend starts. Ensure `OPENAI_API_KEY` is set in your environment.

## 🚀 Performance Safeguards

- **Caching:** AI responses are cached where appropriate
- **Graceful Degradation:** Falls back to manual selection if OpenAI is unavailable
- **Non-blocking:** Never blocks live performance UI
- **Streaming:** Real-time feedback for long-running operations

## 📝 Notes

1. **pgvector:** For production embeddings storage, install pgvector extension in PostgreSQL
2. **Audio Storage:** In production, configure S3 or similar for audio file storage
3. **Rate Limiting:** Consider implementing rate limiting for OpenAI API calls
4. **Cost Management:** Monitor OpenAI API usage and costs

## 🎯 Best Practices

1. **Use Personas:** Select appropriate persona for your DJ style
2. **Context Matters:** Always provide current BPM, key, and energy for better suggestions
3. **Stream When Possible:** Use streaming for live UI feedback
4. **Cache Embeddings:** Store track/set embeddings for faster similarity search
5. **Test Voice Output:** Preview generated voice before live use

## 🔥 Example: Complete Workflow

```typescript
// 1. Get DJ intelligence
const suggestion = await djIntelligenceApi.suggestNextTrack(
  currentTrackId,
  0.9, // target energy
  128, // target BPM
  "Club Night",
  "nova"
)

// 2. Generate hype phrase
const voice = await enhancedAIVoiceApi.generate({
  text: "This is the moment you've been waiting for!",
  personaId: "hype_master",
  tempo: 128,
  style: "club"
})

// 3. Play audio at suggested drop timing
playAudio(voice.audio_url, voice.suggested_drop_timing)
```

---

**Built for DJs. Powered by AI. 🎧**





