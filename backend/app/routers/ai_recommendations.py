from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models import Track
from app.services.ai_recommendations import AIRecommendationEngine
from app.services.ai_set_generator import AISetGenerator

router = APIRouter()

class TrackSuggestionRequest(BaseModel):
    current_track_id: str
    event_type: Optional[str] = None
    energy_level: Optional[str] = None
    crowd_vibe: Optional[str] = None

class SetGenerationRequest(BaseModel):
    event_type: str = "Club Night"
    duration_minutes: int = 60
    start_energy: float = 0.4
    peak_energy: float = 0.9

@router.post("/suggest-tracks")
async def suggest_tracks(
    request: TrackSuggestionRequest,
    db: Session = Depends(get_db)
):
    """Get AI-powered track suggestions"""
    current_track = db.query(Track).filter(Track.id == request.current_track_id).first()
    if not current_track:
        raise HTTPException(status_code=404, detail="Current track not found")
    
    # Get available tracks
    all_tracks = db.query(Track).filter(Track.id != request.current_track_id).all()
    
    # Convert to dict format
    current_dict = {
        "id": current_track.id,
        "title": current_track.title,
        "artist": current_track.artist,
        "bpm": current_track.bpm,
        "key": current_track.key,
        "energy": current_track.energy,
        "genre": current_track.genre
    }
    
    available_dicts = [
        {
            "id": t.id,
            "title": t.title,
            "artist": t.artist,
            "bpm": t.bpm,
            "key": t.key,
            "energy": t.energy,
            "genre": t.genre
        }
        for t in all_tracks
    ]
    
    context = {
        "event_type": request.event_type,
        "energy_level": request.energy_level,
        "crowd_vibe": request.crowd_vibe
    }
    
    engine = AIRecommendationEngine()
    suggestions = engine.suggest_tracks(current_dict, available_dicts, context)
    
    # Convert back to track objects
    suggestion_ids = [s.get("id") for s in suggestions]
    suggested_tracks = db.query(Track).filter(Track.id.in_(suggestion_ids)).all()
    
    return {
        "suggestions": [
            {
                "id": t.id,
                "title": t.title,
                "artist": t.artist,
                "bpm": t.bpm,
                "key": t.key,
                "energy": t.energy,
                "genre": t.genre
            }
            for t in suggested_tracks
        ]
    }

@router.post("/generate-set")
async def generate_set(
    request: SetGenerationRequest,
    db: Session = Depends(get_db)
):
    """Generate AI-powered set plan"""
    # Get all tracks
    all_tracks = db.query(Track).all()
    
    if len(all_tracks) < 5:
        raise HTTPException(status_code=400, detail="Need at least 5 tracks to generate a set")
    
    # Convert to dict format
    tracks_dict = [
        {
            "id": t.id,
            "title": t.title,
            "artist": t.artist,
            "bpm": t.bpm,
            "key": t.key,
            "energy": t.energy,
            "genre": t.genre,
            "duration": t.duration
        }
        for t in all_tracks
    ]
    
    generator = AISetGenerator()
    plan = generator.generate_set_plan(
        tracks_dict,
        request.event_type,
        request.duration_minutes,
        request.start_energy,
        request.peak_energy
    )
    
    return plan

class OptimizeFlowRequest(BaseModel):
    track_ids: List[str]
    feedback: Optional[str] = None

@router.post("/optimize-flow")
async def optimize_flow(
    request: OptimizeFlowRequest,
    db: Session = Depends(get_db)
):
    """AI-powered set flow optimization"""
    tracks = db.query(Track).filter(Track.id.in_(request.track_ids)).all()
    
    if len(tracks) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 tracks")
    
    tracks_dict = [
        {
            "id": t.id,
            "title": t.title,
            "artist": t.artist,
            "bpm": t.bpm,
            "key": t.key,
            "energy": t.energy,
            "genre": t.genre
        }
        for t in tracks
    ]
    
    generator = AISetGenerator()
    optimized = generator.optimize_set_flow(tracks_dict, request.feedback)
    
    return {
        "optimized_order": [t["id"] for t in optimized]
    }

class GenerateDescriptionRequest(BaseModel):
    track_ids: List[str]
    event_type: str = "Club Night"

@router.post("/generate-description")
async def generate_description(
    request: GenerateDescriptionRequest,
    db: Session = Depends(get_db)
):
    """Generate AI-powered set description"""
    tracks = db.query(Track).filter(Track.id.in_(request.track_ids)).all()
    
    tracks_dict = [
        {
            "title": t.title,
            "artist": t.artist,
            "bpm": t.bpm,
            "key": t.key
        }
        for t in tracks
    ]
    
    engine = AIRecommendationEngine()
    description = engine.generate_set_description(tracks_dict, request.event_type)
    
    return {"description": description}

@router.post("/generate-tags/{track_id}")
async def generate_tags(
    track_id: str,
    db: Session = Depends(get_db)
):
    """Generate AI-powered tags for a track"""
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    
    track_dict = {
        "title": track.title,
        "artist": track.artist,
        "genre": track.genre,
        "bpm": track.bpm,
        "key": track.key,
        "energy": track.energy
    }
    
    engine = AIRecommendationEngine()
    tags = engine.generate_track_tags(track_dict)
    
    return {"tags": tags}






