from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
import json

from app.database import get_db
from app.models import EventType
from app.schemas import EventTypeCreate, EventTypeResponse

router = APIRouter()

# Predefined event types
PREDEFINED_EVENTS = {
    "Club Night": {
        "min_bpm": 120,
        "max_bpm": 140,
        "energy_curve": [0.3, 0.5, 0.7, 0.9, 0.95, 0.9, 0.85],
        "genre_weighting": {"house": 0.3, "techno": 0.3, "bass": 0.2, "other": 0.2},
        "vocal_frequency": 0.6,
        "drop_intensity": 0.8
    },
    "Festival": {
        "min_bpm": 125,
        "max_bpm": 150,
        "energy_curve": [0.4, 0.6, 0.8, 0.95, 1.0, 0.95, 0.9],
        "genre_weighting": {"bass": 0.4, "house": 0.3, "techno": 0.2, "other": 0.1},
        "vocal_frequency": 0.7,
        "drop_intensity": 0.9
    },
    "Wedding": {
        "min_bpm": 100,
        "max_bpm": 130,
        "energy_curve": [0.4, 0.5, 0.6, 0.7, 0.8, 0.7, 0.6],
        "genre_weighting": {"pop": 0.4, "r&b": 0.3, "house": 0.2, "other": 0.1},
        "vocal_frequency": 0.9,
        "drop_intensity": 0.4
    },
    "Corporate Event": {
        "min_bpm": 100,
        "max_bpm": 120,
        "energy_curve": [0.3, 0.4, 0.5, 0.5, 0.4, 0.3, 0.2],
        "genre_weighting": {"pop": 0.5, "house": 0.3, "other": 0.2},
        "vocal_frequency": 0.8,
        "drop_intensity": 0.2
    },
    "Sunset Lounge": {
        "min_bpm": 90,
        "max_bpm": 110,
        "energy_curve": [0.2, 0.3, 0.4, 0.4, 0.3, 0.2, 0.1],
        "genre_weighting": {"chill": 0.5, "house": 0.3, "other": 0.2},
        "vocal_frequency": 0.4,
        "drop_intensity": 0.1
    },
    "Afterparty": {
        "min_bpm": 130,
        "max_bpm": 150,
        "energy_curve": [0.5, 0.7, 0.9, 0.95, 0.9, 0.85, 0.8],
        "genre_weighting": {"techno": 0.4, "bass": 0.3, "house": 0.2, "other": 0.1},
        "vocal_frequency": 0.5,
        "drop_intensity": 0.85
    },
    "Warehouse / Underground": {
        "min_bpm": 125,
        "max_bpm": 145,
        "energy_curve": [0.4, 0.6, 0.8, 0.9, 0.95, 0.9, 0.85],
        "genre_weighting": {"techno": 0.5, "house": 0.3, "other": 0.2},
        "vocal_frequency": 0.3,
        "drop_intensity": 0.7
    }
}

@router.post("/initialize")
async def initialize_event_types(db: Session = Depends(get_db)):
    """Initialize predefined event types"""
    created = []
    for name, data in PREDEFINED_EVENTS.items():
        existing = db.query(EventType).filter(EventType.name == name).first()
        if not existing:
            event_type = EventType(
                id=str(uuid.uuid4()),
                name=name,
                description=f"Predefined {name} event profile",
                min_bpm=data["min_bpm"],
                max_bpm=data["max_bpm"],
                energy_curve=json.dumps(data["energy_curve"]),
                genre_weighting=json.dumps(data["genre_weighting"]),
                vocal_frequency=data["vocal_frequency"],
                drop_intensity=data["drop_intensity"]
            )
            db.add(event_type)
            created.append(name)
    
    db.commit()
    return {"message": f"Initialized {len(created)} event types", "created": created}

@router.post("/", response_model=EventTypeResponse)
async def create_event_type(event: EventTypeCreate, db: Session = Depends(get_db)):
    """Create a new event type"""
    db_event = EventType(
        id=str(uuid.uuid4()),
        **event.dict()
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@router.get("/", response_model=List[EventTypeResponse])
async def get_event_types(db: Session = Depends(get_db)):
    """Get all event types"""
    events = db.query(EventType).all()
    return events

@router.get("/{event_id}", response_model=EventTypeResponse)
async def get_event_type(event_id: str, db: Session = Depends(get_db)):
    """Get a specific event type"""
    event = db.query(EventType).filter(EventType.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event type not found")
    return event






