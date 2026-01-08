"""
AI Embeddings Router - Text-to-Embeddings OpenAI Integration
Semantic intelligence for tracks, sets, and recommendations
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.database import get_db
from app.models import Track, Set
from app.services.openai_service import OpenAIService
from app.schemas import (
    EmbeddingRequest,
    EmbeddingResponse,
    TrackEmbeddingRequest,
    SetEmbeddingRequest
)

router = APIRouter()
openai_service = OpenAIService()


@router.post("/generate", response_model=EmbeddingResponse)
async def generate_embeddings(
    request: EmbeddingRequest,
    db: Session = Depends(get_db)
):
    """
    Generate embeddings for a list of texts
    """
    try:
        result = openai_service.generate_embeddings(
            texts=request.texts,
            model=request.model
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Embedding generation failed")
            )
        
        return EmbeddingResponse(
            embeddings=result["embeddings"],
            model=result.get("model", "text-embedding-3-small"),
            usage=result.get("usage", {})
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/track/{track_id}")
async def embed_track(
    track_id: str,
    db: Session = Depends(get_db)
):
    """
    Generate embedding for a specific track
    """
    try:
        track = db.query(Track).filter(Track.id == track_id).first()
        if not track:
            raise HTTPException(status_code=404, detail="Track not found")
        
        result = openai_service.embed_track(
            title=track.title,
            artist=track.artist,
            genre=track.genre,
            mood=track.mood,
            energy=track.energy,
            bpm=track.bpm
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Track embedding failed")
            )
        
        # In production, store embedding in database with pgvector
        # For now, return it
        return {
            "track_id": track_id,
            "embedding": result["embedding"],
            "text": result["text"],
            "model": "text-embedding-3-small"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/set/{set_id}")
async def embed_set(
    set_id: str,
    db: Session = Depends(get_db)
):
    """
    Generate embedding for a specific set
    """
    try:
        set_obj = db.query(Set).filter(Set.id == set_id).first()
        if not set_obj:
            raise HTTPException(status_code=404, detail="Set not found")
        
        # Build tracks summary
        tracks_summary = None
        if set_obj.set_tracks:
            track_names = [
                f"{st.track.artist} - {st.track.title}"
                for st in set_obj.set_tracks[:10]
            ]
            tracks_summary = ", ".join(track_names)
        
        result = openai_service.embed_set(
            name=set_obj.name,
            description=set_obj.description,
            event_type=set_obj.event_type.name if set_obj.event_type else None,
            tracks_summary=tracks_summary
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Set embedding failed")
            )
        
        return {
            "set_id": set_id,
            "embedding": result["embedding"],
            "text": result["text"],
            "model": "text-embedding-3-small"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/similar")
async def find_similar(
    embedding: List[float],
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Find similar tracks/sets using embedding similarity
    Note: Requires pgvector extension in production
    """
    # Placeholder - in production, use pgvector for similarity search
    return {
        "message": "Similarity search requires pgvector. Use cosine similarity in application layer.",
        "embedding_dimension": len(embedding)
    }





