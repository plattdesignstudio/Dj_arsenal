from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database import get_db
from app.models import Track, TrackAnalysis
from app.schemas import TrackCreate, TrackResponse, AnalysisRequest, AnalysisResponse

# Optional import for audio analysis - only import if librosa is available
try:
    from app.services.audio_analysis import AudioAnalyzer
    AUDIO_ANALYSIS_AVAILABLE = True
except ImportError:
    AUDIO_ANALYSIS_AVAILABLE = False
    AudioAnalyzer = None
    print("Warning: librosa not installed. Audio analysis features will be disabled.")

router = APIRouter()

@router.post("/", response_model=TrackResponse)
async def create_track(track: TrackCreate, db: Session = Depends(get_db)):
    """Create a new track"""
    track_data = track.dict()
    # If album_image_url is provided but cover_art is not, use album_image_url as cover_art
    if track_data.get("album_image_url") and not track_data.get("cover_art"):
        track_data["cover_art"] = track_data["album_image_url"]
    # Remove album_image_url from track_data as it's not a database field
    track_data.pop("album_image_url", None)
    # preview_url is now a database field, so keep it in track_data
    
    db_track = Track(
        id=str(uuid.uuid4()),
        **track_data
    )
    db.add(db_track)
    db.commit()
    db.refresh(db_track)
    
    # Add album_image_url to response if cover_art is from Spotify
    track_dict = db_track.__dict__.copy()
    track_dict.pop("_sa_instance_state", None)
    if db_track.cover_art and ("i.scdn.co" in db_track.cover_art or "spotify" in db_track.cover_art.lower()):
        track_dict["album_image_url"] = db_track.cover_art
    # preview_url is now stored in the database, so it will be in track_dict automatically
    return track_dict

@router.get("/", response_model=List[TrackResponse])
async def get_tracks(
    skip: int = 0,
    limit: int = 100,
    genre: str = None,
    min_bpm: float = None,
    max_bpm: float = None,
    db: Session = Depends(get_db)
):
    """Get all tracks with optional filters"""
    query = db.query(Track)
    
    if genre:
        query = query.filter(Track.genre == genre)
    if min_bpm:
        query = query.filter(Track.bpm >= min_bpm)
    if max_bpm:
        query = query.filter(Track.bpm <= max_bpm)
    
    tracks = query.offset(skip).limit(limit).all()
    # Convert to dict and add album_image_url if cover_art is from Spotify
    result = []
    for track in tracks:
        track_dict = track.__dict__.copy()
        # Remove SQLAlchemy internal attributes
        track_dict.pop("_sa_instance_state", None)
        # If cover_art looks like a Spotify URL, also include it as album_image_url
        if track.cover_art and ("i.scdn.co" in track.cover_art or "spotify" in track.cover_art.lower()):
            track_dict["album_image_url"] = track.cover_art
        result.append(track_dict)
    return result

@router.get("/{track_id}", response_model=TrackResponse)
async def get_track(track_id: str, db: Session = Depends(get_db)):
    """Get a specific track"""
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    # Convert to dict and add album_image_url if cover_art is from Spotify
    track_dict = track.__dict__.copy()
    # Remove SQLAlchemy internal attributes
    track_dict.pop("_sa_instance_state", None)
    # If cover_art looks like a Spotify URL, also include it as album_image_url
    if track.cover_art and ("i.scdn.co" in track.cover_art or "spotify" in track.cover_art.lower()):
        track_dict["album_image_url"] = track.cover_art
    return track_dict

@router.post("/{track_id}/analyze", response_model=AnalysisResponse)
async def analyze_track(
    track_id: str,
    analysis: AnalysisRequest,
    db: Session = Depends(get_db)
):
    """Analyze a track (BPM, key, energy)"""
    if not AUDIO_ANALYSIS_AVAILABLE:
        raise HTTPException(
            status_code=503, 
            detail="Audio analysis not available. Please install librosa and soundfile."
        )
    
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    
    if not track.file_path:
        raise HTTPException(status_code=400, detail="Track file not available")
    
    # Perform analysis
    if not AudioAnalyzer:
        raise HTTPException(
            status_code=503, 
            detail="Audio analysis not available. Please install librosa: pip install librosa soundfile"
        )
    
    if analysis.analysis_type == "full":
        result = AudioAnalyzer.full_analysis(track.file_path)
    elif analysis.analysis_type == "bpm":
        result = AudioAnalyzer.analyze_bpm(track.file_path)
    elif analysis.analysis_type == "key":
        result = AudioAnalyzer.analyze_key(track.file_path)
    elif analysis.analysis_type == "energy":
        result = AudioAnalyzer.analyze_energy(track.file_path)
    else:
        raise HTTPException(status_code=400, detail="Invalid analysis type")
    
    # Update track with results
    if "bpm" in result:
        track.bpm = result.get("bpm")
    if "key" in result:
        track.key = result.get("key")
    if "energy" in result:
        track.energy = result.get("energy")
    
    # Save analysis record
    db_analysis = TrackAnalysis(
        id=str(uuid.uuid4()),
        track_id=track_id,
        analysis_type=analysis.analysis_type,
        result=result,
        confidence=result.get("confidence")
    )
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)
    
    return AnalysisResponse(
        track_id=track_id,
        analysis_type=analysis.analysis_type,
        result=result,
        confidence=result.get("confidence")
    )

@router.get("/{track_id}/compatible")
async def get_compatible_tracks(
    track_id: str,
    db: Session = Depends(get_db)
):
    """Get tracks compatible with current track"""
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    
    # Get all tracks
    all_tracks = db.query(Track).filter(Track.id != track_id).all()
    
    compatible = []
    for t in all_tracks:
        score = 0.0
        reasons = []
        
        # BPM compatibility
        if track.bpm and t.bpm:
            bpm_diff = abs(track.bpm - t.bpm)
            if bpm_diff < 3:
                score += 0.5
                reasons.append("bpm_match")
        
        # Key compatibility
        if track.key and t.key:
            from app.services.harmonic_mixing import HarmonicMixingEngine
            compat = HarmonicMixingEngine.get_compatible_keys(track.key)
            if t.key in compat["perfect"] or t.key in compat["safe"]:
                score += 0.5
                reasons.append("key_compatible")
        
        if score > 0:
            compatible.append({
                "track": t,
                "score": score,
                "reasons": reasons
            })
    
    compatible.sort(key=lambda x: x["score"], reverse=True)
    return compatible

@router.delete("/{track_id}")
async def delete_track(track_id: str, db: Session = Depends(get_db)):
    """Delete a track"""
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    
    db.delete(track)
    db.commit()
    return {"message": "Track deleted successfully"}


