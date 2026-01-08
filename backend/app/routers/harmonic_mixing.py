from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Track
from app.schemas import HarmonicCompatibilityRequest, HarmonicCompatibilityResponse
from app.services.harmonic_mixing import HarmonicMixingEngine

router = APIRouter()

@router.get("/compatible-keys/{camelot_key}")
async def get_compatible_keys(camelot_key: str):
    """Get compatible keys for a Camelot key"""
    return HarmonicMixingEngine.get_compatible_keys(camelot_key)

@router.get("/transition-type")
async def get_transition_type(from_key: str, to_key: str):
    """Get transition type between two keys"""
    return {
        "transition_type": HarmonicMixingEngine.get_transition_type(from_key, to_key),
        "compatibility_score": HarmonicMixingEngine.calculate_compatibility_score(from_key, to_key)
    }

@router.get("/compatibility-score")
async def get_compatibility_score(from_key: str, to_key: str):
    """Calculate compatibility score between two keys"""
    return {
        "score": HarmonicMixingEngine.calculate_compatibility_score(from_key, to_key),
        "transition_type": HarmonicMixingEngine.get_transition_type(from_key, to_key)
    }

@router.get("/modal-interchange/{camelot_key}")
async def get_modal_interchange(camelot_key: str):
    """Get modal interchange suggestions"""
    return {
        "suggestions": HarmonicMixingEngine.get_modal_interchange_suggestions(camelot_key)
    }

@router.post("/compatible-tracks", response_model=HarmonicCompatibilityResponse)
async def get_compatible_tracks(
    request: HarmonicCompatibilityRequest,
    db: Session = Depends(get_db)
):
    """Get harmonically compatible tracks"""
    track = db.query(Track).filter(Track.id == request.track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    
    if not track.key:
        raise HTTPException(status_code=400, detail="Track key not available")
    
    compat = HarmonicMixingEngine.get_compatible_keys(track.key)
    
    # Get tracks with compatible keys
    compatible_tracks = []
    for key_list in [compat["perfect"], compat["safe"], compat["risky"]]:
        for key in key_list:
            tracks = db.query(Track).filter(Track.key == key).all()
            compatible_tracks.extend(tracks)
    
    return HarmonicCompatibilityResponse(
        compatible_keys=compat["perfect"] + compat["safe"],
        safe_transitions=compat["safe"],
        modal_interchange=HarmonicMixingEngine.get_modal_interchange_suggestions(track.key)
    )






