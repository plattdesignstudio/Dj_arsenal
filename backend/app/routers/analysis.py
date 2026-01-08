from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Track

# Optional import for audio analysis
try:
    from app.services.audio_analysis import AudioAnalyzer
    AUDIO_ANALYSIS_AVAILABLE = True
except ImportError:
    AUDIO_ANALYSIS_AVAILABLE = False
    AudioAnalyzer = None

router = APIRouter()

@router.post("/bpm")
async def analyze_bpm(track_id: str, db: Session = Depends(get_db)):
    """Analyze BPM for a track"""
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
    
    result = AudioAnalyzer.analyze_bpm(track.file_path)
    
    # Update track
    if result.get("bpm"):
        track.bpm = result["bpm"]
        db.commit()
    
    return result

@router.post("/key")
async def analyze_key(track_id: str, db: Session = Depends(get_db)):
    """Analyze key for a track"""
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
    
    result = AudioAnalyzer.analyze_key(track.file_path)
    
    # Update track
    if result.get("key"):
        track.key = result["key"]
        db.commit()
    
    return result

@router.post("/energy")
async def analyze_energy(track_id: str, db: Session = Depends(get_db)):
    """Analyze energy for a track"""
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
    
    result = AudioAnalyzer.analyze_energy(track.file_path)
    
    # Update track
    if result.get("energy"):
        track.energy = result["energy"]
        db.commit()
    
    return result

@router.post("/full")
async def full_analysis(track_id: str, db: Session = Depends(get_db)):
    """Perform full analysis (BPM, key, energy)"""
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
    
    result = AudioAnalyzer.full_analysis(track.file_path)
    
    # Update track
    if result.get("bpm"):
        track.bpm = result["bpm"]
    if result.get("key"):
        track.key = result["key"]
    if result.get("energy"):
        track.energy = result["energy"]
    
    db.commit()
    
    return result


