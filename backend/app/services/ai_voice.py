import os
import openai
from typing import Dict, Optional
from dotenv import load_dotenv

load_dotenv()

class AIVoiceGenerator:
    """AI voice generation using OpenAI TTS"""
    
    def __init__(self):
        self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    def generate_voice(
        self,
        text: str,
        voice: str = "alloy",  # alloy, echo, fable, onyx, nova, shimmer
        speed: float = 1.0,
        persona_settings: Optional[Dict] = None
    ) -> Dict:
        """Generate voice audio from text"""
        try:
            # Override voice if persona settings provided
            if persona_settings:
                voice = persona_settings.get("voice", voice)
                speed = persona_settings.get("speed", speed)
            
            response = self.client.audio.speech.create(
                model="tts-1",
                voice=voice,
                input=text,
                speed=speed
            )
            
            # In production, save to storage and return URL
            # For now, return the audio data
            audio_data = response.content
            
            return {
                "success": True,
                "audio_data": audio_data,
                "voice": voice,
                "text": text
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def generate_hype_phrase(
        self,
        event_type: str = "club",
        energy_level: str = "high"
    ) -> str:
        """Generate context-aware hype phrases using AI"""
        try:
            from app.services.ai_recommendations import AIRecommendationEngine
            ai_engine = AIRecommendationEngine()
            return ai_engine.generate_ai_hype_phrase(event_type, energy_level)
        except Exception as e:
            # Fallback to static phrases
            phrases = {
                "club": {
                    "high": [
                        "Let's take this higher!",
                        "Are you ready?",
                        "This is what you came for!",
                        "Energy up!",
                        "Let's go!"
                    ],
                    "medium": [
                        "Feeling good?",
                        "We're just getting started",
                        "Keep the vibe going",
                        "This is nice"
                    ],
                    "low": [
                        "Let's ease into it",
                        "Welcome to the night",
                        "We're building something special"
                    ]
                },
                "festival": {
                    "high": [
                        "Festival family, make some noise!",
                        "This is what we came for!",
                        "Are you ready to go crazy?",
                        "Let's make this moment legendary!"
                    ],
                    "medium": [
                        "Beautiful people, how are we feeling?",
                        "We're in this together",
                        "The energy is building"
                    ],
                    "low": [
                        "Welcome to the journey",
                        "Let's start this adventure together"
                    ]
                }
            }
            
            event_phrases = phrases.get(event_type, phrases["club"])
            level_phrases = event_phrases.get(energy_level, event_phrases["medium"])
            
            import random
            return random.choice(level_phrases)
    
    def generate_drop_intro(
        self,
        bpm: Optional[float] = None,
        key: Optional[str] = None
    ) -> str:
        """Generate drop intro phrases"""
        intros = [
            "Here we go!",
            "Get ready!",
            "This is it!",
            "Drop incoming!",
            "Let's do this!",
            "Here comes the drop!",
            "Brace yourselves!",
            "This is the moment!"
        ]
        
        import random
        return random.choice(intros)
    
    def generate_dj_tag(
        self,
        dj_name: str
    ) -> str:
        """Generate DJ tag/identifier"""
        templates = [
            f"You're locked in with {dj_name}",
            f"This is {dj_name}, bringing you the heat",
            f"{dj_name} in the mix",
            f"DJ {dj_name}, taking control",
            f"You're listening to {dj_name}"
        ]
        
        import random
        return random.choice(templates)






