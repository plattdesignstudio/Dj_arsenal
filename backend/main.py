from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.database import engine, Base
from app.routers import (
    tracks, sets, events, analysis, ai_voice, flow_engine, 
    harmonic_mixing, ai_recommendations, trending,
    dj_intelligence, ai_embeddings, ai_visuals, personas,
    spotify_auth, playlists, local_playlists
)

# Optional router for file uploads (requires python-multipart)
try:
    from app.routers import ai_transcription
    TRANSCRIPTION_AVAILABLE = True
except (ImportError, RuntimeError):
    TRANSCRIPTION_AVAILABLE = False
    ai_transcription = None

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown

app = FastAPI(
    title="DJ Arsenal API",
    description="AI-Augmented DJ Dashboard & Generative Artist Studio",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "https://localhost:3000",
        "https://localhost:3001",
        "https://localhost:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tracks.router, prefix="/api/tracks", tags=["tracks"])
app.include_router(sets.router, prefix="/api/sets", tags=["sets"])
app.include_router(events.router, prefix="/api/events", tags=["events"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])
app.include_router(ai_voice.router, prefix="/api/ai-voice", tags=["ai-voice"])
app.include_router(flow_engine.router, prefix="/api/flow", tags=["flow"])
app.include_router(harmonic_mixing.router, prefix="/api/harmonic", tags=["harmonic"])
app.include_router(ai_recommendations.router, prefix="/api/ai", tags=["ai"])
app.include_router(trending.router, prefix="/api/trending", tags=["trending"])
app.include_router(dj_intelligence.router, prefix="/api/ai/dj-intel", tags=["dj-intelligence"])
if TRANSCRIPTION_AVAILABLE:
    app.include_router(ai_transcription.router, prefix="/api/ai/transcribe", tags=["transcription"])
app.include_router(ai_embeddings.router, prefix="/api/ai/embeddings", tags=["embeddings"])
app.include_router(ai_visuals.router, prefix="/api/ai/visuals", tags=["visuals"])
app.include_router(personas.router, prefix="/api/personas", tags=["personas"])
app.include_router(spotify_auth.router, prefix="/api", tags=["spotify-auth"])
app.include_router(playlists.router, prefix="/api/spotify", tags=["spotify-playlists"])
app.include_router(local_playlists.router, prefix="/api/playlists", tags=["local-playlists"])

@app.get("/")
async def root():
    return {"message": "DJ Arsenal API", "status": "operational"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


