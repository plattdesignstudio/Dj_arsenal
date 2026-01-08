"""
DJ Persona Router - Persona management and templates
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.database import get_db
from app.models import DJPersona
from app.services.openai_service import OpenAIService
from app.schemas import DJPersonaResponse

router = APIRouter()
openai_service = OpenAIService()


@router.get("/", response_model=List[DJPersonaResponse])
async def list_personas(
    db: Session = Depends(get_db)
):
    """List all available DJ personas (built-in + custom)"""
    try:
        # Get built-in personas from service
        built_in = openai_service.list_personas()
        
        # Get custom personas from database
        custom_personas = db.query(DJPersona).all()
        
        # Combine and format
        result = []
        
        # Add built-in personas
        for persona in built_in:
            result.append(DJPersonaResponse(
                id=persona["id"],
                name=persona["name"],
                description=persona["description"],
                voice_settings=persona["voice_settings"]
            ))
        
        # Add custom personas
        for persona in custom_personas:
            result.append(DJPersonaResponse(
                id=persona.id,
                name=persona.name,
                description=persona.description,
                voice_settings=persona.voice_settings or {}
            ))
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{persona_id}", response_model=DJPersonaResponse)
async def get_persona(
    persona_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific persona by ID"""
    try:
        # Check built-in personas first
        built_in = openai_service.get_persona(persona_id)
        if built_in:
            return DJPersonaResponse(
                id=persona_id,
                name=built_in["name"],
                description=built_in["system_prompt"][:200] + "...",
                voice_settings=built_in.get("voice_settings", {})
            )
        
        # Check database
        persona = db.query(DJPersona).filter(DJPersona.id == persona_id).first()
        if not persona:
            raise HTTPException(status_code=404, detail="Persona not found")
        
        return DJPersonaResponse(
            id=persona.id,
            name=persona.name,
            description=persona.description,
            voice_settings=persona.voice_settings or {}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))





