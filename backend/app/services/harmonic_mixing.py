from typing import List, Dict, Tuple

class HarmonicMixingEngine:
    """Camelot wheel harmonic mixing system"""
    
    # Camelot wheel mapping: (Key, Mode) -> Camelot Code
    CAMELOT_WHEEL = {
        # Major keys (B)
        "C": "8B", "G": "9B", "D": "10B", "A": "11B", "E": "12B",
        "B": "1B", "F#": "2B", "C#": "3B", "G#": "4B", "D#": "5B", "A#": "6B", "F": "7B",
        # Minor keys (A)
        "Am": "8A", "Em": "9A", "Bm": "10A", "F#m": "11A", "C#m": "12A",
        "G#m": "1A", "D#m": "2A", "A#m": "3A", "Fm": "4A", "Cm": "5A", "Gm": "6A", "Dm": "7A"
    }
    
    @staticmethod
    def get_compatible_keys(camelot_key: str) -> Dict[str, List[str]]:
        """Get all compatible keys for a given Camelot key"""
        if not camelot_key or len(camelot_key) < 2:
            return {"perfect": [], "safe": [], "risky": []}
        
        number = int(camelot_key[:-1])
        mode = camelot_key[-1]
        
        # Perfect matches
        perfect = [camelot_key]
        
        # Same number, opposite mode (relative major/minor)
        opposite_mode = "A" if mode == "B" else "B"
        perfect.append(f"{number}{opposite_mode}")
        
        # Adjacent numbers (same mode) - very safe
        safe = []
        if number == 1:
            safe.append(f"12{mode}")
            safe.append(f"2{mode}")
        elif number == 12:
            safe.append(f"11{mode}")
            safe.append(f"1{mode}")
        else:
            safe.append(f"{number - 1}{mode}")
            safe.append(f"{number + 1}{mode}")
        
        # Adjacent numbers (opposite mode) - safe
        for num in [number - 1, number + 1]:
            if num < 1:
                num = 12
            elif num > 12:
                num = 1
            safe.append(f"{num}{opposite_mode}")
        
        # +4/-4 (perfect fifth) - risky but musical
        risky = []
        for offset in [-4, 4]:
            risky_num = number + offset
            if risky_num < 1:
                risky_num += 12
            elif risky_num > 12:
                risky_num -= 12
            risky.append(f"{risky_num}{mode}")
            risky.append(f"{risky_num}{opposite_mode}")
        
        return {
            "perfect": perfect,
            "safe": safe,
            "risky": risky
        }
    
    @staticmethod
    def get_transition_type(from_key: str, to_key: str) -> str:
        """Determine transition type between two keys"""
        if not from_key or not to_key:
            return "unknown"
        
        compat = HarmonicMixingEngine.get_compatible_keys(from_key)
        
        if to_key in compat["perfect"]:
            return "perfect"
        elif to_key in compat["safe"]:
            return "smooth"
        elif to_key in compat["risky"]:
            return "risky"
        else:
            return "clash"
    
    @staticmethod
    def calculate_compatibility_score(from_key: str, to_key: str) -> float:
        """Calculate compatibility score (0.0 - 1.0)"""
        transition_type = HarmonicMixingEngine.get_transition_type(from_key, to_key)
        
        scores = {
            "perfect": 1.0,
            "smooth": 0.8,
            "risky": 0.5,
            "clash": 0.2,
            "unknown": 0.0
        }
        
        return scores.get(transition_type, 0.0)
    
    @staticmethod
    def get_modal_interchange_suggestions(key: str) -> List[str]:
        """Get modal interchange suggestions for creative mixing"""
        if not key or len(key) < 2:
            return []
        
        number = int(key[:-1])
        mode = key[-1]
        
        # Parallel modes (same root, different mode)
        opposite_mode = "A" if mode == "B" else "B"
        parallel = f"{number}{opposite_mode}"
        
        # Relative modes (different root, same notes)
        # This is the same as perfect match, already handled
        
        # Subdominant/dominant relationships
        subdominant = number - 1 if number > 1 else 12
        dominant = number + 1 if number < 12 else 1
        
        return [
            parallel,
            f"{subdominant}{mode}",
            f"{dominant}{mode}",
            f"{subdominant}{opposite_mode}",
            f"{dominant}{opposite_mode}"
        ]






