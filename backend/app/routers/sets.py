from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database import get_db
from app.models import Set, SetTrack, Track
from app.schemas import SetCreate, SetResponse, SetWithTracks, SetTrackResponse

router = APIRouter()

@router.post("/", response_model=SetResponse)
async def create_set(set_data: SetCreate, db: Session = Depends(get_db)):
    """Create a new DJ set"""
    db_set = Set(
        id=str(uuid.uuid4()),
        name=set_data.name,
        description=set_data.description,
        event_type_id=set_data.event_type_id,
        duration=set_data.duration
    )
    db.add(db_set)
    db.commit()
    
    # Add tracks if provided
    if set_data.track_ids:
        for idx, track_id in enumerate(set_data.track_ids):
            track = db.query(Track).filter(Track.id == track_id).first()
            if track:
                set_track = SetTrack(
                    id=str(uuid.uuid4()),
                    set_id=db_set.id,
                    track_id=track_id,
                    position=idx
                )
                db.add(set_track)
        
        db.commit()
    
    db.refresh(db_set)
    return db_set

@router.get("/", response_model=List[SetResponse])
async def get_sets(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all sets"""
    sets = db.query(Set).offset(skip).limit(limit).all()
    return sets

@router.get("/{set_id}", response_model=SetWithTracks)
async def get_set(set_id: str, db: Session = Depends(get_db)):
    """Get a specific set with tracks"""
    db_set = db.query(Set).filter(Set.id == set_id).first()
    if not db_set:
        raise HTTPException(status_code=404, detail="Set not found")
    
    set_tracks = db.query(SetTrack).filter(SetTrack.set_id == set_id).order_by(SetTrack.position).all()
    
    tracks_data = []
    for st in set_tracks:
        track = db.query(Track).filter(Track.id == st.track_id).first()
        if track:
            tracks_data.append(SetTrackResponse(
                id=st.id,
                position=st.position,
                track=track,
                transition_bpm=st.transition_bpm,
                transition_key=st.transition_key,
                notes=st.notes
            ))
    
    return SetWithTracks(
        **db_set.__dict__,
        set_tracks=tracks_data
    )

@router.post("/{set_id}/tracks/{track_id}")
async def add_track_to_set(
    set_id: str,
    track_id: str,
    position: int = None,
    db: Session = Depends(get_db)
):
    """Add a track to a set"""
    db_set = db.query(Set).filter(Set.id == set_id).first()
    if not db_set:
        raise HTTPException(status_code=404, detail="Set not found")
    
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    
    # If position not specified, add to end
    if position is None:
        max_position = db.query(SetTrack).filter(SetTrack.set_id == set_id).count()
        position = max_position
    
    set_track = SetTrack(
        id=str(uuid.uuid4()),
        set_id=set_id,
        track_id=track_id,
        position=position
    )
    db.add(set_track)
    db.commit()
    
    return {"message": "Track added to set", "set_track_id": set_track.id}

@router.delete("/{set_id}/tracks/{track_id}")
async def remove_track_from_set(
    set_id: str,
    track_id: str,
    db: Session = Depends(get_db)
):
    """Remove a track from a set"""
    set_track = db.query(SetTrack).filter(
        SetTrack.set_id == set_id,
        SetTrack.track_id == track_id
    ).first()
    
    if not set_track:
        raise HTTPException(status_code=404, detail="Track not found in set")
    
    db.delete(set_track)
    db.commit()
    
    return {"message": "Track removed from set"}






