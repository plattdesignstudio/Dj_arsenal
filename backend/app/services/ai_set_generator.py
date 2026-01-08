import os
import openai
from typing import List, Dict, Optional, Any
from dotenv import load_dotenv

load_dotenv()

class AISetGenerator:
    """AI-powered set generation"""
    
    def __init__(self):
        self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    def generate_set_plan(
        self,
        available_tracks: List[Dict[str, Any]],
        event_type: str = "Club Night",
        duration_minutes: int = 60,
        start_energy: float = 0.4,
        peak_energy: float = 0.9
    ) -> Dict[str, Any]:
        """Generate a complete set plan using AI"""
        try:
            tracks_summary = self._format_tracks_summary(available_tracks[:30])
            
            prompt = f"""You are an expert DJ set builder. Create a set plan for:

Event: {event_type}
Duration: {duration_minutes} minutes
Energy Curve: Start at {start_energy:.1f}, peak at {peak_energy:.1f}

Available Tracks ({len(available_tracks)} total):
{tracks_summary}

Create a set plan with:
1. Track selection (10-15 tracks for {duration_minutes} minutes)
2. Order (consider BPM flow, key transitions, energy curve)
3. Brief notes on transitions

Format your response as:
TRACKS:
1. Track Title - Artist
2. Track Title - Artist
...

NOTES:
- Brief transition notes
- Energy building strategy
- Key moments"""
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a professional DJ set builder with expertise in flow, energy management, and harmonic mixing."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=800
            )
            
            plan_text = response.choices[0].message.content
            
            # Parse the plan
            return self._parse_set_plan(plan_text, available_tracks, duration_minutes)
            
        except Exception as e:
            return self._fallback_set_plan(available_tracks, duration_minutes)
    
    def optimize_set_flow(
        self,
        tracks: List[Dict[str, Any]],
        feedback: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """AI-powered set flow optimization"""
        try:
            tracks_list = "\n".join([
                f"{i+1}. {t.get('title', 'Unknown')} - {t.get('artist', 'Unknown')} "
                f"({t.get('bpm', '?')} BPM, {t.get('key', '?')}, Energy: {t.get('energy', 0.5):.2f})"
                for i, t in enumerate(tracks)
            ])
            
            prompt = f"""Optimize the order of these tracks for perfect DJ flow:

Current Order:
{tracks_list}

{f'Feedback: {feedback}' if feedback else ''}

Reorder the tracks (use the same track numbers) to create:
- Smooth BPM progression
- Harmonic compatibility
- Energy curve (build to peak, then maintain)
- Natural flow

Return only the reordered track numbers, one per line, like:
3
1
5
2
..."""
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a DJ flow expert specializing in track ordering and transitions."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.6,
                max_tokens=200
            )
            
            order_text = response.choices[0].message.content
            new_order = self._parse_track_order(order_text, tracks)
            
            return new_order if new_order else tracks
            
        except Exception as e:
            return tracks
    
    def _format_tracks_summary(self, tracks: List[Dict[str, Any]]) -> str:
        """Format tracks for AI prompt"""
        return "\n".join([
            f"- {t.get('title', 'Unknown')} by {t.get('artist', 'Unknown')} "
            f"| BPM: {t.get('bpm', '?')} | Key: {t.get('key', '?')} | "
            f"Energy: {t.get('energy', 0.5):.2f} | Genre: {t.get('genre', 'Unknown')}"
            for t in tracks
        ])
    
    def _parse_set_plan(
        self,
        plan_text: str,
        available_tracks: List[Dict[str, Any]],
        duration: int
    ) -> Dict[str, Any]:
        """Parse AI-generated set plan"""
        lines = plan_text.split("\n")
        selected_tracks = []
        notes = []
        in_notes = False
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            if "NOTES:" in line.upper():
                in_notes = True
                continue
            
            if in_notes:
                if line.startswith("-") or line.startswith("•"):
                    notes.append(line.lstrip("- •").strip())
            else:
                # Try to match track
                if any(char.isdigit() for char in line[:3]):
                    # Extract track info
                    parts = line.split(".", 1)
                    if len(parts) > 1:
                        track_info = parts[1].strip()
                        if " - " in track_info:
                            title_artist = track_info.split("(")[0].strip()
                            title, artist = title_artist.split(" - ", 1) if " - " in title_artist else (track_info, "")
                            
                            # Find matching track
                            for track in available_tracks:
                                if (title.lower() in track.get('title', '').lower() or
                                    track.get('title', '').lower() in title.lower()):
                                    if track not in selected_tracks:
                                        selected_tracks.append(track)
                                        break
        
        return {
            "tracks": selected_tracks[:15],
            "notes": notes,
            "estimated_duration": duration * 60
        }
    
    def _parse_track_order(self, order_text: str, tracks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Parse reordered track numbers"""
        numbers = []
        for line in order_text.split("\n"):
            line = line.strip()
            if line and line.isdigit():
                num = int(line)
                if 1 <= num <= len(tracks):
                    numbers.append(num - 1)
        
        if len(numbers) == len(tracks):
            return [tracks[i] for i in numbers]
        return []
    
    def _fallback_set_plan(
        self,
        available_tracks: List[Dict[str, Any]],
        duration: int
    ) -> Dict[str, Any]:
        """Fallback set plan generation"""
        # Simple: sort by energy, take top tracks
        sorted_tracks = sorted(
            available_tracks,
            key=lambda t: t.get('energy', 0.5),
            reverse=True
        )
        
        return {
            "tracks": sorted_tracks[:12],
            "notes": ["Set generated with energy-based selection"],
            "estimated_duration": duration * 60
        }






