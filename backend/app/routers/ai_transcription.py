"""
AI Transcription Router - Audio-to-Text OpenAI Integration
Live DJ transcription and tagging
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from sqlalchemy.orm import Session
from typing import Optional
import uuid
import os
from pathlib import Path

from app.database import get_db
from app.models import AIVoiceAsset
from app.services.openai_service import OpenAIService
from app.schemas import TranscriptionRequest, TranscriptionResponse

router = APIRouter()
openai_service = OpenAIService()

# Temporary upload directory
UPLOAD_DIR = Path("uploads/audio")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    language: Optional[str] = None,
    prompt: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Transcribe audio file (mic input, crowd chants, live MC)
    
    Supports: mp3, mp4, mpeg, mpga, m4a, wav, webm
    """
    try:
        # Save uploaded file temporarily
        file_ext = Path(file.filename).suffix or ".mp3"
        temp_path = UPLOAD_DIR / f"{uuid.uuid4()}{file_ext}"
        
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Transcribe
        result = openai_service.transcribe_audio(
            audio_file_path=str(temp_path),
            language=language,
            prompt=prompt or "DJ hype phrases, crowd chants, live MC moments"
        )
        
        # Clean up temp file
        try:
            os.remove(temp_path)
        except:
            pass
        
        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Transcription failed")
            )
        
        # Optionally save transcript as voice asset for reuse
        if result.get("text"):
            voice_asset = AIVoiceAsset(
                id=str(uuid.uuid4()),
                text=result["text"],
                audio_url="",  # Original audio not stored
                voice_type="transcript",
                bpm=None,
                key=None,
                autotune=False
            )
            db.add(voice_asset)
            db.commit()
        
        return TranscriptionResponse(
            text=result["text"],
            language=result.get("language", "unknown"),
            duration=result.get("duration", 0.0),
            segments=result.get("segments", []),
            confidence=0.95  # Whisper doesn't provide confidence, estimate
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/transcribe-bytes")
async def transcribe_audio_bytes(
    request: TranscriptionRequest,
    db: Session = Depends(get_db)
):
    """
    Transcribe audio from base64-encoded bytes
    """
    try:
        import base64
        
        # Decode base64 audio
        audio_bytes = base64.b64decode(request.audio_base64)
        
        # Transcribe
        result = openai_service.transcribe_audio_bytes(
            audio_bytes=audio_bytes,
            filename=request.filename or "audio.mp3",
            language=request.language,
            prompt=request.prompt
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Transcription failed")
            )
        
        return TranscriptionResponse(
            text=result["text"],
            language=result.get("language", "unknown"),
            duration=result.get("duration", 0.0),
            segments=result.get("segments", []),
            confidence=0.95
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))





