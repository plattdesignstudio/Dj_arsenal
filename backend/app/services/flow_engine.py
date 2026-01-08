from typing import List, Dict, Optional, Tuple
from app.models import Track

class FlowEngine:
    """BPM flow and energy management engine"""
    
    @staticmethod
    def calculate_bpm_transition(from_bpm: float, to_bpm: float) -> Dict[str, any]:
        """Calculate optimal BPM transition"""
        diff = to_bpm - from_bpm
        abs_diff = abs(diff)
        
        # Categorize transition
        if abs_diff < 2:
            transition_type = "smooth"
            difficulty = "easy"
        elif abs_diff < 5:
            transition_type = "moderate"
            difficulty = "medium"
        elif abs_diff < 10:
            transition_type = "aggressive"
            difficulty = "hard"
        else:
            transition_type = "extreme"
            difficulty = "very_hard"
        
        # Suggest intermediate BPMs if needed
        intermediate_bpms = []
        if abs_diff > 5:
            steps = int(abs_diff / 3)
            direction = 1 if diff > 0 else -1
            for i in range(1, steps + 1):
                intermediate_bpms.append(from_bpm + (direction * 3 * i))
        
        return {
            "transition_type": transition_type,
            "difficulty": difficulty,
            "bpm_difference": diff,
            "intermediate_bpms": intermediate_bpms,
            "recommended": abs_diff < 5
        }
    
    @staticmethod
    def suggest_next_track(
        current_track: Track,
        available_tracks: List[Track],
        target_energy: Optional[float] = None,
        target_bpm: Optional[float] = None,
        energy_direction: str = "maintain"  # "maintain", "boost", "drop"
    ) -> List[Tuple[Track, float, str]]:
        """Suggest next tracks with compatibility scores"""
        suggestions = []
        
        for track in available_tracks:
            if track.id == current_track.id:
                continue
            
            score = 0.0
            reasons = []
            
            # BPM compatibility
            if current_track.bpm and track.bpm:
                bpm_transition = FlowEngine.calculate_bpm_transition(
                    current_track.bpm,
                    track.bpm
                )
                if bpm_transition["recommended"]:
                    score += 0.4
                    reasons.append("smooth_bpm")
                elif bpm_transition["difficulty"] == "medium":
                    score += 0.2
                    reasons.append("moderate_bpm")
            
            # Energy compatibility
            if current_track.energy and track.energy:
                energy_diff = track.energy - current_track.energy
                
                if energy_direction == "maintain":
                    if abs(energy_diff) < 0.1:
                        score += 0.3
                        reasons.append("matched_energy")
                elif energy_direction == "boost":
                    if 0.1 <= energy_diff <= 0.3:
                        score += 0.3
                        reasons.append("energy_boost")
                elif energy_direction == "drop":
                    if -0.3 <= energy_diff <= -0.1:
                        score += 0.3
                        reasons.append("energy_drop")
            
            # Target energy match
            if target_energy and track.energy:
                if abs(track.energy - target_energy) < 0.15:
                    score += 0.2
                    reasons.append("target_energy")
            
            # Target BPM match
            if target_bpm and track.bpm:
                if abs(track.bpm - target_bpm) < 3:
                    score += 0.1
                    reasons.append("target_bpm")
            
            # Genre consistency (bonus)
            if current_track.genre and track.genre:
                if current_track.genre == track.genre:
                    score += 0.1
                    reasons.append("same_genre")
            
            suggestions.append((track, score, ", ".join(reasons)))
        
        # Sort by score descending
        suggestions.sort(key=lambda x: x[1], reverse=True)
        return suggestions
    
    @staticmethod
    def build_energy_curve(
        tracks: List[Track],
        event_type_profile: Optional[Dict] = None
    ) -> List[Dict]:
        """Build energy curve for a set"""
        curve = []
        total_duration = 0
        
        for i, track in enumerate(tracks):
            if track.duration and track.energy:
                curve.append({
                    "position": i,
                    "track_id": track.id,
                    "time": total_duration,
                    "energy": track.energy,
                    "bpm": track.bpm
                })
                total_duration += track.duration
        
        return curve
    
    @staticmethod
    def detect_energy_drops(curve: List[Dict], threshold: float = 0.2) -> List[int]:
        """Detect problematic energy drops in curve"""
        drops = []
        
        for i in range(1, len(curve)):
            energy_diff = curve[i]["energy"] - curve[i-1]["energy"]
            if energy_diff < -threshold:
                drops.append(i)
        
        return drops
    
    @staticmethod
    def optimize_set_order(tracks: List[Track]) -> List[Track]:
        """Optimize track order for smooth flow"""
        if not tracks:
            return []
        
        # Start with highest energy track or first track
        sorted_tracks = sorted(tracks, key=lambda t: t.energy or 0, reverse=True)
        optimized = [sorted_tracks[0]]
        remaining = sorted_tracks[1:]
        
        while remaining:
            current = optimized[-1]
            suggestions = FlowEngine.suggest_next_track(
                current,
                remaining,
                energy_direction="maintain"
            )
            
            if suggestions:
                next_track = suggestions[0][0]
                optimized.append(next_track)
                remaining.remove(next_track)
            else:
                # Fallback: add remaining track
                optimized.append(remaining.pop(0))
        
        return optimized






