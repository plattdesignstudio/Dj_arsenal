import os
from typing import List, Dict, Optional, Any
from dotenv import load_dotenv
import re

# Optional import for serpapi
try:
    from serpapi import GoogleSearch
    SERPAPI_AVAILABLE = True
except ImportError:
    SERPAPI_AVAILABLE = False
    GoogleSearch = None

load_dotenv()

class TrendingTracksService:
    """Service to fetch trending/hot tracks using SerpAPI"""
    
    def __init__(self):
        self.api_key = os.getenv("SERPAPI_KEY")
        if not self.api_key:
            print("Warning: SERPAPI_KEY not found in environment variables")
            # Don't raise error, return empty results instead
        if not SERPAPI_AVAILABLE:
            print("Warning: serpapi module not installed. Trending tracks features will be limited.")
    
    async def get_trending_tracks(
        self,
        genre: Optional[str] = None,
        location: str = "United States",
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get trending tracks from Google search"""
        if not SERPAPI_AVAILABLE or not self.api_key:
            return []
        
        try:
            # Search for trending music charts
            query = f"trending music {genre or ''} 2024".strip()
            
            params = {
                "q": query,
                "api_key": self.api_key,
                "engine": "google",
                "gl": "us",
                "hl": "en"
            }
            
            search = GoogleSearch(params)
            results = search.get_dict()
            
            # Parse results to extract track information
            tracks = []
            
            # Try to extract from organic results
            organic_results = results.get("organic_results", [])
            for result in organic_results[:limit]:
                title = result.get("title", "")
                snippet = result.get("snippet", "")
                link = result.get("link", "")
                
                # Try to extract artist and track name
                track_info = self._parse_track_info(title, snippet)
                if track_info:
                    tracks.append({
                        "title": track_info.get("title", title),
                        "artist": track_info.get("artist", "Unknown"),
                        "source": "SerpAPI",
                        "url": link,
                        "snippet": snippet
                    })
            
            # Also try music knowledge graph if available
            knowledge_graph = results.get("knowledge_graph", {})
            if knowledge_graph:
                kg_title = knowledge_graph.get("title", "")
                if kg_title:
                    track_info = self._parse_track_info(kg_title, "")
                    if track_info:
                        tracks.insert(0, {
                            "title": track_info.get("title", kg_title),
                            "artist": track_info.get("artist", "Unknown"),
                            "source": "SerpAPI Knowledge Graph",
                            "url": knowledge_graph.get("website", ""),
                            "snippet": knowledge_graph.get("description", "")
                        })
            
            # Enrich tracks with album art from Spotify
            tracks = await self._enrich_tracks_with_album_art(tracks[:limit])
            
            return tracks
            
        except Exception as e:
            print(f"Error fetching trending tracks: {e}")
            return []
    
    async def get_billboard_hot_100(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get Billboard Hot 100 chart - fetches 100 popular tracks from Spotify"""
        tracks = []
        
        # Try to use Spotify API to get popular tracks (Billboard tracks are typically popular on Spotify)
        try:
            from app.services.spotify_service import SpotifyService
            spotify_service = SpotifyService()
            
            # Search for popular tracks using various queries to get 100 tracks
            popular_queries = [
                "year:2024",
                "tag:new",
                "genre:pop",
                "genre:hip-hop",
                "genre:r&b",
                "genre:rock",
                "genre:country",
                "genre:electronic",
                "genre:alternative",
                "genre:indie",
            ]
            
            all_tracks = []
            existing_ids = set()
            
            # Search until we have enough tracks
            for query in popular_queries:
                if len(all_tracks) >= limit:
                    break
                    
                search_results = await spotify_service.search_tracks(query, limit=50, market="US")
                
                for track in search_results:
                    if len(all_tracks) >= limit:
                        break
                    
                    track_id = track.get("id")
                    # Skip if we already have this track
                    if track_id in existing_ids:
                        continue
                    
                    all_tracks.append({
                        "id": track_id,
                        "title": track.get("title", "Unknown"),
                        "artist": track.get("artist", "Unknown Artist"),
                        "position": len(all_tracks) + 1,  # Will be renumbered later
                        "source": "Billboard Hot 100",
                        "url": track.get("url", ""),
                        "preview_url": track.get("preview_url"),
                        "album": track.get("album"),
                        "album_image_url": track.get("album_image_url"),
                        "duration_ms": track.get("duration_ms"),
                        "popularity": track.get("popularity", 0),
                    })
                    existing_ids.add(track_id)
            
            # Sort by popularity (Billboard charts are based on popularity metrics)
            all_tracks.sort(key=lambda x: x.get("popularity", 0), reverse=True)
            
            # Re-number positions 1-100
            for idx, track in enumerate(all_tracks[:limit], 1):
                track["position"] = idx
            
            tracks = all_tracks[:limit]
            
            if tracks:
                print(f"Fetched {len(tracks)} Billboard Hot 100 tracks from Spotify")
                return tracks
        except ImportError:
            print("Spotify service not available for Billboard tracks")
        except Exception as e:
            print(f"Error fetching Billboard tracks from Spotify: {e}")
        
        # Fallback to SerpAPI if Spotify fails
        if not SERPAPI_AVAILABLE or not self.api_key:
            return []
        
        try:
            params = {
                "q": "billboard hot 100 2024",
                "api_key": self.api_key,
                "engine": "google",
                "gl": "us",
                "hl": "en"
            }
            
            search = GoogleSearch(params)
            results = search.get_dict()
            
            tracks = []
            organic_results = results.get("organic_results", [])
            
            for result in organic_results[:20]:
                title = result.get("title", "")
                snippet = result.get("snippet", "")
                
                # Parse Billboard chart format
                track_info = self._parse_billboard_entry(title, snippet)
                if track_info:
                    tracks.append({
                        "title": track_info.get("title"),
                        "artist": track_info.get("artist"),
                        "position": track_info.get("position"),
                        "source": "Billboard Hot 100",
                        "url": result.get("link", "")
                    })
            
            # Enrich tracks with album art from Spotify
            tracks = await self._enrich_tracks_with_album_art(tracks)
            
            return tracks
            
        except Exception as e:
            print(f"Error fetching Billboard chart: {e}")
            return []
    
    async def _enrich_tracks_with_album_art(self, tracks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Enrich tracks with album art from Spotify API"""
        try:
            from app.services.spotify_service import SpotifyService
            spotify_service = SpotifyService()
            
            enriched_tracks = []
            for track in tracks:
                # Skip if already has album art
                if track.get("album_image_url"):
                    enriched_tracks.append(track)
                    continue
                
                # Try to search for the track on Spotify to get album art
                try:
                    query = f"{track.get('artist', '')} {track.get('title', '')}"
                    search_results = await spotify_service.search_tracks(query, limit=1)
                    
                    if search_results and len(search_results) > 0:
                        spotify_track = search_results[0]
                        # Enrich with all available data
                        if spotify_track.get("album_image_url"):
                            track["album_image_url"] = spotify_track.get("album_image_url")
                        if spotify_track.get("album"):
                            track["album"] = spotify_track.get("album")
                        if spotify_track.get("id"):
                            track["id"] = spotify_track.get("id")
                        if spotify_track.get("url"):
                            track["url"] = spotify_track.get("url")
                        if spotify_track.get("preview_url"):
                            track["preview_url"] = spotify_track.get("preview_url")
                except Exception as e:
                    # If search fails, keep the track without album art
                    pass
                
                enriched_tracks.append(track)
            
            return enriched_tracks
        except ImportError:
            # Spotify service not available, return tracks as-is
            return tracks
        except Exception as e:
            print(f"Error enriching tracks with album art: {e}")
            return tracks
    
    async def get_spotify_top_charts(self) -> List[Dict[str, Any]]:
        """Get Spotify top charts using Spotify Web API"""
        try:
            # Try Spotify API first
            try:
                from app.services.spotify_service import SpotifyService
                spotify_service = SpotifyService()
                tracks = await spotify_service.get_top_global_playlist(limit=50)
                if tracks:
                    return tracks
            except ImportError:
                pass
            except Exception as e:
                print(f"Spotify API error: {e}")
            
            # Fallback to SerpAPI if available
            if SERPAPI_AVAILABLE and self.api_key:
                try:
                    params = {
                        "q": "spotify top 50 global 2024",
                        "api_key": self.api_key,
                        "engine": "google",
                        "gl": "us",
                        "hl": "en"
                    }
                    
                    search = GoogleSearch(params)
                    results = search.get_dict()
                    
                    tracks = []
                    organic_results = results.get("organic_results", [])
                    
                    for result in organic_results[:20]:
                        title = result.get("title", "")
                        snippet = result.get("snippet", "")
                        
                        track_info = self._parse_track_info(title, snippet)
                        if track_info:
                            tracks.append({
                                "title": track_info.get("title"),
                                "artist": track_info.get("artist"),
                                "source": "Spotify Top Charts",
                                "url": result.get("link", "")
                            })
                    
                    # Enrich tracks with album art from Spotify
                    if tracks:
                        tracks = await self._enrich_tracks_with_album_art(tracks)
                    
                    return tracks
                except Exception as e:
                    print(f"Error fetching Spotify charts via SerpAPI: {e}")
            
            return []
            
        except Exception as e:
            print(f"Error fetching Spotify charts: {e}")
            return []
    
    def search_track_info(self, track_name: str, artist_name: Optional[str] = None) -> Dict[str, Any]:
        """Search for detailed information about a specific track"""
        if not SERPAPI_AVAILABLE or not self.api_key:
            return {
                "title": track_name,
                "artist": artist_name or "Unknown",
                "source": "SerpAPI Search (not available)"
            }
        
        try:
            query = f"{artist_name} {track_name}" if artist_name else track_name
            
            params = {
                "q": query,
                "api_key": self.api_key,
                "engine": "google",
                "gl": "us",
                "hl": "en"
            }
            
            search = GoogleSearch(params)
            results = search.get_dict()
            
            knowledge_graph = results.get("knowledge_graph", {})
            
            track_data = {
                "title": track_name,
                "artist": artist_name or "Unknown",
                "source": "SerpAPI Search"
            }
            
            if knowledge_graph:
                track_data.update({
                    "description": knowledge_graph.get("description", ""),
                    "url": knowledge_graph.get("website", ""),
                    "type": knowledge_graph.get("type", "")
                })
            
            return track_data
            
        except Exception as e:
            print(f"Error searching track info: {e}")
            return {
                "title": track_name,
                "artist": artist_name or "Unknown",
                "source": "SerpAPI Search"
            }
    
    def _parse_track_info(self, title: str, snippet: str) -> Optional[Dict[str, Any]]:
        """Parse track title and artist from search result"""
        # Common patterns: "Artist - Title", "Title by Artist", "Artist: Title"
        patterns = [
            r"(.+?)\s*-\s*(.+)",  # Artist - Title
            r"(.+?)\s+by\s+(.+)",  # Title by Artist
            r"(.+?):\s*(.+)",      # Artist: Title
        ]
        
        for pattern in patterns:
            match = re.search(pattern, title, re.IGNORECASE)
            if match:
                return {
                    "artist": match.group(1).strip(),
                    "title": match.group(2).strip()
                }
        
        # If no pattern matches, try to extract from snippet
        if snippet:
            for pattern in patterns:
                match = re.search(pattern, snippet, re.IGNORECASE)
                if match:
                    return {
                        "artist": match.group(1).strip(),
                        "title": match.group(2).strip()
                    }
        
        # Fallback: use title as track name
        if title and len(title) > 3:
            return {
                "title": title,
                "artist": "Unknown"
            }
        
        return None
    
    def _parse_billboard_entry(self, title: str, snippet: str) -> Optional[Dict[str, Any]]:
        """Parse Billboard chart entry"""
        # Billboard format: "#1 Song Title - Artist" or "Song Title by Artist - #1"
        patterns = [
            r"#(\d+)\s*(.+?)\s*-\s*(.+)",  # #1 Title - Artist
            r"(.+?)\s+by\s+(.+?)\s*-\s*#(\d+)",  # Title by Artist - #1
            r"#(\d+)\s*(.+)",  # #1 Title (artist in snippet)
        ]
        
        for pattern in patterns:
            match = re.search(pattern, title, re.IGNORECASE)
            if match:
                groups = match.groups()
                if len(groups) == 3:
                    return {
                        "position": int(groups[0]),
                        "title": groups[1].strip(),
                        "artist": groups[2].strip()
                    }
                elif len(groups) == 2:
                    # Try to get artist from snippet
                    artist_match = re.search(r"by\s+(.+?)(?:\.|,|$)", snippet, re.IGNORECASE)
                    artist = artist_match.group(1).strip() if artist_match else "Unknown"
                    return {
                        "position": int(groups[0]),
                        "title": groups[1].strip(),
                        "artist": artist
                    }
        
        return None

