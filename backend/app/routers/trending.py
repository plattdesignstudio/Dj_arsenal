from fastapi import APIRouter, HTTPException
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.services.trending_tracks import TrendingTracksService
from app.services.spotify_service import SpotifyService

router = APIRouter()

async def get_sample_trending_tracks(limit: int = 20) -> List[Dict[str, Any]]:
    """Return sample trending tracks when SerpAPI is not available"""
    # Try to enrich sample tracks with album art from Spotify
    sample_tracks = [
        {"title": "Flowers", "artist": "Miley Cyrus", "source": "Trending"},
        {"title": "As It Was", "artist": "Harry Styles", "source": "Trending"},
        {"title": "Unholy", "artist": "Sam Smith ft. Kim Petras", "source": "Trending"},
        {"title": "Anti-Hero", "artist": "Taylor Swift", "source": "Trending"},
        {"title": "Calm Down", "artist": "Rema & Selena Gomez", "source": "Trending"},
        {"title": "Creepin'", "artist": "Metro Boomin, The Weeknd, 21 Savage", "source": "Trending"},
        {"title": "Kill Bill", "artist": "SZA", "source": "Trending"},
        {"title": "I'm Good (Blue)", "artist": "David Guetta & Bebe Rexha", "source": "Trending"},
        {"title": "Lavender Haze", "artist": "Taylor Swift", "source": "Trending"},
        {"title": "Unstoppable", "artist": "Sia", "source": "Trending"},
    ][:limit]
    
    # Try to enrich with album art
    try:
        service = TrendingTracksService()
        sample_tracks = await service._enrich_tracks_with_album_art(sample_tracks)
    except Exception as e:
        print(f"Failed to enrich sample tracks: {e}")
    
    return sample_tracks

async def get_sample_billboard_tracks() -> List[Dict[str, Any]]:
    """Return sample Billboard Hot 100 tracks when SerpAPI is not available"""
    sample_tracks = [
        {"title": "Flowers", "artist": "Miley Cyrus", "position": 1, "source": "Billboard Hot 100"},
        {"title": "Kill Bill", "artist": "SZA", "position": 2, "source": "Billboard Hot 100"},
        {"title": "As It Was", "artist": "Harry Styles", "position": 3, "source": "Billboard Hot 100"},
        {"title": "Creepin'", "artist": "Metro Boomin, The Weeknd, 21 Savage", "position": 4, "source": "Billboard Hot 100"},
        {"title": "Unholy", "artist": "Sam Smith ft. Kim Petras", "position": 5, "source": "Billboard Hot 100"},
        {"title": "Anti-Hero", "artist": "Taylor Swift", "position": 6, "source": "Billboard Hot 100"},
        {"title": "Calm Down", "artist": "Rema & Selena Gomez", "position": 7, "source": "Billboard Hot 100"},
        {"title": "I'm Good (Blue)", "artist": "David Guetta & Bebe Rexha", "position": 8, "source": "Billboard Hot 100"},
        {"title": "Lavender Haze", "artist": "Taylor Swift", "position": 9, "source": "Billboard Hot 100"},
        {"title": "Unstoppable", "artist": "Sia", "position": 10, "source": "Billboard Hot 100"},
    ]
    
    # Try to enrich with album art
    try:
        service = TrendingTracksService()
        sample_tracks = await service._enrich_tracks_with_album_art(sample_tracks)
    except Exception as e:
        print(f"Failed to enrich sample Billboard tracks: {e}")
    
    return sample_tracks

async def get_sample_spotify_tracks() -> List[Dict[str, Any]]:
    """Return sample Spotify Top Charts tracks when SerpAPI is not available"""
    sample_tracks = [
        {"title": "Flowers", "artist": "Miley Cyrus", "source": "Spotify Top Charts"},
        {"title": "Kill Bill", "artist": "SZA", "source": "Spotify Top Charts"},
        {"title": "As It Was", "artist": "Harry Styles", "source": "Spotify Top Charts"},
        {"title": "Creepin'", "artist": "Metro Boomin, The Weeknd, 21 Savage", "source": "Spotify Top Charts"},
        {"title": "Unholy", "artist": "Sam Smith ft. Kim Petras", "source": "Spotify Top Charts"},
        {"title": "Anti-Hero", "artist": "Taylor Swift", "source": "Spotify Top Charts"},
        {"title": "Calm Down", "artist": "Rema & Selena Gomez", "source": "Spotify Top Charts"},
        {"title": "I'm Good (Blue)", "artist": "David Guetta & Bebe Rexha", "source": "Spotify Top Charts"},
        {"title": "Lavender Haze", "artist": "Taylor Swift", "source": "Spotify Top Charts"},
        {"title": "Unstoppable", "artist": "Sia", "source": "Spotify Top Charts"},
    ]
    
    # Try to enrich with album art
    try:
        service = TrendingTracksService()
        sample_tracks = await service._enrich_tracks_with_album_art(sample_tracks)
    except Exception as e:
        print(f"Failed to enrich sample Spotify tracks: {e}")
    
    return sample_tracks

class TrendingRequest(BaseModel):
    genre: Optional[str] = None
    location: str = "United States"
    limit: int = 20

@router.get("/")
async def get_trending_tracks(
    genre: Optional[str] = None,
    location: str = "United States",
    limit: int = 20
):
    """Get trending tracks using SerpAPI"""
    try:
        service = TrendingTracksService()
        tracks = await service.get_trending_tracks(genre, location, limit)
        
        # If no tracks returned (SerpAPI not configured), return sample data
        if not tracks:
            tracks = await get_sample_trending_tracks(limit)
            return {
                "tracks": tracks,
                "count": len(tracks),
                "source": "Sample Data (SerpAPI not configured)"
            }
        
        return {
            "tracks": tracks,
            "count": len(tracks),
            "source": "SerpAPI"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch trending tracks: {str(e)}")

@router.get("/billboard")
async def get_billboard_hot_100():
    """Get Billboard Hot 100 chart"""
    try:
        service = TrendingTracksService()
        tracks = await service.get_billboard_hot_100()
        
        # If no tracks returned, return sample Billboard data
        if not tracks:
            tracks = await get_sample_billboard_tracks()
            return {
                "tracks": tracks,
                "count": len(tracks),
                "source": "Sample Data (SerpAPI not configured)"
            }
        
        return {
            "tracks": tracks,
            "count": len(tracks),
            "source": "Billboard Hot 100"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch Billboard chart: {str(e)}")

@router.get("/spotify")
async def get_spotify_top_charts():
    """Get Spotify top charts"""
    try:
        service = TrendingTracksService()
        tracks = await service.get_spotify_top_charts()
        
        # Determine source based on whether we got real data
        if tracks and len(tracks) > 0:
            # Check if tracks have Spotify-specific fields (from API)
            if any("popularity" in track or "preview_url" in track or "album_image_url" in track for track in tracks):
                source = "Spotify Web API"
            else:
                source = "Spotify Top Charts"
        else:
            # If no tracks returned, return sample Spotify data
            print("No tracks from Spotify API, returning sample data")
            tracks = await get_sample_spotify_tracks()
            source = "Sample Data (Spotify API not configured or unavailable)"
        
        return {
            "tracks": tracks,
            "count": len(tracks),
            "source": source
        }
    except Exception as e:
        print(f"Error in get_spotify_top_charts: {e}")
        # Return sample data on error instead of failing
        tracks = await get_sample_spotify_tracks()
        return {
            "tracks": tracks,
            "count": len(tracks),
            "source": f"Sample Data (Error: {str(e)})"
        }

@router.get("/search")
async def search_track_info(
    track_name: str,
    artist_name: Optional[str] = None
):
    """Search for detailed track information"""
    try:
        service = TrendingTracksService()
        info = service.search_track_info(track_name, artist_name)
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search track info: {str(e)}")

@router.get("/spotify-search")
async def search_spotify_tracks(
    query: str,
    limit: int = 20,
    market: str = "US"
):
    """Search for tracks on Spotify with preview URLs"""
    try:
        spotify_service = SpotifyService()
        # search_tracks now only returns tracks with preview URLs
        tracks = await spotify_service.search_tracks(query, limit, market)
        
        return {
            "tracks": tracks,
            "count": len(tracks),
            "source": "Spotify Search"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search Spotify tracks: {str(e)}")

@router.get("/spotify-featured")
async def get_featured_tracks(
    limit: int = 20,
    market: str = "US"
):
    """Get featured tracks from Spotify (guaranteed to have preview URLs)"""
    try:
        spotify_service = SpotifyService()
        tracks = await spotify_service.get_featured_playlists(limit, market)
        
        return {
            "tracks": tracks,
            "count": len(tracks),
            "source": "Spotify Featured"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch featured tracks: {str(e)}")

@router.get("/spotify-track/{track_id}")
async def get_spotify_track(
    track_id: str,
    market: str = "US"
):
    """Get a specific track by Spotify ID with preview URL"""
    try:
        spotify_service = SpotifyService()
        track = await spotify_service.get_track_by_id(track_id, market)
        
        if not track:
            raise HTTPException(status_code=404, detail="Track not found or no preview available")
        
        return track
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch track: {str(e)}")

