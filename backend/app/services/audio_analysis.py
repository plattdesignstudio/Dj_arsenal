try:
    import librosa
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False
    librosa = None

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    np = None

from typing import Dict, Any, Optional
import os

class AudioAnalyzer:
    """Audio analysis service for BPM, key, and energy detection"""
    
    @staticmethod
    def analyze_bpm(file_path: str) -> Dict[str, Any]:
        """Detect BPM using librosa"""
        if not LIBROSA_AVAILABLE:
            return {
                "bpm": None,
                "confidence": 0.0,
                "error": "librosa not installed"
            }
        try:
            y, sr = librosa.load(file_path, duration=60)  # Analyze first 60 seconds
            tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
            return {
                "bpm": float(tempo),
                "confidence": 0.9,
                "method": "librosa"
            }
        except Exception as e:
            return {
                "bpm": None,
                "confidence": 0.0,
                "error": str(e)
            }
    
    @staticmethod
    def analyze_key(file_path: str) -> Dict[str, Any]:
        """Detect musical key using chroma features"""
        if not LIBROSA_AVAILABLE or not NUMPY_AVAILABLE:
            return {
                "key": None,
                "confidence": 0.0,
                "error": "librosa or numpy not installed"
            }
        try:
            y, sr = librosa.load(file_path, duration=30)
            chroma = librosa.feature.chroma_stft(y=y, sr=sr)
            chroma_mean = np.mean(chroma, axis=1)
            
            # Map to Camelot wheel
            key_map = {
                0: "1A", 1: "2B", 2: "3A", 3: "4B", 4: "5A", 5: "6B",
                6: "7A", 7: "8B", 8: "9A", 9: "10B", 10: "11A", 11: "12B"
            }
            
            dominant_key = int(np.argmax(chroma_mean))
            camelot_key = key_map.get(dominant_key, "1A")
            
            return {
                "key": camelot_key,
                "confidence": float(chroma_mean[dominant_key]),
                "method": "chroma"
            }
        except Exception as e:
            return {
                "key": None,
                "confidence": 0.0,
                "error": str(e)
            }
    
    @staticmethod
    def analyze_energy(file_path: str) -> Dict[str, Any]:
        """Calculate energy level based on RMS and spectral features"""
        if not LIBROSA_AVAILABLE or not NUMPY_AVAILABLE:
            return {
                "energy": 0.5,
                "confidence": 0.0,
                "error": "librosa or numpy not installed"
            }
        try:
            y, sr = librosa.load(file_path, duration=60)
            
            # RMS energy
            rms = librosa.feature.rms(y=y)[0]
            rms_mean = float(np.mean(rms))
            
            # Spectral centroid (brightness)
            spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
            centroid_mean = float(np.mean(spectral_centroid))
            
            # Zero crossing rate (rhythmic activity)
            zcr = librosa.feature.zero_crossing_rate(y)[0]
            zcr_mean = float(np.mean(zcr))
            
            # Normalize to 0-1 scale
            energy = min(1.0, (rms_mean * 10 + centroid_mean / 1000 + zcr_mean * 100) / 3)
            
            return {
                "energy": energy,
                "rms": rms_mean,
                "brightness": centroid_mean,
                "rhythmic_activity": zcr_mean,
                "confidence": 0.85
            }
        except Exception as e:
            return {
                "energy": 0.5,
                "confidence": 0.0,
                "error": str(e)
            }
    
    @staticmethod
    def full_analysis(file_path: str) -> Dict[str, Any]:
        """Perform complete audio analysis"""
        bpm_result = AudioAnalyzer.analyze_bpm(file_path)
        key_result = AudioAnalyzer.analyze_key(file_path)
        energy_result = AudioAnalyzer.analyze_energy(file_path)
        
        return {
            "bpm": bpm_result.get("bpm"),
            "key": key_result.get("key"),
            "energy": energy_result.get("energy"),
            "confidence": (
                bpm_result.get("confidence", 0) +
                key_result.get("confidence", 0) +
                energy_result.get("confidence", 0)
            ) / 3,
            "details": {
                "bpm_analysis": bpm_result,
                "key_analysis": key_result,
                "energy_analysis": energy_result
            }
        }




