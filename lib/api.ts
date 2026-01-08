import axios from "axios"

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const API_URL_INTERNAL = API_URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second timeout (increased for slower connections)
})

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.code === 'ERR_NETWORK_IO_SUSPENDED') {
      // Only log once per error type to reduce console noise
      if (!(window as any).__backend_error_logged) {
        console.error('🔴 Backend Connection Error:', {
          message: 'Cannot connect to backend server',
          url: API_URL,
          error: error.code,
          suggestion: 'Start backend: cd backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload'
        })
        ;(window as any).__backend_error_logged = true
        // Reset after 5 seconds to allow re-logging if needed
        setTimeout(() => {
          ;(window as any).__backend_error_logged = false
        }, 5000)
      }
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      // Timeout error
      if (!(window as any).__timeout_error_logged) {
        console.error('⏱️ Request Timeout:', {
          message: 'Backend is taking too long to respond',
          url: API_URL,
          timeout: '30 seconds',
          suggestion: 'Check if backend is running and responding. Try: curl http://localhost:8000/health'
        })
        ;(window as any).__timeout_error_logged = true
        setTimeout(() => {
          ;(window as any).__timeout_error_logged = false
        }, 10000)
      }
    }
    return Promise.reject(error)
  }
)

// Types
export interface Track {
  id: string
  title: string
  artist: string
  duration: number
  bpm?: number
  key?: string
  energy?: number
  genre?: string
  mood?: string
  file_path?: string
  cover_art?: string
  album_image_url?: string // Spotify album art URL
  album?: string // Album name
  preview_url?: string
  created_at: string
  updated_at?: string
}

export interface Set {
  id: string
  name: string
  description?: string
  event_type_id?: string
  duration: number
  created_at: string
  updated_at?: string
}

export interface SetTrack {
  id: string
  position: number
  track: Track
  transition_bpm?: number
  transition_key?: string
  notes?: string
}

export interface SetWithTracks extends Set {
  set_tracks: SetTrack[]
}

export interface EventType {
  id: string
  name: string
  description?: string
  min_bpm: number
  max_bpm: number
  energy_curve?: number[]
  genre_weighting?: Record<string, number>
  vocal_frequency: number
  drop_intensity: number
}

// API functions
export const tracksApi = {
  getAll: async (params?: { genre?: string; min_bpm?: number; max_bpm?: number }) => {
    const response = await api.get("/api/tracks", { params })
    return response.data as Track[]
  },
  getById: async (id: string) => {
    const response = await api.get(`/api/tracks/${id}`)
    return response.data as Track
  },
  create: async (track: Partial<Track>) => {
    const response = await api.post("/api/tracks", track)
    return response.data as Track
  },
  delete: async (id: string) => {
    const response = await api.delete(`/api/tracks/${id}`)
    return response.data
  },
  analyze: async (trackId: string, analysisType: string = "full") => {
    const response = await api.post(`/api/tracks/${trackId}/analyze`, {
      track_id: trackId,
      analysis_type: analysisType,
    })
    return response.data
  },
  getCompatible: async (trackId: string) => {
    const response = await api.get(`/api/tracks/${trackId}/compatible`)
    return response.data
  },
}

export const setsApi = {
  getAll: async () => {
    const response = await api.get("/api/sets")
    return response.data as Set[]
  },
  getById: async (id: string) => {
    const response = await api.get(`/api/sets/${id}`)
    return response.data as SetWithTracks
  },
  create: async (set: Partial<Set> & { track_ids?: string[] }) => {
    const response = await api.post("/api/sets", set)
    return response.data as Set
  },
  addTrack: async (setId: string, trackId: string, position?: number) => {
    const response = await api.post(`/api/sets/${setId}/tracks/${trackId}`, null, {
      params: { position },
    })
    return response.data
  },
  removeTrack: async (setId: string, trackId: string) => {
    const response = await api.delete(`/api/sets/${setId}/tracks/${trackId}`)
    return response.data
  },
}

export const eventsApi = {
  getAll: async () => {
    const response = await api.get("/api/events")
    return response.data as EventType[]
  },
  getById: async (id: string) => {
    const response = await api.get(`/api/events/${id}`)
    return response.data as EventType
  },
  initialize: async () => {
    const response = await api.post("/api/events/initialize")
    return response.data
  },
  create: async (event: Partial<EventType>) => {
    const response = await api.post("/api/events", event)
    return response.data as EventType
  },
}

export const flowApi = {
  suggestNext: async (currentTrackId: string, targetEnergy?: number, targetBpm?: number) => {
    const response = await api.post("/api/flow/suggest-next", {
      current_track_id: currentTrackId,
      target_energy: targetEnergy,
      target_bpm: targetBpm,
    })
    return response.data
  },
  getEnergyCurve: async (setId: string) => {
    const response = await api.get(`/api/flow/energy-curve/${setId}`)
    return response.data
  },
  optimizeSet: async (setId: string) => {
    const response = await api.post(`/api/flow/optimize-set/${setId}`)
    return response.data
  },
  calculateBpmTransition: async (fromBpm: number, toBpm: number) => {
    const response = await api.post("/api/flow/bpm-transition", null, {
      params: { from_bpm: fromBpm, to_bpm: toBpm },
    })
    return response.data
  },
}

export const harmonicApi = {
  getCompatibleKeys: async (camelotKey: string) => {
    const response = await api.get(`/api/harmonic/compatible-keys/${camelotKey}`)
    return response.data
  },
  getTransitionType: async (fromKey: string, toKey: string) => {
    const response = await api.get("/api/harmonic/transition-type", {
      params: { from_key: fromKey, to_key: toKey },
    })
    return response.data
  },
  getCompatibleTracks: async (trackId: string, targetKey?: string) => {
    const response = await api.post("/api/harmonic/compatible-tracks", {
      track_id: trackId,
      target_key: targetKey,
    })
    return response.data
  },
}

export const aiApi = {
  suggestTracks: async (currentTrackId: string, eventType?: string, energyLevel?: string, crowdVibe?: string) => {
    const response = await api.post("/api/ai/suggest-tracks", {
      current_track_id: currentTrackId,
      event_type: eventType,
      energy_level: energyLevel,
      crowd_vibe: crowdVibe,
    })
    return response.data
  },
  generateSet: async (eventType: string, durationMinutes: number, startEnergy?: number, peakEnergy?: number) => {
    const response = await api.post("/api/ai/generate-set", {
      event_type: eventType,
      duration_minutes: durationMinutes,
      start_energy: startEnergy || 0.4,
      peak_energy: peakEnergy || 0.9,
    })
    return response.data
  },
  optimizeFlow: async (trackIds: string[], feedback?: string) => {
    const response = await api.post("/api/ai/optimize-flow", {
      track_ids: trackIds,
      feedback,
    })
    return response.data
  },
  generateDescription: async (trackIds: string[], eventType: string = "Club Night") => {
    const response = await api.post("/api/ai/generate-description", {
      track_ids: trackIds,
      event_type: eventType,
    })
    return response.data
  },
  generateTags: async (trackId: string) => {
    const response = await api.post(`/api/ai/generate-tags/${trackId}`)
    return response.data
  },
}

export const trendingApi = {
  getTrending: async (genre?: string, location?: string, limit?: number) => {
    const response = await api.get("/api/trending", {
      params: { genre, location, limit },
    })
    return response.data
  },
  getBillboard: async () => {
    const response = await api.get("/api/trending/billboard")
    return response.data
  },
  getSpotify: async () => {
    const response = await api.get("/api/trending/spotify")
    return response.data
  },
  searchTrack: async (trackName: string, artistName?: string) => {
    const response = await api.get("/api/trending/search", {
      params: { track_name: trackName, artist_name: artistName },
    })
    return response.data
  },
  searchSpotify: async (query: string, limit = 20, market = "US") => {
    const response = await api.get("/api/trending/spotify-search", {
      params: { query, limit, market },
    })
    return response.data
  },
  getFeaturedTracks: async (limit = 20, market = "US") => {
    const response = await api.get("/api/trending/spotify-featured", {
      params: { limit, market },
    })
    return response.data
  },
  getSpotifyTrack: async (trackId: string, market = "US") => {
    const response = await api.get(`/api/trending/spotify-track/${trackId}`, {
      params: { market },
    })
    return response.data
  },
}

// ============================================
// DJ Intelligence API
// ============================================

export interface DJIntelligenceRequest {
  query: string
  personaId?: string
  currentBpm?: number
  currentKey?: string
  currentEnergy?: number
  eventType?: string
  timeOfNight?: string
  crowdVibe?: string
  recentTracks?: string[]
}

export interface DJIntelligenceResponse {
  response: string
  model: string
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

export const djIntelligenceApi = {
  query: async (request: DJIntelligenceRequest): Promise<DJIntelligenceResponse> => {
    const response = await api.post("/api/ai/dj-intel/query", {
      query: request.query,
      persona_id: request.personaId,
      current_bpm: request.currentBpm,
      current_key: request.currentKey,
      current_energy: request.currentEnergy,
      event_type: request.eventType,
      time_of_night: request.timeOfNight,
      crowd_vibe: request.crowdVibe,
      recent_tracks: request.recentTracks,
    })
    return response.data
  },
  queryStream: async (
    request: DJIntelligenceRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> => {
    const response = await fetch(`${API_URL_INTERNAL}/api/ai/dj-intel/query/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: request.query,
        persona_id: request.personaId,
        current_bpm: request.currentBpm,
        current_key: request.currentKey,
        current_energy: request.currentEnergy,
        event_type: request.eventType,
        time_of_night: request.timeOfNight,
        crowd_vibe: request.crowdVibe,
        recent_tracks: request.recentTracks,
      }),
    })

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) return

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split("\n")

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6)
          if (data === "[DONE]") return

          try {
            const parsed = JSON.parse(data)
            if (parsed.chunk) {
              onChunk(parsed.chunk)
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  },
  suggestNextTrack: async (
    currentTrackId: string,
    targetEnergy?: number,
    targetBpm?: number,
    eventType?: string,
    personaId?: string
  ) => {
    const response = await api.post("/api/ai/dj-intel/suggest-next-track", null, {
      params: {
        current_track_id: currentTrackId,
        target_energy: targetEnergy,
        target_bpm: targetBpm,
        event_type: eventType,
        persona_id: personaId,
      },
    })
    return response.data
  },
  recoverEnergy: async (
    currentEnergy: number,
    targetEnergy: number,
    tracksAvailable: number = 2,
    personaId?: string
  ) => {
    const response = await api.post("/api/ai/dj-intel/recover-energy", null, {
      params: {
        current_energy: currentEnergy,
        target_energy: targetEnergy,
        tracks_available: tracksAvailable,
        persona_id: personaId,
      },
    })
    return response.data
  },
  suggestBpmRamp: async (
    currentBpm: number,
    targetBpm: number,
    timeAvailable?: number,
    eventType?: string,
    personaId?: string
  ) => {
    const response = await api.post("/api/ai/dj-intel/bpm-ramp", null, {
      params: {
        current_bpm: currentBpm,
        target_bpm: targetBpm,
        time_available: timeAvailable,
        event_type: eventType,
        persona_id: personaId,
      },
    })
    return response.data
  },
}

// ============================================
// Transcription API
// ============================================

export interface TranscriptionResponse {
  text: string
  language: string
  duration: number
  segments: Array<{
    id?: number
    start?: number
    end?: number
    text?: string
  }>
  confidence: number
}

export const transcriptionApi = {
  transcribeFile: async (
    file: File,
    language?: string,
    prompt?: string
  ): Promise<TranscriptionResponse> => {
    const formData = new FormData()
    formData.append("file", file)
    if (language) formData.append("language", language)
    if (prompt) formData.append("prompt", prompt)

    const response = await api.post("/api/ai/transcribe/transcribe", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  },
  transcribeBytes: async (
    audioBase64: string,
    filename?: string,
    language?: string,
    prompt?: string
  ): Promise<TranscriptionResponse> => {
    const response = await api.post("/api/ai/transcribe/transcribe-bytes", {
      audio_base64: audioBase64,
      filename: filename || "audio.mp3",
      language,
      prompt,
    })
    return response.data
  },
}

// ============================================
// Embeddings API
// ============================================

export interface EmbeddingRequest {
  texts: string[]
  model?: string
}

export interface EmbeddingResponse {
  embeddings: number[][]
  model: string
  usage?: {
    prompt_tokens?: number
    total_tokens?: number
  }
}

export const embeddingsApi = {
  generate: async (request: EmbeddingRequest): Promise<EmbeddingResponse> => {
    const response = await api.post("/api/ai/embeddings/generate", {
      texts: request.texts,
      model: request.model,
    })
    return response.data
  },
  embedTrack: async (trackId: string) => {
    const response = await api.post(`/api/ai/embeddings/track/${trackId}`)
    return response.data
  },
  embedSet: async (setId: string) => {
    const response = await api.post(`/api/ai/embeddings/set/${setId}`)
    return response.data
  },
}

// ============================================
// Visuals API
// ============================================

export interface VisualAnalysisRequest {
  imageUrl: string
  context?: string
}

export interface VisualAnalysisResponse {
  energy_estimate: number
  mood_tags: string[]
  crowd_size: string
  lighting: string
  vibe: string
  raw_response: string
}

export interface VisualGenerationRequest {
  prompt: string
  style?: "club" | "festival" | "underground" | "corporate"
  size?: "1024x1024" | "1792x1024" | "1024x1792"
  quality?: "standard" | "hd"
}

export interface VisualGenerationResponse {
  image_url: string
  revised_prompt: string
  style: string
  size: string
}

export const visualsApi = {
  analyzeCrowd: async (
    request: VisualAnalysisRequest
  ): Promise<VisualAnalysisResponse> => {
    const response = await api.post("/api/ai/visuals/analyze-crowd", {
      image_url: request.imageUrl,
      context: request.context,
    })
    return response.data
  },
  generate: async (
    request: VisualGenerationRequest
  ): Promise<VisualGenerationResponse> => {
    const response = await api.post("/api/ai/visuals/generate", {
      prompt: request.prompt,
      style: request.style || "club",
      size: request.size || "1024x1024",
      quality: request.quality || "standard",
    })
    return response.data
  },
  generateLogo: async (djName: string, style?: string, description?: string) => {
    const response = await api.post("/api/ai/visuals/generate-logo", null, {
      params: {
        dj_name: djName,
        style: style || "club",
        description,
      },
    })
    return response.data
  },
  generatePoster: async (
    eventName: string,
    date?: string,
    venue?: string,
    style?: string
  ) => {
    const response = await api.post("/api/ai/visuals/generate-poster", null, {
      params: {
        event_name: eventName,
        date,
        venue,
        style: style || "festival",
      },
    })
    return response.data
  },
}

// ============================================
// Enhanced AI Voice API
// ============================================

export interface EnhancedAIVoiceRequest {
  text: string
  personaId?: string
  voice?: string
  speed?: number
  tempo?: number
  key?: string
  style?: string
}

export interface EnhancedAIVoiceResponse {
  audio_url: string
  duration: number
  beat_markers?: number[]
  suggested_drop_timing?: number
  voice: string
  text: string
}

export const enhancedAIVoiceApi = {
  generate: async (request: EnhancedAIVoiceRequest): Promise<EnhancedAIVoiceResponse> => {
    const response = await api.post("/api/ai-voice/generate-enhanced", {
      text: request.text,
      persona_id: request.personaId,
      voice: request.voice,
      speed: request.speed,
      tempo: request.tempo,
      key: request.key,
      style: request.style,
    })
    return response.data
  },
}

// ============================================
// Personas API
// ============================================

export interface DJPersona {
  id: string
  name: string
  description?: string
  voice_settings?: Record<string, any>
}

export const personasApi = {
  list: async (): Promise<DJPersona[]> => {
    const response = await api.get("/api/personas/")
    return response.data
  },
  get: async (personaId: string): Promise<DJPersona> => {
    const response = await api.get(`/api/personas/${personaId}`)
    return response.data
  },
}

// ============================================
// Spotify Playlist API
// ============================================

export interface SpotifyPlaylistImage {
  url: string
  width: number
  height: number
}

export interface SpotifyPlaylist {
  id: string
  name: string
  description?: string
  public: boolean
  collaborative: boolean
  owner?: string
  tracks_count: number
  images: SpotifyPlaylistImage[]
  external_urls: { spotify: string }
  snapshot_id?: string
  followers?: number
}

export interface SpotifyTrackArtist {
  name: string
  id?: string
}

export interface SpotifyPlaylistTrack {
  id: string
  name: string
  artist: string
  artists: SpotifyTrackArtist[]
  album?: string
  album_image_url?: string
  duration_ms: number
  popularity?: number
  preview_url?: string
  external_urls: { spotify: string }
  uri: string
}

export interface SpotifyPlaylistItem {
  added_at?: string
  added_by?: string
  is_local: boolean
  track: SpotifyPlaylistTrack
}

export interface NormalizedSpotifyPlaylist {
  id: string
  name: string
  imageUrl?: string
  ownerId?: string
  tracksTotal: number
  uri?: string
  href?: string
}

export interface LocalPlaylist {
  id: string
  name: string
  description?: string
  coverArt?: string
  is_public: boolean
  track_count: number
  created_at: string
  updated_at?: string
}

export interface SpotifyPlaylistTracksResponse {
  tracks: SpotifyPlaylistItem[]
  count: number
}

export interface SpotifyAuthResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

export interface SpotifyUserProfile {
  id: string
  display_name: string
  email: string
  product: string
  is_premium: boolean
  country: string
  images: Array<{ url: string; height: number; width: number }>
}

export interface PremiumStatus {
  is_premium: boolean
  product: string
  message: string
}

export const spotifyAuthApi = {
  getAuthUrl: (): string => {
    return `${API_URL}/api/auth/spotify`
  },
  handleCallback: async (code: string): Promise<SpotifyAuthResponse> => {
    const response = await api.get(`/api/auth/spotify/callback?code=${code}`)
    return response.data
  },
  refreshToken: async (refreshToken: string): Promise<SpotifyAuthResponse> => {
    const response = await api.post("/api/auth/spotify/refresh", {
      refresh_token: refreshToken,
    })
    return response.data
  },
  getUserProfile: async (accessToken: string): Promise<SpotifyUserProfile> => {
    const response = await api.get("/api/auth/spotify/me", {
      params: { access_token: accessToken },
    })
    return response.data
  },
  checkPremium: async (accessToken: string): Promise<PremiumStatus> => {
    const response = await api.get("/api/auth/spotify/check-premium", {
      params: { access_token: accessToken },
    })
    return response.data
  },
}

export const spotifyPlaylistsApi = {
  getUserPlaylists: async (token: string, limit = 50): Promise<SpotifyPlaylist[]> => {
    const response = await api.get("/api/spotify/me/playlists", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: { limit },
    })
    return response.data.playlists
  },
  getUserPlaylistsNormalized: async (token: string, refreshToken?: string): Promise<NormalizedSpotifyPlaylist[]> => {
    const response = await api.get("/api/spotify/playlists", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: refreshToken ? { refresh_token: refreshToken } : {},
    })
    return response.data
  },
  getPlaylist: async (playlistId: string, token?: string): Promise<SpotifyPlaylist> => {
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    const response = await api.get(`/api/spotify/playlists/${playlistId}`, { headers })
    return response.data
  },
  getPlaylistTracks: async (
    playlistId: string,
    token?: string,
    limit = 100
  ): Promise<SpotifyPlaylistTracksResponse> => {
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    const response = await api.get(`/api/spotify/playlists/${playlistId}/tracks`, {
      headers,
      params: { limit },
    })
    return response.data
  },
  createPlaylist: async (
    token: string,
    name: string,
    description?: string,
    public_playlist = true,
    collaborative = false
  ): Promise<SpotifyPlaylist> => {
    const response = await api.post(
      "/api/spotify/playlists",
      {
        name,
        description,
        public: public_playlist,
        collaborative,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    return response.data
  },
  updatePlaylist: async (
    playlistId: string,
    token: string,
    updates: {
      name?: string
      description?: string
      public?: boolean
      collaborative?: boolean
    }
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(
      `/api/spotify/playlists/${playlistId}`,
      updates,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    return response.data
  },
  addTracks: async (
    playlistId: string,
    token: string,
    trackUris: string[],
    position?: number
  ): Promise<any> => {
    const response = await api.post(
      `/api/spotify/playlists/${playlistId}/tracks`,
      {
        track_uris: trackUris,
        position,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    return response.data
  },
  removeTracks: async (
    playlistId: string,
    token: string,
    trackUris: string[],
    snapshotId?: string
  ): Promise<any> => {
    const response = await api.delete(`/api/spotify/playlists/${playlistId}/tracks`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: {
        track_uris: trackUris,
        snapshot_id: snapshotId,
      },
    })
    return response.data
  },
  reorderTracks: async (
    playlistId: string,
    token: string,
    rangeStart: number,
    insertBefore: number,
    rangeLength = 1,
    snapshotId?: string
  ): Promise<any> => {
    const response = await api.put(
      `/api/spotify/playlists/${playlistId}/tracks`,
      {
        range_start: rangeStart,
        insert_before: insertBefore,
        range_length: rangeLength,
        snapshot_id: snapshotId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    return response.data
  },
  followPlaylist: async (
    playlistId: string,
    token: string,
    public_follow = true
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(
      `/api/spotify/playlists/${playlistId}/follow`,
      null,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { public: public_follow },
      }
    )
    return response.data
  },
  unfollowPlaylist: async (
    playlistId: string,
    token: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/api/spotify/playlists/${playlistId}/follow`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  },
}

export const localPlaylistsApi = {
  getAll: async (): Promise<LocalPlaylist[]> => {
    const response = await api.get("/api/playlists")
    return response.data
  },
  getById: async (playlistId: string): Promise<LocalPlaylist> => {
    const response = await api.get(`/api/playlists/${playlistId}`)
    return response.data
  },
  create: async (playlist: { name: string; description?: string }): Promise<LocalPlaylist> => {
    const response = await api.post("/api/playlists", playlist)
    return response.data
  },
  update: async (playlistId: string, updates: { name?: string; description?: string }): Promise<LocalPlaylist> => {
    const response = await api.put(`/api/playlists/${playlistId}`, updates)
    return response.data
  },
  delete: async (playlistId: string): Promise<void> => {
    await api.delete(`/api/playlists/${playlistId}`)
  },
  addTracks: async (playlistId: string, data: { trackIds: string[] }): Promise<void> => {
    await api.post(`/api/playlists/${playlistId}/tracks`, data)
  },
  removeTracks: async (playlistId: string, data: { trackIds: string[] }): Promise<void> => {
    await api.delete(`/api/playlists/${playlistId}/tracks`, { data })
  },
}



