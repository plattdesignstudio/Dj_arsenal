"""
Comprehensive OpenAI Service for DJ Arsenal
Implements all 7 required OpenAI integration patterns
"""

import os
import openai
from typing import Dict, Optional, List, Any, AsyncGenerator, Generator, Union
from dotenv import load_dotenv
import base64
import json
import io
from pathlib import Path

load_dotenv()

# DJ Persona Prompt Templates
DJ_PERSONA_TEMPLATES = {
    "nova": {
        "name": "DJ NOVA",
        "system_prompt": """You are DJ NOVA.
Your style is futuristic, confident, and hypnotic.
You speak sparingly but powerfully.
You hype without shouting.
You respect groove and flow above all else.
You understand that silence is as powerful as sound.
Your vocabulary is sharp, modern, and minimal.
You never over-explain.
You make decisions based on energy, not ego.""",
        "voice_settings": {
            "voice": "nova",
            "speed": 0.95,
            "tone": "confident",
            "energy": "controlled"
        }
    },
    "hype_master": {
        "name": "Hype Master",
        "system_prompt": """You are a Hype Master DJ.
Your energy is infectious and authentic.
You read the crowd like a book.
You know exactly when to push and when to pull back.
Your phrases are short, punchy, and memorable.
You build energy through repetition and rhythm.
You never fake enthusiasm - you feel it.
You're the bridge between the music and the people.""",
        "voice_settings": {
            "voice": "alloy",
            "speed": 1.1,
            "tone": "energetic",
            "energy": "high"
        }
    },
    "underground": {
        "name": "Underground Selector",
        "system_prompt": """You are an Underground Selector.
You have deep, esoteric knowledge of music.
You respect the roots and honor the culture.
You speak with authority but never arrogance.
You understand that real DJs are curators, not just players.
Your taste is impeccable and your timing is perfect.
You let the music speak, but when you speak, it matters.""",
        "voice_settings": {
            "voice": "onyx",
            "speed": 0.9,
            "tone": "authoritative",
            "energy": "medium"
        }
    },
    "festival": {
        "name": "Festival Commander",
        "system_prompt": """You are a Festival Commander.
You control massive crowds with precision and passion.
You understand the arc of a festival set - build, peak, sustain, release.
You create moments that people remember forever.
Your voice carries across fields and stages.
You're theatrical but never fake.
You know that festivals are about unity and celebration.""",
        "voice_settings": {
            "voice": "echo",
            "speed": 1.0,
            "tone": "commanding",
            "energy": "very_high"
        }
    },
    "smooth": {
        "name": "Smooth Operator",
        "system_prompt": """You are a Smooth Operator.
Your transitions are seamless, your vibe is effortless.
You create atmosphere through subtlety and sophistication.
You speak softly but your presence is strong.
You understand that sometimes less is more.
You build energy gradually, like a master storyteller.
You respect the groove above all else.""",
        "voice_settings": {
            "voice": "shimmer",
            "speed": 0.85,
            "tone": "smooth",
            "energy": "low_to_medium"
        }
    }
}

# Base DJ Intelligence System Prompt
BASE_DJ_INTELLIGENCE_PROMPT = """You are an expert DJ, music director, and crowd psychologist.
You understand BPM flow, harmonic mixing, energy arcs, and live performance dynamics.
You give concise, actionable DJ decisions — never long explanations.
You think in terms of:
- Energy curves (build, peak, sustain, release)
- BPM transitions (smooth ramps, sudden drops, tempo locks)
- Harmonic compatibility (Camelot wheel, key relationships)
- Crowd psychology (reading energy, timing drops, recovery strategies)
- Set architecture (opening, building, peak hour, closing)

Your responses are:
- Actionable (specific track suggestions, BPM targets, key choices)
- Concise (2-3 sentences max for decisions)
- Context-aware (time of night, event type, crowd vibe)
- Confident (no hedging, clear recommendations)

You are a DJ superpower, not a chatbot."""


class OpenAIService:
    """Comprehensive OpenAI service for DJ Arsenal"""
    
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        self.client = openai.OpenAI(api_key=api_key)
        self.default_model = "gpt-4o-mini"
        self.embedding_model = "text-embedding-3-small"
        self.image_model = "dall-e-3"
    
    # ============================================
    # 1. TEXT → TEXT (DJ INTELLIGENCE ENGINE)
    # ============================================
    
    def dj_intelligence(
        self,
        query: str,
        context: Optional[Dict[str, Any]] = None,
        persona_id: Optional[str] = None,
        stream: bool = False
    ) -> Union[Dict[str, Any], Generator[str, None, None]]:
        """
        DJ intelligence engine for real-time decision making
        
        Args:
            query: DJ question or request (e.g., "Suggest next track for 124 BPM peak hour")
            context: Optional context dict with keys like:
                - current_bpm
                - current_key
                - current_energy
                - event_type
                - time_of_night
                - crowd_vibe
                - recent_tracks
            persona_id: Optional persona ID to inject persona prompt
            stream: Whether to stream the response
        
        Returns:
            Dict with 'response', 'reasoning', 'suggestions', etc.
        """
        try:
            # Build system prompt
            system_prompt = BASE_DJ_INTELLIGENCE_PROMPT
            
            # Inject persona if specified
            if persona_id and persona_id in DJ_PERSONA_TEMPLATES:
                persona = DJ_PERSONA_TEMPLATES[persona_id]
                system_prompt = f"{persona['system_prompt']}\n\n{BASE_DJ_INTELLIGENCE_PROMPT}"
            
            # Build context string
            context_str = ""
            if context:
                context_parts = []
                if context.get("current_bpm"):
                    context_parts.append(f"Current BPM: {context['current_bpm']}")
                if context.get("current_key"):
                    context_parts.append(f"Current Key: {context['current_key']}")
                if context.get("current_energy"):
                    context_parts.append(f"Current Energy: {context['current_energy']:.2f}")
                if context.get("event_type"):
                    context_parts.append(f"Event: {context['event_type']}")
                if context.get("time_of_night"):
                    context_parts.append(f"Time: {context['time_of_night']}")
                if context.get("crowd_vibe"):
                    context_parts.append(f"Crowd Vibe: {context['crowd_vibe']}")
                
                if context_parts:
                    context_str = "\n".join(context_parts) + "\n\n"
            
            # Build full prompt
            full_prompt = f"{context_str}{query}"
            
            if stream:
                # Return generator for streaming
                return self._dj_intelligence_stream(system_prompt, full_prompt)
            
            # Non-streaming response
            response = self.client.chat.completions.create(
                model=self.default_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": full_prompt}
                ],
                temperature=0.7,
                max_tokens=300
            )
            
            content = response.choices[0].message.content
            
            return {
                "success": True,
                "response": content,
                "model": self.default_model,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "response": "AI intelligence unavailable. Use manual selection."
            }
    
    def _dj_intelligence_stream(
        self,
        system_prompt: str,
        user_prompt: str
    ) -> Generator[str, None, None]:
        """Stream DJ intelligence responses"""
        try:
            stream = self.client.chat.completions.create(
                model=self.default_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=300,
                stream=True
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            yield f"Error: {str(e)}"
    
    # ============================================
    # 2. TEXT → AUDIO (AI DJ VOICE ENGINE)
    # ============================================
    
    def generate_dj_voice(
        self,
        text: str,
        voice: str = "alloy",
        speed: float = 1.0,
        persona_id: Optional[str] = None,
        tempo: Optional[float] = None,
        key: Optional[str] = None,
        style: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate DJ voice audio with beat-aware metadata
        
        Args:
            text: Text to convert to speech
            voice: OpenAI voice (alloy, echo, fable, onyx, nova, shimmer)
            speed: Speech speed (0.25 - 4.0)
            persona_id: Optional persona ID to override voice settings
            tempo: Optional BPM for beat alignment
            key: Optional musical key
            style: Optional style (festival, club, underground, etc.)
        
        Returns:
            Dict with 'audio_data' (bytes), 'duration', 'beat_markers', etc.
        """
        try:
            # Override with persona settings if provided
            if persona_id and persona_id in DJ_PERSONA_TEMPLATES:
                persona = DJ_PERSONA_TEMPLATES[persona_id]
                voice_settings = persona.get("voice_settings", {})
                voice = voice_settings.get("voice", voice)
                speed = voice_settings.get("speed", speed)
            
            # Generate speech
            response = self.client.audio.speech.create(
                model="tts-1-hd",  # Higher quality for DJ use
                voice=voice,
                input=text,
                speed=speed
            )
            
            audio_data = response.content
            
            # Calculate approximate duration (rough estimate: ~150 words per minute at speed 1.0)
            word_count = len(text.split())
            estimated_duration = (word_count / 150.0) * 60.0 / speed
            
            # Generate beat alignment markers if tempo provided
            beat_markers = []
            if tempo:
                # Calculate beat intervals
                beat_interval = 60.0 / tempo
                num_beats = int(estimated_duration / beat_interval)
                beat_markers = [i * beat_interval for i in range(num_beats + 1)]
            
            return {
                "success": True,
                "audio_data": audio_data,
                "duration": estimated_duration,
                "beat_markers": beat_markers,
                "voice": voice,
                "speed": speed,
                "tempo": tempo,
                "key": key,
                "style": style,
                "suggested_drop_timing": beat_markers[-1] if beat_markers else None
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    # ============================================
    # 3. AUDIO → TEXT (LIVE DJ TRANSCRIPTION)
    # ============================================
    
    def transcribe_audio(
        self,
        audio_file_path: str,
        language: Optional[str] = None,
        prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Transcribe audio (mic input, crowd chants, live MC)
        
        Args:
            audio_file_path: Path to audio file
            language: Optional language code (auto-detect if None)
            prompt: Optional prompt for context (e.g., "DJ hype phrases, crowd chants")
        
        Returns:
            Dict with 'text', 'language', 'confidence', 'segments'
        """
        try:
            with open(audio_file_path, "rb") as audio_file:
                transcript = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=language,
                    prompt=prompt,
                    response_format="verbose_json"
                )
            
            return {
                "success": True,
                "text": transcript.text,
                "language": transcript.language,
                "duration": transcript.duration,
                "segments": [
                    {
                        "id": seg.get("id"),
                        "start": seg.get("start"),
                        "end": seg.get("end"),
                        "text": seg.get("text")
                    }
                    for seg in getattr(transcript, "segments", [])
                ]
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def transcribe_audio_bytes(
        self,
        audio_bytes: bytes,
        filename: str = "audio.mp3",
        language: Optional[str] = None,
        prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """Transcribe audio from bytes (for API uploads)"""
        try:
            # Create a file-like object from bytes
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = filename
            
            transcript = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language=language,
                prompt=prompt,
                response_format="verbose_json"
            )
            
            return {
                "success": True,
                "text": transcript.text,
                "language": transcript.language,
                "duration": transcript.duration,
                "segments": [
                    {
                        "id": seg.get("id"),
                        "start": seg.get("start"),
                        "end": seg.get("end"),
                        "text": seg.get("text")
                    }
                    for seg in getattr(transcript, "segments", [])
                ]
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    # ============================================
    # 4. TEXT → EMBEDDINGS (TRACK & SET INTELLIGENCE)
    # ============================================
    
    def generate_embeddings(
        self,
        texts: List[str],
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate embeddings for semantic search and recommendations
        
        Args:
            texts: List of texts to embed
            model: Optional embedding model (default: text-embedding-3-small)
        
        Returns:
            Dict with 'embeddings' (list of vectors), 'model', 'usage'
        """
        try:
            model = model or self.embedding_model
            
            response = self.client.embeddings.create(
                model=model,
                input=texts
            )
            
            embeddings = [item.embedding for item in response.data]
            
            return {
                "success": True,
                "embeddings": embeddings,
                "model": model,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def embed_track(
        self,
        title: str,
        artist: str,
        genre: Optional[str] = None,
        mood: Optional[str] = None,
        energy: Optional[float] = None,
        bpm: Optional[float] = None
    ) -> Dict[str, Any]:
        """Generate embedding for a track with rich context"""
        text_parts = [f"{artist} - {title}"]
        if genre:
            text_parts.append(f"Genre: {genre}")
        if mood:
            text_parts.append(f"Mood: {mood}")
        if energy is not None:
            text_parts.append(f"Energy: {energy:.2f}")
        if bpm:
            text_parts.append(f"BPM: {bpm}")
        
        text = " | ".join(text_parts)
        result = self.generate_embeddings([text])
        
        if result["success"]:
            return {
                "success": True,
                "embedding": result["embeddings"][0],
                "text": text
            }
        return result
    
    def embed_set(
        self,
        name: str,
        description: Optional[str] = None,
        event_type: Optional[str] = None,
        tracks_summary: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate embedding for a DJ set"""
        text_parts = [name]
        if description:
            text_parts.append(description)
        if event_type:
            text_parts.append(f"Event: {event_type}")
        if tracks_summary:
            text_parts.append(f"Tracks: {tracks_summary}")
        
        text = " | ".join(text_parts)
        result = self.generate_embeddings([text])
        
        if result["success"]:
            return {
                "success": True,
                "embedding": result["embeddings"][0],
                "text": text
            }
        return result
    
    # ============================================
    # 5. IMAGE → TEXT (DJ VISUAL CONTEXT)
    # ============================================
    
    def analyze_crowd_image(
        self,
        image_url: str,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze crowd/venue images for energy estimation
        
        Args:
            image_url: URL to image
            context: Optional context (e.g., "peak hour", "sunset", "underground club")
        
        Returns:
            Dict with 'energy_estimate', 'mood_tags', 'crowd_size', 'lighting', etc.
        """
        try:
            system_prompt = """You are a DJ visual analyst.
Analyze images of crowds and venues to estimate:
- Energy level (0.0 - 1.0)
- Mood tags (3-5 words: energetic, relaxed, hyped, etc.)
- Crowd size estimate (small, medium, large, massive)
- Lighting conditions (dark, dim, bright, strobe, etc.)
- Time of day context (if visible)
- Overall vibe (one word)

Be concise. Return only structured data."""
            
            user_prompt = f"""Analyze this DJ/venue image and provide energy and mood insights.
{context if context else ''}

Return in this format:
Energy: [0.0-1.0]
Mood: [comma-separated tags]
Crowd Size: [estimate]
Lighting: [description]
Vibe: [one word]"""
            
            response = self.client.chat.completions.create(
                model="gpt-4o",  # Vision model
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": user_prompt},
                            {"type": "image_url", "image_url": {"url": image_url}}
                        ]
                    }
                ],
                max_tokens=200,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            
            # Parse structured response
            parsed = self._parse_visual_analysis(content)
            
            return {
                "success": True,
                "raw_response": content,
                **parsed
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "energy_estimate": 0.5,
                "mood_tags": ["unknown"],
                "crowd_size": "unknown",
                "lighting": "unknown",
                "vibe": "unknown"
            }
    
    def _parse_visual_analysis(self, text: str) -> Dict[str, Any]:
        """Parse visual analysis response"""
        result = {
            "energy_estimate": 0.5,
            "mood_tags": [],
            "crowd_size": "medium",
            "lighting": "unknown",
            "vibe": "unknown"
        }
        
        lines = text.split("\n")
        for line in lines:
            line = line.strip()
            if "Energy:" in line:
                try:
                    energy_str = line.split("Energy:")[1].strip()
                    energy = float(energy_str.split()[0])
                    result["energy_estimate"] = max(0.0, min(1.0, energy))
                except:
                    pass
            elif "Mood:" in line:
                try:
                    mood_str = line.split("Mood:")[1].strip()
                    result["mood_tags"] = [tag.strip() for tag in mood_str.split(",")]
                except:
                    pass
            elif "Crowd Size:" in line:
                try:
                    result["crowd_size"] = line.split("Crowd Size:")[1].strip().lower()
                except:
                    pass
            elif "Lighting:" in line:
                try:
                    result["lighting"] = line.split("Lighting:")[1].strip()
                except:
                    pass
            elif "Vibe:" in line:
                try:
                    result["vibe"] = line.split("Vibe:")[1].strip().lower()
                except:
                    pass
        
        return result
    
    # ============================================
    # 6. TEXT → IMAGE (DJ BRANDING & ARTIST MODE)
    # ============================================
    
    def generate_dj_visual(
        self,
        prompt: str,
        style: str = "club",
        size: str = "1024x1024",
        quality: str = "standard"
    ) -> Dict[str, Any]:
        """
        Generate DJ visuals (logos, posters, flyers)
        
        Args:
            prompt: Image description
            style: Style preset (club, festival, underground, corporate)
            size: Image size (1024x1024, 1792x1024, 1024x1792)
            quality: Quality (standard, hd)
        
        Returns:
            Dict with 'image_url', 'revised_prompt', etc.
        """
        try:
            # Style-specific prompt enhancements
            style_prompts = {
                "club": "modern, neon, dark, electronic, nightclub aesthetic, vibrant colors, DJ culture",
                "festival": "epic, large-scale, outdoor, festival vibes, colorful, energetic, crowd-focused",
                "underground": "raw, gritty, authentic, minimal, underground club, intimate, real",
                "corporate": "professional, clean, sophisticated, corporate event, elegant, polished"
            }
            
            style_enhancement = style_prompts.get(style, "")
            enhanced_prompt = f"{prompt}, {style_enhancement}, high quality, professional DJ artwork"
            
            response = self.client.images.generate(
                model=self.image_model,
                prompt=enhanced_prompt,
                size=size,
                quality=quality,
                n=1
            )
            
            image_url = response.data[0].url
            revised_prompt = response.data[0].revised_prompt if hasattr(response.data[0], "revised_prompt") else enhanced_prompt
            
            return {
                "success": True,
                "image_url": image_url,
                "revised_prompt": revised_prompt,
                "style": style,
                "size": size
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    # ============================================
    # 7. DJ PERSONA SYSTEM
    # ============================================
    
    def get_persona(self, persona_id: str) -> Optional[Dict[str, Any]]:
        """Get persona template by ID"""
        return DJ_PERSONA_TEMPLATES.get(persona_id)
    
    def list_personas(self) -> List[Dict[str, Any]]:
        """List all available personas"""
        return [
            {
                "id": key,
                "name": value["name"],
                "description": value["system_prompt"][:100] + "...",
                "voice_settings": value.get("voice_settings", {})
            }
            for key, value in DJ_PERSONA_TEMPLATES.items()
        ]
    
    def build_persona_prompt(
        self,
        persona_id: str,
        base_prompt: str
    ) -> str:
        """Build a prompt with persona injection"""
        persona = self.get_persona(persona_id)
        if persona:
            return f"{persona['system_prompt']}\n\n{base_prompt}"
        return base_prompt





