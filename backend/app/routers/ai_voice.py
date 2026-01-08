from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import uuid
import base64
import os
from pathlib import Path

from app.database import get_db
from app.models import AIVoiceAsset, DJPersona
from app.schemas import AIVoiceRequest, AIVoiceResponse, EnhancedAIVoiceRequest, EnhancedAIVoiceResponse
from app.services.ai_voice import AIVoiceGenerator
from app.services.openai_service import OpenAIService

router = APIRouter()
openai_service = OpenAIService()

# Audio storage directory
AUDIO_DIR = Path("audio")
AUDIO_DIR.mkdir(exist_ok=True)

@router.post("/generate", response_model=AIVoiceResponse)
async def generate_voice(request: AIVoiceRequest, db: Session = Depends(get_db)):
    """Generate AI voice audio"""
    generator = AIVoiceGenerator()
    
    # Get persona if specified
    persona = None
    if request.persona_id:
        persona = db.query(DJPersona).filter(DJPersona.id == request.persona_id).first()
        if not persona:
            raise HTTPException(status_code=404, detail="Persona not found")
    
    # Generate voice
    persona_settings = persona.voice_settings if persona else None
    result = generator.generate_voice(
        text=request.text,
        persona_settings=persona_settings
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Voice generation failed"))
    
    # In production, save audio to storage (S3, etc.) and get URL
    # For now, we'll encode as base64 or save locally
    audio_data = result["audio_data"]
    audio_url = f"/audio/{uuid.uuid4()}.mp3"  # Placeholder
    
    # Save to database
    voice_asset = AIVoiceAsset(
        id=str(uuid.uuid4()),
        persona_id=request.persona_id,
        text=request.text,
        audio_url=audio_url,
        voice_type=request.voice_type,
        bpm=request.bpm,
        key=request.key,
        autotune=request.autotune
    )
    db.add(voice_asset)
    db.commit()
    db.refresh(voice_asset)
    
    return AIVoiceResponse(
        id=voice_asset.id,
        text=voice_asset.text,
        audio_url=voice_asset.audio_url,
        voice_type=voice_asset.voice_type,
        bpm=voice_asset.bpm,
        key=voice_asset.key
    )

@router.post("/hype-phrase")
async def generate_hype_phrase(event_type: str = "club", energy_level: str = "high"):
    """Generate context-aware hype phrase"""
    generator = AIVoiceGenerator()
    phrase = generator.generate_hype_phrase(event_type, energy_level)
    return {"phrase": phrase}

@router.post("/drop-intro")
async def generate_drop_intro(bpm: float = None, key: str = None):
    """Generate drop intro phrase"""
    generator = AIVoiceGenerator()
    intro = generator.generate_drop_intro(bpm, key)
    return {"intro": intro}

@router.post("/dj-tag")
async def generate_dj_tag(dj_name: str):
    """Generate DJ tag"""
    generator = AIVoiceGenerator()
    tag = generator.generate_dj_tag(dj_name)
    return {"tag": tag}

@router.post("/generate-enhanced", response_model=EnhancedAIVoiceResponse)
async def generate_enhanced_voice(
    request: EnhancedAIVoiceRequest,
    db: Session = Depends(get_db)
):
    """
    Enhanced voice generation with beat-aware metadata and persona support
    """
    try:
        # Get persona if specified (skip if None or empty string)
        persona = None
        persona_settings = None
        if request.persona_id and request.persona_id.strip():
            # First check built-in personas
            built_in_persona = openai_service.get_persona(request.persona_id)
            if built_in_persona:
                persona_settings = built_in_persona.get("voice_settings", {})
            else:
                # Check database for custom personas
                persona = db.query(DJPersona).filter(DJPersona.id == request.persona_id).first()
                if persona:
                    persona_settings = persona.voice_settings or {}
                else:
                    raise HTTPException(status_code=404, detail=f"Persona '{request.persona_id}' not found. Available personas: {', '.join([p['id'] for p in openai_service.list_personas()])}")
        
        # Generate voice using OpenAI service
        # Default voice to "alloy" if not provided, but override with persona settings if available
        voice = request.voice or "alloy"
        speed = request.speed or 1.0
        
        # Override with persona settings if available
        if persona_settings:
            voice = persona_settings.get("voice", voice)
            speed = persona_settings.get("speed", speed)
        
        result = openai_service.generate_dj_voice(
            text=request.text,
            voice=voice,
            speed=speed,
            persona_id=request.persona_id,
            tempo=request.tempo,
            key=request.key,
            style=request.style
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Voice generation failed")
            )
        
        # Save audio to storage
        audio_data = result["audio_data"]
        audio_id = str(uuid.uuid4())
        audio_filename = f"{audio_id}.mp3"
        audio_path = AUDIO_DIR / audio_filename
        
        # Save audio file to disk
        with open(audio_path, "wb") as f:
            f.write(audio_data)
        
        # Create URL that points to our audio serving endpoint
        audio_url = f"http://localhost:8000/api/ai-voice/audio/{audio_filename}"
        
        # Save to database
        voice_asset = AIVoiceAsset(
            id=audio_id,
            persona_id=request.persona_id,
            text=request.text,
            audio_url=audio_url,
            voice_type="enhanced",
            bpm=request.tempo,
            key=request.key,
            autotune=False
        )
        db.add(voice_asset)
        db.commit()
        db.refresh(voice_asset)
        
        return EnhancedAIVoiceResponse(
            id=voice_asset.id,
            text=request.text,
            audio_url=audio_url,
            duration=result.get("duration", 0.0),
            beat_markers=result.get("beat_markers", []),
            voice=result.get("voice", voice),
            speed=result.get("speed", request.speed or 1.0),
            tempo=result.get("tempo"),
            key=result.get("key"),
            style=result.get("style"),
            suggested_drop_timing=result.get("suggested_drop_timing")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/audio/{filename}")
async def get_audio_file(filename: str):
    """Serve audio files (CORS handled by middleware)"""
    audio_path = AUDIO_DIR / filename
    if not audio_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(
        audio_path,
        media_type="audio/mpeg",
        filename=filename
    )


