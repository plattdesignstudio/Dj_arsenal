from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import Track, Set, SetTrack
from app.schemas import FlowSuggestionRequest, FlowSuggestionResponse
from app.services.flow_engine import FlowEngine

router = APIRouter()

@router.post("/suggest-next")
async def suggest_next_track(
    request: FlowSuggestionRequest,
    db: Session = Depends(get_db)
):
    """Get flow suggestions for next track"""
    current_track = db.query(Track).filter(Track.id == request.current_track_id).first()
    if not current_track:
        raise HTTPException(status_code=404, detail="Current track not found")
    
    # Get all available tracks
    all_tracks = db.query(Track).filter(Track.id != request.current_track_id).all()
    
    # Get suggestions
    suggestions = FlowEngine.suggest_next_track(
        current_track=current_track,
        available_tracks=all_tracks,
        target_energy=request.target_energy,
        target_bpm=request.target_bpm
    )
    
    # Format response
    result = []
    for track, score, reason in suggestions[:10]:  # Top 10
        result.append(FlowSuggestionResponse(
            track=track,
            compatibility_score=score,
            reason=reason,
            transition_type="smooth" if score > 0.7 else "moderate" if score > 0.4 else "risky"
        ))
    
    return result

@router.post("/bpm-transition")
async def calculate_bpm_transition(from_bpm: float, to_bpm: float):
    """Calculate BPM transition analysis"""
    return FlowEngine.calculate_bpm_transition(from_bpm, to_bpm)

@router.get("/energy-curve/{set_id}")
async def get_energy_curve(set_id: str, db: Session = Depends(get_db)):
    """Get energy curve for a set"""
    db_set = db.query(Set).filter(Set.id == set_id).first()
    if not db_set:
        raise HTTPException(status_code=404, detail="Set not found")
    
    set_tracks = db.query(SetTrack).filter(SetTrack.set_id == set_id).order_by(SetTrack.position).all()
    tracks = [db.query(Track).filter(Track.id == st.track_id).first() for st in set_tracks]
    tracks = [t for t in tracks if t]
    
    curve = FlowEngine.build_energy_curve(tracks)
    drops = FlowEngine.detect_energy_drops(curve)
    
    return {
        "curve": curve,
        "drops": drops,
        "total_duration": sum(t.duration for t in tracks if t.duration)
    }

@router.post("/optimize-set/{set_id}")
async def optimize_set_order(set_id: str, db: Session = Depends(get_db)):
    """Optimize track order in a set"""
    db_set = db.query(Set).filter(Set.id == set_id).first()
    if not db_set:
        raise HTTPException(status_code=404, detail="Set not found")
    
    set_tracks = db.query(SetTrack).filter(SetTrack.set_id == set_id).order_by(SetTrack.position).all()
    tracks = [db.query(Track).filter(Track.id == st.track_id).first() for st in set_tracks]
    tracks = [t for t in tracks if t]
    
    optimized = FlowEngine.optimize_set_order(tracks)
    
    # Update positions
    for idx, track in enumerate(optimized):
        set_track = db.query(SetTrack).filter(
            SetTrack.set_id == set_id,
            SetTrack.track_id == track.id
        ).first()
        if set_track:
            set_track.position = idx
    
    db.commit()
    
    return {"message": "Set optimized", "track_count": len(optimized)}






