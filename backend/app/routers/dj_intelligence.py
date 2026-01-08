"""
DJ Intelligence Router - Text-to-Text OpenAI Integration
Real-time DJ reasoning and decision making
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
import json

from app.database import get_db
from app.models import DJPersona
from app.services.openai_service import OpenAIService
from app.schemas import DJIntelligenceRequest, DJIntelligenceResponse

router = APIRouter()
openai_service = OpenAIService()


@router.post("/query", response_model=DJIntelligenceResponse)
async def dj_intelligence_query(
    request: DJIntelligenceRequest,
    db: Session = Depends(get_db)
):
    """
    Get DJ intelligence response (non-streaming)
    
    Example queries:
    - "Suggest the next track for a 124 BPM peak-hour club set"
    - "Energy is dropping — how do I recover in 2 tracks?"
    - "I'm at sunset hour, what's the correct BPM ramp?"
    """
    try:
        # Get persona if specified - check built-in personas first, then database
        persona = None
        persona_id = request.persona_id
        if persona_id:
            # Check if it's a built-in persona (defined in OpenAI service)
            from app.services.openai_service import DJ_PERSONA_TEMPLATES
            if persona_id in DJ_PERSONA_TEMPLATES:
                # Built-in persona, allow it
                persona_id = persona_id
            else:
                # Check database for custom persona
                persona = db.query(DJPersona).filter(DJPersona.id == persona_id).first()
                if not persona:
                    # Persona not found in built-in or database, but don't fail - just use None
                    persona_id = None
        
        # Build context
        context = {}
        if request.current_bpm:
            context["current_bpm"] = request.current_bpm
        if request.current_key:
            context["current_key"] = request.current_key
        if request.current_energy is not None:
            context["current_energy"] = request.current_energy
        if request.event_type:
            context["event_type"] = request.event_type
        if request.time_of_night:
            context["time_of_night"] = request.time_of_night
        if request.crowd_vibe:
            context["crowd_vibe"] = request.crowd_vibe
        if request.recent_tracks:
            context["recent_tracks"] = request.recent_tracks
        
        # Use the validated persona_id (built-in or from database)
        # Call OpenAI service
        result = openai_service.dj_intelligence(
            query=request.query,
            context=context if context else None,
            persona_id=persona_id,  # This will be None if persona not found, which is fine
            stream=False
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "DJ intelligence unavailable")
            )
        
        return DJIntelligenceResponse(
            response=result["response"],
            model=result.get("model", "gpt-4o-mini"),
            usage=result.get("usage", {})
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query/stream")
async def dj_intelligence_query_stream(
    request: DJIntelligenceRequest,
    db: Session = Depends(get_db)
):
    """
    Get streaming DJ intelligence response for live UI feedback
    """
    try:
        # Get persona if specified - check built-in personas first, then database
        persona_id = request.persona_id
        if persona_id:
            # Check if it's a built-in persona (defined in OpenAI service)
            from app.services.openai_service import DJ_PERSONA_TEMPLATES
            if persona_id not in DJ_PERSONA_TEMPLATES:
                # Check database for custom persona
                persona = db.query(DJPersona).filter(DJPersona.id == persona_id).first()
                if not persona:
                    # Persona not found, but don't fail - just use None
                    persona_id = None
        
        # Build context
        context = {}
        if request.current_bpm:
            context["current_bpm"] = request.current_bpm
        if request.current_key:
            context["current_key"] = request.current_key
        if request.current_energy is not None:
            context["current_energy"] = request.current_energy
        if request.event_type:
            context["event_type"] = request.event_type
        if request.time_of_night:
            context["time_of_night"] = request.time_of_night
        if request.crowd_vibe:
            context["crowd_vibe"] = request.crowd_vibe
        
        # Get streaming generator
        stream = openai_service.dj_intelligence(
            query=request.query,
            context=context if context else None,
            persona_id=request.persona_id,
            stream=True
        )
        
        def generate():
            for chunk in stream:
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            yield "data: [DONE]\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/suggest-next-track")
async def suggest_next_track(
    current_track_id: str,
    target_energy: Optional[float] = None,
    target_bpm: Optional[float] = None,
    event_type: Optional[str] = None,
    persona_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Quick endpoint for next track suggestion"""
    query = f"Suggest the next track"
    if target_bpm:
        query += f" at {target_bpm} BPM"
    if target_energy:
        query += f" with energy level {target_energy:.2f}"
    if event_type:
        query += f" for a {event_type} event"
    
    request = DJIntelligenceRequest(
        query=query,
        current_bpm=target_bpm,
        current_energy=target_energy,
        event_type=event_type,
        persona_id=persona_id
    )
    
    return await dj_intelligence_query(request, db)


@router.post("/recover-energy")
async def recover_energy(
    current_energy: float,
    target_energy: float,
    tracks_available: int = 2,
    persona_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get energy recovery strategy"""
    query = f"Energy is at {current_energy:.2f}, need to reach {target_energy:.2f} in {tracks_available} tracks. How do I recover?"
    
    request = DJIntelligenceRequest(
        query=query,
        current_energy=current_energy,
        persona_id=persona_id
    )
    
    return await dj_intelligence_query(request, db)


@router.post("/bpm-ramp")
async def suggest_bpm_ramp(
    current_bpm: float,
    target_bpm: float,
    time_available: Optional[int] = None,  # minutes
    event_type: Optional[str] = None,
    persona_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get BPM ramp strategy"""
    query = f"Current BPM: {current_bpm}, target: {target_bpm}"
    if time_available:
        query += f" in {time_available} minutes"
    if event_type:
        query += f" for {event_type}"
    query += ". What's the correct BPM ramp strategy?"
    
    request = DJIntelligenceRequest(
        query=query,
        current_bpm=current_bpm,
        event_type=event_type,
        persona_id=persona_id
    )
    
    return await dj_intelligence_query(request, db)





