# 🤖 AI Integration Guide

DJ Arsenal now features comprehensive AI integration powered by OpenAI GPT-4o-mini and TTS models.

## 🎯 AI Features

### 1. **AI Track Suggestions** (`/api/ai/suggest-tracks`)
- **What it does**: Analyzes current track and suggests next tracks using AI
- **Uses**: GPT-4o-mini for intelligent track matching
- **Factors considered**:
  - BPM transitions (±5 BPM ideal)
  - Harmonic compatibility (Camelot wheel)
  - Energy flow
  - Genre consistency
  - Event context
  - Crowd vibe

**Frontend**: Dashboard sidebar shows AI suggestions in real-time

### 2. **AI Set Generation** (`/api/ai/generate-set`)
- **What it does**: Creates complete DJ sets using AI
- **Uses**: GPT-4o-mini for set planning
- **Features**:
  - Event-type aware
  - Energy curve optimization
  - Duration-based selection
  - Transition notes
  - Flow recommendations

**Frontend**: AI Studio page (`/ai-studio`)

### 3. **AI Set Flow Optimization** (`/api/ai/optimize-flow`)
- **What it does**: Reorders tracks for perfect flow
- **Uses**: GPT-4o-mini for intelligent ordering
- **Considers**:
  - BPM progression
  - Harmonic compatibility
  - Energy curve
  - Natural flow

### 4. **AI Set Description Generation** (`/api/ai/generate-description`)
- **What it does**: Creates engaging set descriptions
- **Uses**: GPT-4o-mini for creative writing
- **Output**: 2-3 sentence professional descriptions

### 5. **AI Track Tagging** (`/api/ai/generate-tags/{track_id}`)
- **What it does**: Generates relevant tags for tracks
- **Uses**: GPT-4o-mini for music analysis
- **Output**: 5-7 relevant tags (mood, energy, vibe, style)

### 6. **AI Voice Generation** (Enhanced)
- **What it does**: Generates DJ voiceovers using OpenAI TTS
- **Uses**: OpenAI TTS-1 model
- **Features**:
  - Multiple voice options (alloy, echo, fable, onyx, nova, shimmer)
  - Speed control
  - Persona customization
  - Context-aware hype phrases (now AI-powered)

**Frontend**: AI Voice Studio (`/ai-voice`)

### 7. **AI Hype Phrase Generation** (Enhanced)
- **What it does**: Creates context-aware hype phrases
- **Uses**: GPT-4o-mini for creative phrase generation
- **Context aware**:
  - Event type (club, festival, wedding, etc.)
  - Energy level (low, medium, high)
  - Crowd vibe

## 📍 API Endpoints

### AI Recommendations
```
POST /api/ai/suggest-tracks
POST /api/ai/generate-set
POST /api/ai/optimize-flow
POST /api/ai/generate-description
POST /api/ai/generate-tags/{track_id}
```

### AI Voice
```
POST /api/ai-voice/generate
POST /api/ai-voice/hype-phrase
POST /api/ai-voice/drop-intro
POST /api/ai-voice/dj-tag
```

## 🎨 Frontend Integration

### Dashboard
- **AI Track Suggestions** component in sidebar
- Real-time suggestions based on current track
- Context-aware (event type, energy level)

### AI Studio (`/ai-studio`)
- Complete set generation interface
- Event type selection
- Duration control
- Generated set preview
- Save to sets

### AI Voice Studio (`/ai-voice`)
- Enhanced with event type and energy level controls
- AI-powered phrase generation
- Voice type selection
- Real-time generation

### Sets Page
- Quick link to AI Studio for set generation
- AI-powered optimization available

## 🔧 Backend Services

### `AIRecommendationEngine`
- Track suggestions
- Set descriptions
- Track tagging
- Hype phrase generation

### `AISetGenerator`
- Set plan generation
- Flow optimization
- Energy curve management

### `AIVoiceGenerator` (Enhanced)
- Voice generation with OpenAI TTS
- AI-powered hype phrases
- Context-aware generation

## 🚀 Usage Examples

### Generate AI Set
```typescript
const result = await aiApi.generateSet("Club Night", 60, 0.4, 0.9)
// Returns: { tracks: [...], notes: [...], estimated_duration: 3600 }
```

### Get Track Suggestions
```typescript
const suggestions = await aiApi.suggestTracks(
  currentTrackId,
  "Club Night",
  "high",
  "hype"
)
```

### Generate Voice
```typescript
const voice = await aiVoiceApi.generate(
  "Let's take this higher!",
  undefined,
  "hype"
)
```

### Optimize Set Flow
```typescript
const optimized = await aiApi.optimizeFlow(
  trackIds,
  "Need more energy in the middle"
)
```

## ⚙️ Configuration

### Environment Variables
```env
OPENAI_API_KEY=your_key_here
```

### Model Settings
- **GPT Model**: `gpt-4o-mini` (cost-effective, fast)
- **TTS Model**: `tts-1` (high quality)
- **Temperature**: 0.7-0.9 (creative but controlled)

## 🎯 Best Practices

1. **Track Suggestions**: Use when you have 10+ tracks available for best results
2. **Set Generation**: Provide clear event type and duration for optimal sets
3. **Flow Optimization**: Use feedback parameter to guide AI optimization
4. **Voice Generation**: Keep phrases under 50 words for best TTS quality
5. **Error Handling**: All AI features have fallback logic if API fails

## 🔄 Fallback Behavior

All AI features include fallback logic:
- **Track Suggestions**: Falls back to BPM/key matching
- **Set Generation**: Falls back to energy-based selection
- **Hype Phrases**: Falls back to static phrase library

## 📊 Performance

- **Response Time**: 1-3 seconds for GPT calls
- **TTS Generation**: 2-5 seconds depending on text length
- **Caching**: Consider implementing Redis caching for frequent requests

## 🎵 AI-Powered Features Summary

✅ **Track Discovery**: AI suggests compatible tracks
✅ **Set Building**: AI generates complete sets
✅ **Flow Optimization**: AI reorders tracks for perfect flow
✅ **Content Generation**: AI creates descriptions and tags
✅ **Voice Generation**: AI-powered DJ voiceovers
✅ **Context Awareness**: All features consider event type, energy, vibe

---

**Ready to leverage AI in your DJ workflow? Start with the AI Studio! 🎧**






