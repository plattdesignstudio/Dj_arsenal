from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class TrackBase(BaseModel):
    title: str
    artist: str
    duration: int
    bpm: Optional[float] = None
    key: Optional[str] = None
    energy: Optional[float] = None
    genre: Optional[str] = None
    mood: Optional[str] = None
    file_path: Optional[str] = None
    cover_art: Optional[str] = None
    preview_url: Optional[str] = None  # Spotify preview URL

class TrackCreate(TrackBase):
    pass

class TrackResponse(TrackBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    album_image_url: Optional[str] = None  # Spotify album art URL (derived from cover_art if from Spotify)
    preview_url: Optional[str] = None  # Spotify preview URL
    
    class Config:
        from_attributes = True

class SetBase(BaseModel):
    name: str
    description: Optional[str] = None
    event_type_id: Optional[str] = None
    duration: int

class SetCreate(SetBase):
    track_ids: Optional[List[str]] = []

class SetResponse(SetBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class SetTrackResponse(BaseModel):
    id: str
    position: int
    track: TrackResponse
    transition_bpm: Optional[float] = None
    transition_key: Optional[str] = None
    notes: Optional[str] = None
    
    class Config:
        from_attributes = True

class SetWithTracks(SetResponse):
    set_tracks: List[SetTrackResponse] = []

class EventTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    min_bpm: float
    max_bpm: float
    energy_curve: Optional[Dict[str, Any]] = None
    genre_weighting: Optional[Dict[str, Any]] = None
    vocal_frequency: float = 0.5
    drop_intensity: float = 0.5

class EventTypeCreate(EventTypeBase):
    pass

class EventTypeResponse(EventTypeBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class AnalysisRequest(BaseModel):
    track_id: str
    analysis_type: str = "full"  # "bpm", "key", "energy", "full"

class AnalysisResponse(BaseModel):
    track_id: str
    analysis_type: str
    result: Dict[str, Any]
    confidence: Optional[float] = None

class AIVoiceRequest(BaseModel):
    text: str
    persona_id: Optional[str] = None
    voice_type: str = "hype"  # "hype", "drop", "tag", "custom"
    bpm: Optional[float] = None
    key: Optional[str] = None
    autotune: bool = False

class AIVoiceResponse(BaseModel):
    id: str
    text: str
    audio_url: str
    voice_type: str
    bpm: Optional[float] = None
    key: Optional[str] = None

class FlowSuggestionRequest(BaseModel):
    current_track_id: str
    target_energy: Optional[float] = None
    target_bpm: Optional[float] = None
    event_type_id: Optional[str] = None

class FlowSuggestionResponse(BaseModel):
    track: TrackResponse
    compatibility_score: float
    reason: str
    transition_type: str

class HarmonicCompatibilityRequest(BaseModel):
    track_id: str
    target_key: Optional[str] = None

class HarmonicCompatibilityResponse(BaseModel):
    compatible_keys: List[str]
    safe_transitions: List[str]
    modal_interchange: List[str]

# ============================================
# DJ Intelligence Schemas
# ============================================

class DJIntelligenceRequest(BaseModel):
    query: str
    persona_id: Optional[str] = None
    current_bpm: Optional[float] = None
    current_key: Optional[str] = None
    current_energy: Optional[float] = None
    event_type: Optional[str] = None
    time_of_night: Optional[str] = None
    crowd_vibe: Optional[str] = None
    recent_tracks: Optional[List[str]] = None

class DJIntelligenceResponse(BaseModel):
    response: str
    model: str
    usage: Dict[str, Any] = {}

# ============================================
# Enhanced AI Voice Schemas
# ============================================

class EnhancedAIVoiceRequest(BaseModel):
    text: str
    persona_id: Optional[str] = None
    voice: Optional[str] = None  # alloy, echo, fable, onyx, nova, shimmer
    speed: Optional[float] = 1.0
    tempo: Optional[float] = None  # BPM for beat alignment
    key: Optional[str] = None
    style: Optional[str] = None  # festival, club, underground, etc.

class EnhancedAIVoiceResponse(BaseModel):
    id: str
    text: str
    audio_url: str
    duration: float
    beat_markers: List[float] = []
    voice: str
    speed: float
    tempo: Optional[float] = None
    key: Optional[str] = None
    style: Optional[str] = None
    suggested_drop_timing: Optional[float] = None

# ============================================
# Transcription Schemas
# ============================================

class TranscriptionRequest(BaseModel):
    audio_base64: str
    filename: Optional[str] = "audio.mp3"
    language: Optional[str] = None
    prompt: Optional[str] = None

class TranscriptionResponse(BaseModel):
    text: str
    language: str
    duration: float
    segments: List[Dict[str, Any]] = []
    confidence: float = 0.95

# ============================================
# Embeddings Schemas
# ============================================

class EmbeddingRequest(BaseModel):
    texts: List[str]
    model: Optional[str] = None

class EmbeddingResponse(BaseModel):
    embeddings: List[List[float]]
    model: str
    usage: Dict[str, Any] = {}

class TrackEmbeddingRequest(BaseModel):
    track_id: str

class SetEmbeddingRequest(BaseModel):
    set_id: str

# ============================================
# Visual Analysis Schemas
# ============================================

class VisualAnalysisRequest(BaseModel):
    image_url: str
    context: Optional[str] = None

class VisualAnalysisResponse(BaseModel):
    energy_estimate: float
    mood_tags: List[str]
    crowd_size: str
    lighting: str
    vibe: str
    raw_response: str = ""

# ============================================
# Visual Generation Schemas
# ============================================

class VisualGenerationRequest(BaseModel):
    prompt: str
    style: Optional[str] = "club"  # club, festival, underground, corporate
    size: Optional[str] = "1024x1024"  # 1024x1024, 1792x1024, 1024x1792
    quality: Optional[str] = "standard"  # standard, hd

class VisualGenerationResponse(BaseModel):
    image_url: str
    revised_prompt: str
    style: str
    size: str

# ============================================
# DJ Persona Schemas
# ============================================

class DJPersonaResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    voice_settings: Dict[str, Any] = {}
    
    class Config:
        from_attributes = True

# ============================================
# Spotify Playlist Schemas
# ============================================

class SpotifyPlaylistImage(BaseModel):
    url: str
    width: int
    height: int

class SpotifyPlaylistBase(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    public: bool = False
    collaborative: bool = False
    owner: Optional[str] = None
    tracks_count: int = 0
    images: List[SpotifyPlaylistImage] = []
    external_urls: Dict[str, str] = {}
    snapshot_id: Optional[str] = None
    followers: Optional[int] = None

class SpotifyPlaylistResponse(SpotifyPlaylistBase):
    pass

class SpotifyPlaylistCreate(BaseModel):
    name: str
    description: Optional[str] = None
    public: bool = True
    collaborative: bool = False

class SpotifyPlaylistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    public: Optional[bool] = None
    collaborative: Optional[bool] = None

class SpotifyTrackArtist(BaseModel):
    name: str
    id: Optional[str] = None

class SpotifyPlaylistTrack(BaseModel):
    id: str
    name: str
    artist: str
    artists: List[SpotifyTrackArtist] = []
    album: Optional[str] = None
    duration_ms: int
    popularity: Optional[int] = None
    preview_url: Optional[str] = None
    external_urls: Dict[str, str] = {}
    uri: str

class SpotifyPlaylistItem(BaseModel):
    added_at: Optional[str] = None
    added_by: Optional[str] = None
    is_local: bool = False
    track: SpotifyPlaylistTrack

class SpotifyPlaylistTracksResponse(BaseModel):
    tracks: List[SpotifyPlaylistItem] = []
    count: int = 0

class AddTracksToPlaylistRequest(BaseModel):
    track_uris: List[str]
    position: Optional[int] = None

class RemoveTracksFromPlaylistRequest(BaseModel):
    track_uris: List[str]
    snapshot_id: Optional[str] = None

class ReorderPlaylistRequest(BaseModel):
    range_start: int
    insert_before: int
    range_length: int = 1
    snapshot_id: Optional[str] = None

# ============================================
# Local Playlist Schemas
# ============================================

class PlaylistBase(BaseModel):
    name: str
    description: Optional[str] = None
    cover_art: Optional[str] = None
    is_public: bool = False

class PlaylistCreate(PlaylistBase):
    pass

class PlaylistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cover_art: Optional[str] = None
    is_public: Optional[bool] = None

class PlaylistResponse(PlaylistBase):
    id: str
    user_id: Optional[str] = None
    track_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class PlaylistTrackBase(BaseModel):
    track_id: str
    position: Optional[int] = None
    notes: Optional[str] = None
    spotify_uri: Optional[str] = None

class PlaylistTrackCreate(PlaylistTrackBase):
    pass

class PlaylistTrackResponse(BaseModel):
    id: str
    playlist_id: str
    track_id: str
    position: int
    added_at: datetime
    notes: Optional[str] = None
    spotify_uri: Optional[str] = None
    track: TrackResponse
    
    class Config:
        from_attributes = True

class PlaylistWithTracks(PlaylistResponse):
    playlist_tracks: List[PlaylistTrackResponse] = []

class AddTracksToLocalPlaylistRequest(BaseModel):
    track_ids: List[str]
    position: Optional[int] = None

class RemoveTracksFromLocalPlaylistRequest(BaseModel):
    track_ids: List[str]

class ReorderLocalPlaylistRequest(BaseModel):
    track_id: str
    new_position: int

class DuplicatePlaylistRequest(BaseModel):
    name: Optional[str] = None



