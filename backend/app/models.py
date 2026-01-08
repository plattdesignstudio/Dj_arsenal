from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, JSON, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Track(Base):
    __tablename__ = "tracks"
    
    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    artist = Column(String, nullable=False)
    duration = Column(Integer, nullable=False)
    bpm = Column(Float, nullable=True)
    key = Column(String, nullable=True)
    energy = Column(Float, nullable=True)
    genre = Column(String, nullable=True)
    mood = Column(String, nullable=True)
    file_path = Column(String, nullable=True)
    cover_art = Column(String, nullable=True)
    preview_url = Column(String, nullable=True)  # Spotify preview URL for playback
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    set_tracks = relationship("SetTrack", back_populates="track")
    analyses = relationship("TrackAnalysis", back_populates="track")
    playlist_tracks = relationship("PlaylistTrack", back_populates="track")

class Set(Base):
    __tablename__ = "sets"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    event_type_id = Column(String, ForeignKey("event_types.id"), nullable=True)
    duration = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    event_type = relationship("EventType", back_populates="sets")
    set_tracks = relationship("SetTrack", back_populates="set", order_by="SetTrack.position")
    performances = relationship("Performance", back_populates="set")

class SetTrack(Base):
    __tablename__ = "set_tracks"
    
    id = Column(String, primary_key=True, index=True)
    set_id = Column(String, ForeignKey("sets.id", ondelete="CASCADE"), nullable=False)
    track_id = Column(String, ForeignKey("tracks.id"), nullable=False)
    position = Column(Integer, nullable=False)
    transition_bpm = Column(Float, nullable=True)
    transition_key = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    set = relationship("Set", back_populates="set_tracks")
    track = relationship("Track", back_populates="set_tracks")

class EventType(Base):
    __tablename__ = "event_types"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    min_bpm = Column(Float, nullable=False)
    max_bpm = Column(Float, nullable=False)
    energy_curve = Column(JSON, nullable=True)
    genre_weighting = Column(JSON, nullable=True)
    vocal_frequency = Column(Float, nullable=False, default=0.5)
    drop_intensity = Column(Float, nullable=False, default=0.5)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    sets = relationship("Set", back_populates="event_type")

class TrackAnalysis(Base):
    __tablename__ = "track_analyses"
    
    id = Column(String, primary_key=True, index=True)
    track_id = Column(String, ForeignKey("tracks.id", ondelete="CASCADE"), nullable=False)
    analysis_type = Column(String, nullable=False)
    result = Column(JSON, nullable=False)
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    track = relationship("Track", back_populates="analyses")

class DJPersona(Base):
    __tablename__ = "dj_personas"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    voice_settings = Column(JSON, nullable=True)
    tone = Column(String, nullable=True)
    accent = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    autotune_level = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    voice_assets = relationship("AIVoiceAsset", back_populates="persona")

class AIVoiceAsset(Base):
    __tablename__ = "ai_voice_assets"
    
    id = Column(String, primary_key=True, index=True)
    persona_id = Column(String, ForeignKey("dj_personas.id"), nullable=True)
    text = Column(Text, nullable=False)
    audio_url = Column(String, nullable=False)
    voice_type = Column(String, nullable=False)
    bpm = Column(Float, nullable=True)
    key = Column(String, nullable=True)
    autotune = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    persona = relationship("DJPersona", back_populates="voice_assets")

class Performance(Base):
    __tablename__ = "performances"
    
    id = Column(String, primary_key=True, index=True)
    set_id = Column(String, ForeignKey("sets.id"), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    energy_levels = Column(JSON, nullable=True)
    crowd_vibe = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    set = relationship("Set", back_populates="performances")

class Playlist(Base):
    __tablename__ = "playlists"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    cover_art = Column(String, nullable=True)
    is_public = Column(Boolean, nullable=False, default=False)
    user_id = Column(String, nullable=True)  # For future multi-user support
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    playlist_tracks = relationship("PlaylistTrack", back_populates="playlist", 
                                   order_by="PlaylistTrack.position", 
                                   cascade="all, delete-orphan")
    
    __table_args__ = (
        {"sqlite_autoincrement": False},
    )

class PlaylistTrack(Base):
    __tablename__ = "playlist_tracks"
    
    id = Column(String, primary_key=True, index=True)
    playlist_id = Column(String, ForeignKey("playlists.id", ondelete="CASCADE"), nullable=False)
    track_id = Column(String, ForeignKey("tracks.id"), nullable=False)
    position = Column(Integer, nullable=False)
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)
    spotify_uri = Column(String, nullable=True)  # For Spotify tracks
    
    playlist = relationship("Playlist", back_populates="playlist_tracks")
    track = relationship("Track", back_populates="playlist_tracks")
    
    __table_args__ = (
        UniqueConstraint('playlist_id', 'position', name='uq_playlist_position'),
    )



