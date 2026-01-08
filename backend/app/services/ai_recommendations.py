import os
import openai
from typing import List, Dict, Optional, Any
from dotenv import load_dotenv

load_dotenv()

class AIRecommendationEngine:
    """AI-powered recommendations using OpenAI GPT"""
    
    def __init__(self):
        self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    def suggest_tracks(
        self,
        current_track: Dict[str, Any],
        available_tracks: List[Dict[str, Any]],
        context: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """AI-powered track suggestions based on current track and context"""
        try:
            context_str = ""
            if context:
                context_str = f"""
Event Type: {context.get('event_type', 'General')}
Current Energy: {context.get('energy_level', 'medium')}
Crowd Vibe: {context.get('crowd_vibe', 'building')}
Time of Night: {context.get('time', 'midnight')}
"""
            
            prompt = f"""You are an expert DJ assistant. Given the current track playing, suggest the next 5 tracks that would create a perfect flow.

Current Track:
- Title: {current_track.get('title', 'Unknown')}
- Artist: {current_track.get('artist', 'Unknown')}
- BPM: {current_track.get('bpm', 'Unknown')}
- Key: {current_track.get('key', 'Unknown')}
- Energy: {current_track.get('energy', 0.5)}
- Genre: {current_track.get('genre', 'Unknown')}

{context_str}

Available Tracks:
{self._format_tracks_list(available_tracks[:20])}

Provide your recommendations in this format:
1. Track Title - Artist (Reason: why this track works)
2. Track Title - Artist (Reason: why this track works)
...

Focus on:
- Smooth BPM transitions (±5 BPM is ideal)
- Harmonic compatibility (Camelot wheel)
- Energy flow (maintain or build energy)
- Genre consistency or creative genre blending
- Crowd engagement"""
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an expert DJ with deep knowledge of music theory, harmonic mixing, and crowd psychology."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            suggestions_text = response.choices[0].message.content
            
            # Parse suggestions and match to tracks
            suggestions = self._parse_suggestions(suggestions_text, available_tracks)
            
            return suggestions[:5]  # Top 5
            
        except Exception as e:
            # Fallback to basic matching
            return self._fallback_suggestions(current_track, available_tracks)
    
    def generate_set_description(
        self,
        tracks: List[Dict[str, Any]],
        event_type: str = "Club Night"
    ) -> str:
        """Generate AI-powered set description"""
        try:
            tracks_summary = "\n".join([
                f"- {t.get('artist', 'Unknown')} - {t.get('title', 'Unknown')} ({t.get('bpm', '?')} BPM, {t.get('key', '?')})"
                for t in tracks[:10]
            ])
            
            prompt = f"""Create an engaging, energetic description for this DJ set:

Event Type: {event_type}
Tracks ({len(tracks)} total):
{tracks_summary}

Write a 2-3 sentence description that captures the energy, vibe, and journey of this set. Make it exciting and professional."""
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a professional DJ and music curator who writes engaging set descriptions."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
                max_tokens=150
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            return f"An energetic {event_type.lower()} set featuring {len(tracks)} carefully selected tracks."
    
    def generate_track_tags(
        self,
        track: Dict[str, Any]
    ) -> List[str]:
        """Generate AI-powered tags for a track"""
        try:
            prompt = f"""Analyze this track and suggest 5-7 relevant tags (mood, energy, vibe, style):

Title: {track.get('title', 'Unknown')}
Artist: {track.get('artist', 'Unknown')}
Genre: {track.get('genre', 'Unknown')}
BPM: {track.get('bpm', 'Unknown')}
Key: {track.get('key', 'Unknown')}
Energy: {track.get('energy', 0.5)}

Return only a comma-separated list of tags, no explanation."""
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a music analyst who creates concise, relevant tags for tracks."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=100
            )
            
            tags_text = response.choices[0].message.content.strip()
            tags = [tag.strip() for tag in tags_text.split(",")]
            return tags[:7]
            
        except Exception as e:
            return ["electronic", "dance", "energetic"]
    
    def generate_ai_hype_phrase(
        self,
        event_type: str = "club",
        energy_level: str = "high",
        context: Optional[str] = None
    ) -> str:
        """Generate AI-powered hype phrases using GPT"""
        try:
            prompt = f"""Generate a short, energetic DJ hype phrase for:

Event Type: {event_type}
Energy Level: {energy_level}
Context: {context or 'general crowd engagement'}

Make it:
- 5-15 words
- Energetic and engaging
- Appropriate for the event type
- Natural and authentic

Return only the phrase, no quotes or explanation."""
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a professional DJ who creates engaging, authentic hype phrases."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.9,
                max_tokens=50
            )
            
            return response.choices[0].message.content.strip().strip('"').strip("'")
            
        except Exception as e:
            # Fallback
            return "Let's take this higher!"
    
    def _format_tracks_list(self, tracks: List[Dict[str, Any]]) -> str:
        """Format tracks list for prompt"""
        return "\n".join([
            f"- {t.get('title', 'Unknown')} by {t.get('artist', 'Unknown')} "
            f"(BPM: {t.get('bpm', '?')}, Key: {t.get('key', '?')}, Energy: {t.get('energy', 0.5):.2f}, Genre: {t.get('genre', 'Unknown')})"
            for t in tracks
        ])
    
    def _parse_suggestions(self, text: str, available_tracks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Parse AI suggestions and match to actual tracks"""
        suggestions = []
        lines = text.split("\n")
        
        for line in lines:
            if not line.strip() or not any(char.isdigit() for char in line[:3]):
                continue
            
            # Try to extract track title and artist
            parts = line.split("(")[0].strip()  # Remove reason
            if " - " in parts:
                parts = parts.split(" - ", 1)
                if len(parts) == 2:
                    title = parts[0].strip().lstrip("1234567890. ").strip()
                    artist = parts[1].strip()
                    
                    # Find matching track
                    for track in available_tracks:
                        if (title.lower() in track.get('title', '').lower() or 
                            track.get('title', '').lower() in title.lower()):
                            if track not in suggestions:
                                suggestions.append(track)
                                break
        
        return suggestions
    
    def _fallback_suggestions(
        self,
        current_track: Dict[str, Any],
        available_tracks: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Fallback suggestion logic when AI fails"""
        suggestions = []
        current_bpm = current_track.get('bpm')
        current_key = current_track.get('key')
        
        for track in available_tracks:
            score = 0
            if current_bpm and track.get('bpm'):
                bpm_diff = abs(current_bpm - track.get('bpm', 0))
                if bpm_diff < 5:
                    score += 1
            if current_key and track.get('key') == current_key:
                score += 1
            
            if score > 0:
                suggestions.append(track)
        
        return suggestions[:5]






