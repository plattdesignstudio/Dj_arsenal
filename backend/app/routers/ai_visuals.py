"""
AI Visuals Router - Image-to-Text and Text-to-Image OpenAI Integration
DJ branding, visual context analysis, and artist mode
"""

from fastapi import APIRouter, HTTPException
from typing import Optional

from app.services.openai_service import OpenAIService
from app.schemas import (
    VisualAnalysisRequest,
    VisualAnalysisResponse,
    VisualGenerationRequest,
    VisualGenerationResponse
)

router = APIRouter()
openai_service = OpenAIService()


@router.post("/analyze-crowd", response_model=VisualAnalysisResponse)
async def analyze_crowd_image(
    request: VisualAnalysisRequest
):
    """
    Analyze crowd/venue images for energy estimation and mood detection
    """
    try:
        result = openai_service.analyze_crowd_image(
            image_url=request.image_url,
            context=request.context
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Visual analysis failed")
            )
        
        return VisualAnalysisResponse(
            energy_estimate=result.get("energy_estimate", 0.5),
            mood_tags=result.get("mood_tags", []),
            crowd_size=result.get("crowd_size", "medium"),
            lighting=result.get("lighting", "unknown"),
            vibe=result.get("vibe", "unknown"),
            raw_response=result.get("raw_response", "")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate", response_model=VisualGenerationResponse)
async def generate_dj_visual(
    request: VisualGenerationRequest
):
    """
    Generate DJ visuals (logos, posters, flyers, branding)
    
    Styles: club, festival, underground, corporate
    """
    try:
        result = openai_service.generate_dj_visual(
            prompt=request.prompt,
            style=request.style or "club",
            size=request.size or "1024x1024",
            quality=request.quality or "standard"
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Visual generation failed")
            )
        
        return VisualGenerationResponse(
            image_url=result["image_url"],
            revised_prompt=result.get("revised_prompt", request.prompt),
            style=result.get("style", request.style or "club"),
            size=result.get("size", request.size or "1024x1024")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-logo")
async def generate_dj_logo(
    dj_name: str,
    style: str = "club",
    description: Optional[str] = None
):
    """Quick endpoint for DJ logo generation"""
    prompt = f"DJ logo for {dj_name}"
    if description:
        prompt += f", {description}"
    prompt += ", professional, modern, eye-catching"
    
    request = VisualGenerationRequest(
        prompt=prompt,
        style=style,
        size="1024x1024",
        quality="hd"
    )
    
    return await generate_dj_visual(request)


@router.post("/generate-poster")
async def generate_event_poster(
    event_name: str,
    date: Optional[str] = None,
    venue: Optional[str] = None,
    style: str = "festival"
):
    """Quick endpoint for event poster generation"""
    prompt = f"Event poster for {event_name}"
    if date:
        prompt += f" on {date}"
    if venue:
        prompt += f" at {venue}"
    prompt += ", professional design, DJ event"
    
    request = VisualGenerationRequest(
        prompt=prompt,
        style=style,
        size="1792x1024",  # Wide format for posters
        quality="hd"
    )
    
    return await generate_dj_visual(request)





