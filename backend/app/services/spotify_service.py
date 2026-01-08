"""
Spotify API Service for DJ Arsenal
Fetches real trending tracks from Spotify
"""

import os
import base64
import httpx
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import time

load_dotenv()

class SpotifyService:
    """Service to fetch trending tracks from Spotify Web API"""
    
    def __init__(self):
        self.client_id = os.getenv("SPOTIFY_CLIENT_ID")
        self.client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
        self.access_token = None
        self.token_expires_at = 0
        self.base_url = "https://api.spotify.com/v1"
    
    async def _get_access_token(self) -> Optional[str]:
        """Get Spotify access token using Client Credentials flow"""
        # Return cached token if still valid
        if self.access_token and time.time() < self.token_expires_at:
            return self.access_token
        
        if not self.client_id or not self.client_secret:
            print("Warning: SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET not found in environment variables")
            return None
        
        try:
            # Prepare credentials
            credentials = f"{self.client_id}:{self.client_secret}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            
            # Request token
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://accounts.spotify.com/api/token",
                    headers={
                        "Authorization": f"Basic {encoded_credentials}",
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    data={"grant_type": "client_credentials"}
                )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data["access_token"]
                # Set expiration (usually 3600 seconds, subtract 60 for safety)
                expires_in = data.get("expires_in", 3600)
                self.token_expires_at = time.time() + expires_in - 60
                return self.access_token
            else:
                print(f"Error getting Spotify token: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"Error getting Spotify access token: {e}")
            return None
    
    async def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Optional[Dict]:
        """Make authenticated request to Spotify API"""
        token = await self._get_access_token()
        if not token:
            return None
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}{endpoint}",
                    headers={"Authorization": f"Bearer {token}"},
                    params=params
                )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Spotify API error: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"Error making Spotify request: {e}")
            return None
    
    async def get_top_global_playlist(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get tracks from Spotify's Top 50 Global playlist
        Uses search with popular queries as fallback if playlist access fails
        """
        tracks = []
        
        # Try multiple playlist IDs (Top 50 Global, Top 50 USA, Today's Top Hits)
        playlist_ids = [
            "37i9dQZEVXbMDoHDwVN2tF",  # Top 50 Global
            "37i9dQZEVXbLRQDuF5jeBp",  # Top 50 USA
            "37i9dQZF1DXcBWIGoYBM5M",  # Today's Top Hits
        ]
        
        for playlist_id in playlist_ids:
            try:
                # Request up to 50 tracks (max per request)
                data = await self._make_request(f"/playlists/{playlist_id}/tracks", {
                    "limit": min(limit, 50),  # Spotify API max is 50 per request
                    "market": "US"
                })
                
                if data and data.get("items"):
                    items = data.get("items", [])
                    for idx, item in enumerate(items[:limit], 1):
                        # Handle both direct track and nested track structures
                        track_data = item.get("track") or item
                        if not track_data:
                            continue
                        
                        # Skip if it's not a track (could be episode, etc.)
                        if isinstance(track_data, dict) and track_data.get("type") != "track":
                            continue
                        
                        # Get artist names
                        artists = track_data.get("artists", [])
                        artist_names = ", ".join([artist.get("name", "") for artist in artists]) if artists else "Unknown Artist"
                        
                        # Get external URL
                        external_urls = track_data.get("external_urls", {})
                        spotify_url = external_urls.get("spotify", "")
                        
                        # Get album images
                        album_data = track_data.get("album", {})
                        album_images = album_data.get("images", []) if isinstance(album_data, dict) else []
                        # Get the best quality image (prefer 300-640px for good quality/size balance)
                        album_image_url = None
                        if album_images:
                            # Prefer images between 300-640px (good balance of quality and size)
                            medium_image = next((img for img in album_images if img.get("width", 0) >= 300 and img.get("width", 0) <= 640), None)
                            if not medium_image:
                                # Fallback to largest available image
                                medium_image = max(album_images, key=lambda x: x.get("width", 0), default=None) if album_images else None
                            if medium_image:
                                album_image_url = medium_image.get("url")
                        
                        preview_url = track_data.get("preview_url")  # May be None
                        # Include ALL tracks, not just those with preview URLs
                        tracks.append({
                            "id": track_data.get("id"),
                            "title": track_data.get("name", "Unknown"),
                            "artist": artist_names,
                            "position": len(tracks) + 1,  # Use current length + 1 for position
                            "source": "Spotify Top Charts",
                            "url": spotify_url,
                            "preview_url": preview_url,  # Can be None - will use Spotify SDK for playback
                            "album": album_data.get("name") if isinstance(album_data, dict) else None,
                            "album_image_url": album_image_url,
                            "duration_ms": track_data.get("duration_ms"),
                            "popularity": track_data.get("popularity"),
                        })
                    
                    # If we got enough tracks, return them
                    if len(tracks) >= limit:
                        return tracks[:limit]
                    # If we got some tracks but not enough, continue to next playlist or fallback
                    if tracks:
                        break
            except Exception as e:
                print(f"Error fetching playlist {playlist_id}: {e}")
                continue
        
        # If we got tracks from playlist(s), return them (even if less than limit)
        if tracks:
            # Re-number positions
            for idx, track in enumerate(tracks[:limit], 1):
                track["position"] = idx
            return tracks[:limit]
        
        # Fallback: Search for popular tracks by searching for trending terms
        # This is a workaround if playlist access is restricted
        print(f"Playlist returned {len(tracks)} tracks, trying fallback search to get {limit} total...")
        popular_queries = [
            "year:2024",
            "tag:new",
            "genre:pop",
            "genre:hip-hop",
            "genre:electronic",
            "genre:rock",
            "genre:r&b",
        ]
        
        all_tracks = tracks.copy()  # Start with any tracks we got from playlists
        existing_ids = {t.get("id") for t in all_tracks if t.get("id")}
        
        # Search until we have enough tracks
        for query in popular_queries:
            if len(all_tracks) >= limit:
                break
                
            search_data = await self._make_request("/search", {
                "q": query,
                "type": "track",
                "limit": 50,  # Get max per request
                "market": "US"
            })
            
            if search_data:
                items = search_data.get("tracks", {}).get("items", [])
                for item in items:
                    if len(all_tracks) >= limit:
                        break
                    
                    track_id = item.get("id")
                    # Skip if we already have this track
                    if track_id in existing_ids:
                        continue
                    
                    artists = item.get("artists", [])
                    artist_names = ", ".join([artist.get("name", "") for artist in artists]) if artists else "Unknown Artist"
                    
                    # Include ALL tracks, not just those with preview URLs
                    preview_url = item.get("preview_url")  # May be None
                    
                    # Get album images - prefer larger/higher quality images
                    album_data = item.get("album", {})
                    album_images = album_data.get("images", []) if isinstance(album_data, dict) else []
                    album_image_url = None
                    if album_images:
                        # Prefer images between 300-640px (good balance of quality and size)
                        medium_image = next((img for img in album_images if img.get("width", 0) >= 300 and img.get("width", 0) <= 640), None)
                        if not medium_image:
                            # Fallback to largest available image
                            medium_image = max(album_images, key=lambda x: x.get("width", 0), default=None) if album_images else None
                        if medium_image:
                            album_image_url = medium_image.get("url")
                    
                    all_tracks.append({
                        "id": track_id,
                        "title": item.get("name", "Unknown"),
                        "artist": artist_names,
                        "source": "Spotify Top Charts",
                        "url": item.get("external_urls", {}).get("spotify", ""),
                        "preview_url": preview_url,  # Can be None - will use Spotify SDK for playback
                        "album": album_data.get("name") if isinstance(album_data, dict) else None,
                        "album_image_url": album_image_url,
                        "duration_ms": item.get("duration_ms"),
                        "popularity": item.get("popularity", 0),
                    })
                    existing_ids.add(track_id)
        
        # Sort by popularity and add position
        if all_tracks:
            all_tracks.sort(key=lambda x: x.get("popularity", 0), reverse=True)
            for idx, track in enumerate(all_tracks[:limit], 1):
                track["position"] = idx
            print(f"Fallback search returned {len(all_tracks[:limit])} tracks total")
            return all_tracks[:limit]
        
        print("No tracks found from playlist or fallback search")
        return []
    
    async def get_new_releases(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get new releases from Spotify"""
        tracks = []
        
        data = await self._make_request("/browse/new-releases", {"limit": limit})
        
        if not data:
            return tracks
        
        albums = data.get("albums", {}).get("items", [])
        for album in albums:
            # Get album images
            album_images = album.get("images", [])
            album_image_url = None
            if album_images:
                medium_image = next((img for img in album_images if img.get("width", 0) >= 300 and img.get("width", 0) <= 400), None)
                if not medium_image:
                    medium_image = album_images[0] if album_images else None
                if medium_image:
                    album_image_url = medium_image.get("url")
            
            # Get first track from album
            album_id = album.get("id")
            if album_id:
                album_data = await self._make_request(f"/albums/{album_id}")
                if album_data:
                    tracks_data = album_data.get("tracks", {}).get("items", [])
                    if tracks_data:
                        track = tracks_data[0]
                        artists = album.get("artists", [])
                        artist_names = ", ".join([artist.get("name", "") for artist in artists])
                        
                        tracks.append({
                            "title": track.get("name", "Unknown"),
                            "artist": artist_names or "Unknown Artist",
                            "source": "Spotify New Releases",
                            "url": album.get("external_urls", {}).get("spotify", ""),
                            "album": album.get("name"),
                            "album_image_url": album_image_url,
                        })
        
        return tracks[:limit]
    
    async def search_tracks(self, query: str, limit: int = 20, market: str = "US") -> List[Dict[str, Any]]:
        """Search for tracks on Spotify - returns ALL tracks (with or without preview URLs)"""
        tracks = []
        
        # Search with market parameter
        data = await self._make_request("/search", {
            "q": query,
            "type": "track",
            "limit": limit,
            "market": market
        })
        
        if not data:
            return tracks
        
        items = data.get("tracks", {}).get("items", [])
        for item in items:
            # Include ALL tracks, not just those with preview URLs
            preview_url = item.get("preview_url")  # May be None
                
            artists = item.get("artists", [])
            artist_names = ", ".join([artist.get("name", "") for artist in artists])
            
            # Get album images - prefer larger/higher quality images
            album_data = item.get("album", {})
            album_images = album_data.get("images", []) if isinstance(album_data, dict) else []
            album_image_url = None
            if album_images:
                # Prefer images between 300-640px (good balance of quality and size)
                # Spotify typically provides: 64x64, 300x300, 640x640
                medium_image = next((img for img in album_images if img.get("width", 0) >= 300 and img.get("width", 0) <= 640), None)
                if not medium_image:
                    # Fallback to largest available image
                    medium_image = max(album_images, key=lambda x: x.get("width", 0), default=None) if album_images else None
                if medium_image:
                    album_image_url = medium_image.get("url")
            
            tracks.append({
                "id": item.get("id"),
                "title": item.get("name", "Unknown"),
                "artist": artist_names or "Unknown Artist",
                "source": "Spotify Search",
                "url": item.get("external_urls", {}).get("spotify", ""),
                "preview_url": preview_url,  # Can be None - will use Spotify SDK for playback
                "album": album_data.get("name") if isinstance(album_data, dict) else None,
                "album_image_url": album_image_url,
                "popularity": item.get("popularity"),
                "duration_ms": item.get("duration_ms"),
            })
        
        return tracks
    
    async def get_track_by_id(self, track_id: str, market: str = "US") -> Optional[Dict[str, Any]]:
        """Get a specific track by Spotify ID with preview URL"""
        try:
            data = await self._make_request(f"/tracks/{track_id}", {
                "market": market
            })
            
            if not data:
                return None
            
            artists = data.get("artists", [])
            artist_names = ", ".join([artist.get("name", "") for artist in artists])
            
            # Get album images - prefer larger/higher quality images
            album_data = data.get("album", {})
            album_images = album_data.get("images", []) if isinstance(album_data, dict) else []
            album_image_url = None
            if album_images:
                # Prefer images between 300-640px (good balance of quality and size)
                medium_image = next((img for img in album_images if img.get("width", 0) >= 300 and img.get("width", 0) <= 640), None)
                if not medium_image:
                    # Fallback to largest available image
                    medium_image = max(album_images, key=lambda x: x.get("width", 0), default=None) if album_images else None
                if medium_image:
                    album_image_url = medium_image.get("url")
            
            return {
                "id": data.get("id"),
                "title": data.get("name", "Unknown"),
                "artist": artist_names or "Unknown Artist",
                "source": "Spotify",
                "url": data.get("external_urls", {}).get("spotify", ""),
                "preview_url": data.get("preview_url"),
                "album": album_data.get("name") if isinstance(album_data, dict) else None,
                "album_image_url": album_image_url,
                "popularity": data.get("popularity"),
                "duration_ms": data.get("duration_ms"),
            }
        except Exception as e:
            print(f"Error getting track by ID: {e}")
            return None
    
    async def get_featured_playlists(self, limit: int = 20, market: str = "US") -> List[Dict[str, Any]]:
        """Get featured playlists which typically have tracks with preview URLs"""
        try:
            data = await self._make_request("/browse/featured-playlists", {
                "limit": limit,
                "market": market
            })
            
            if not data:
                return []
            
            playlists = data.get("playlists", {}).get("items", [])
            all_tracks = []
            
            for playlist in playlists[:5]:  # Limit to first 5 playlists
                playlist_id = playlist.get("id")
                if playlist_id:
                    tracks_data = await self._make_request(f"/playlists/{playlist_id}/tracks", {
                        "limit": 10,
                        "market": market
                    })
                    
                    if tracks_data and tracks_data.get("items"):
                        for item in tracks_data.get("items", []):
                            track_data = item.get("track")
                            if not track_data or track_data.get("type") != "track":
                                continue
                            
                            preview_url = track_data.get("preview_url")  # May be None
                            # Include ALL tracks, not just those with preview URLs
                            
                            artists = track_data.get("artists", [])
                            artist_names = ", ".join([a.get("name", "") for a in artists])
                            
                            album_data = track_data.get("album", {})
                            album_images = album_data.get("images", []) if isinstance(album_data, dict) else []
                            album_image_url = None
                            if album_images:
                                # Prefer images between 300-640px (good balance of quality and size)
                                medium_image = next((img for img in album_images if img.get("width", 0) >= 300 and img.get("width", 0) <= 640), None)
                                if not medium_image:
                                    # Fallback to largest available image
                                    medium_image = max(album_images, key=lambda x: x.get("width", 0), default=None) if album_images else None
                                if medium_image:
                                    album_image_url = medium_image.get("url")
                            
                            all_tracks.append({
                                "id": track_data.get("id"),
                                "title": track_data.get("name", "Unknown"),
                                "artist": artist_names,
                                "source": "Spotify Featured",
                                "url": track_data.get("external_urls", {}).get("spotify", ""),
                                "preview_url": preview_url,  # Can be None - will use Spotify SDK for playback
                                "album": album_data.get("name") if isinstance(album_data, dict) else None,
                                "album_image_url": album_image_url,
                                "popularity": track_data.get("popularity"),
                                "duration_ms": track_data.get("duration_ms"),
                            })
                            
                            if len(all_tracks) >= limit:
                                break
                
                if len(all_tracks) >= limit:
                    break
            
            return all_tracks[:limit]
        except Exception as e:
            print(f"Error getting featured playlists: {e}")
            return []
    
    # ============================================
    # Playlist Management Methods
    # ============================================
    
    async def get_user_playlists(self, user_token: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get a list of user's playlists"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/me/playlists",
                    headers={"Authorization": f"Bearer {user_token}"},
                    params={"limit": limit}
                )
            
            if response.status_code == 200:
                data = response.json()
                playlists = []
                for item in data.get("items", []):
                    playlists.append({
                        "id": item.get("id"),
                        "name": item.get("name"),
                        "description": item.get("description"),
                        "public": item.get("public", False),
                        "collaborative": item.get("collaborative", False),
                        "owner": item.get("owner", {}).get("display_name"),
                        "tracks_count": item.get("tracks", {}).get("total", 0),
                        "images": item.get("images", []),
                        "external_urls": item.get("external_urls", {}),
                        "snapshot_id": item.get("snapshot_id")
                    })
                return playlists
            else:
                print(f"Error getting playlists: {response.status_code} - {response.text}")
                return []
        except Exception as e:
            print(f"Error getting user playlists: {e}")
            return []
    
    async def get_playlist(self, playlist_id: str, user_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get a specific playlist by ID"""
        token = user_token or await self._get_access_token()
        if not token:
            return None
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/playlists/{playlist_id}",
                    headers={"Authorization": f"Bearer {token}"}
                )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "id": data.get("id"),
                    "name": data.get("name"),
                    "description": data.get("description"),
                    "public": data.get("public", False),
                    "collaborative": data.get("collaborative", False),
                    "owner": data.get("owner", {}).get("display_name"),
                    "tracks_count": data.get("tracks", {}).get("total", 0),
                    "images": data.get("images", []),
                    "external_urls": data.get("external_urls", {}),
                    "snapshot_id": data.get("snapshot_id"),
                    "followers": data.get("followers", {}).get("total", 0)
                }
            else:
                print(f"Error getting playlist: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"Error getting playlist: {e}")
            return None
    
    async def get_playlist_items(self, playlist_id: str, user_token: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Get tracks/episodes from a playlist"""
        token = user_token or await self._get_access_token()
        if not token:
            return []
        
        try:
            all_items = []
            offset = 0
            
            while len(all_items) < limit:
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        f"{self.base_url}/playlists/{playlist_id}/tracks",
                        headers={"Authorization": f"Bearer {token}"},
                        params={
                            "limit": min(100, limit - len(all_items)),
                            "offset": offset,
                            "additional_types": "track,episode"
                        }
                    )
                
                if response.status_code == 200:
                    data = response.json()
                    items = data.get("items", [])
                    if not items:
                        break
                    
                    for item in items:
                        track_data = item.get("track")
                        if not track_data or track_data.get("type") != "track":
                            continue
                        
                        # Handle local files
                        is_local = item.get("is_local", False)
                        
                        artists = track_data.get("artists", [])
                        artist_names = ", ".join([a.get("name", "") for a in artists])
                        
                        # Get album images
                        album_data = track_data.get("album", {})
                        album_images = album_data.get("images", []) if isinstance(album_data, dict) else []
                        album_image_url = None
                        if album_images:
                            medium_image = next((img for img in album_images if img.get("width", 0) >= 300 and img.get("width", 0) <= 400), None)
                            if not medium_image:
                                medium_image = album_images[0] if album_images else None
                            if medium_image:
                                album_image_url = medium_image.get("url")
                        
                        all_items.append({
                            "added_at": item.get("added_at"),
                            "added_by": item.get("added_by", {}).get("display_name"),
                            "is_local": is_local,
                            "track": {
                                "id": track_data.get("id"),
                                "name": track_data.get("name"),
                                "artist": artist_names,
                                "artists": [{"name": a.get("name"), "id": a.get("id")} for a in artists],
                                "album": album_data.get("name") if isinstance(album_data, dict) else None,
                                "album_image_url": album_image_url,
                                "duration_ms": track_data.get("duration_ms"),
                                "popularity": track_data.get("popularity"),
                                "preview_url": track_data.get("preview_url"),
                                "external_urls": track_data.get("external_urls", {}),
                                "uri": track_data.get("uri")
                            }
                        })
                    
                    offset += len(items)
                    if len(items) < 100:
                        break
                else:
                    print(f"Error getting playlist items: {response.status_code} - {response.text}")
                    break
            
            return all_items[:limit]
        except Exception as e:
            print(f"Error getting playlist items: {e}")
            return []
    
    async def create_playlist(
        self, 
        user_id: str, 
        user_token: str,
        name: str,
        description: Optional[str] = None,
        public: bool = True,
        collaborative: bool = False
    ) -> Optional[Dict[str, Any]]:
        """Create a new playlist"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/users/{user_id}/playlists",
                    headers={
                        "Authorization": f"Bearer {user_token}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "name": name,
                        "description": description or "",
                        "public": public,
                        "collaborative": collaborative
                    }
                )
            
            if response.status_code == 201:
                data = response.json()
                return {
                    "id": data.get("id"),
                    "name": data.get("name"),
                    "description": data.get("description"),
                    "public": data.get("public"),
                    "collaborative": data.get("collaborative"),
                    "snapshot_id": data.get("snapshot_id"),
                    "external_urls": data.get("external_urls", {})
                }
            else:
                print(f"Error creating playlist: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"Error creating playlist: {e}")
            return None
    
    async def add_tracks_to_playlist(
        self,
        playlist_id: str,
        user_token: str,
        track_uris: List[str],
        position: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        """Add tracks to a playlist"""
        try:
            payload = {"uris": track_uris}
            if position is not None:
                payload["position"] = position
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/playlists/{playlist_id}/tracks",
                    headers={
                        "Authorization": f"Bearer {user_token}",
                        "Content-Type": "application/json"
                    },
                    json=payload
                )
            
            if response.status_code == 201:
                return response.json()
            else:
                print(f"Error adding tracks: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"Error adding tracks to playlist: {e}")
            return None
    
    async def remove_tracks_from_playlist(
        self,
        playlist_id: str,
        user_token: str,
        track_uris: List[str],
        snapshot_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Remove tracks from a playlist"""
        try:
            # For local files, use positions instead of URIs
            tracks = [{"uri": uri} for uri in track_uris]
            
            payload = {"tracks": tracks}
            if snapshot_id:
                payload["snapshot_id"] = snapshot_id
            
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.base_url}/playlists/{playlist_id}/tracks",
                    headers={
                        "Authorization": f"Bearer {user_token}",
                        "Content-Type": "application/json"
                    },
                    json=payload
                )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error removing tracks: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"Error removing tracks from playlist: {e}")
            return None
    
    async def reorder_playlist_items(
        self,
        playlist_id: str,
        user_token: str,
        range_start: int,
        insert_before: int,
        range_length: int = 1,
        snapshot_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Reorder tracks in a playlist"""
        try:
            payload = {
                "range_start": range_start,
                "insert_before": insert_before,
                "range_length": range_length
            }
            if snapshot_id:
                payload["snapshot_id"] = snapshot_id
            
            async with httpx.AsyncClient() as client:
                response = await client.put(
                    f"{self.base_url}/playlists/{playlist_id}/tracks",
                    headers={
                        "Authorization": f"Bearer {user_token}",
                        "Content-Type": "application/json"
                    },
                    json=payload
                )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error reordering tracks: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"Error reordering playlist: {e}")
            return None
    
    async def follow_playlist(self, playlist_id: str, user_token: str, public: bool = True) -> bool:
        """Follow a playlist"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.put(
                    f"{self.base_url}/playlists/{playlist_id}/followers",
                    headers={
                        "Authorization": f"Bearer {user_token}",
                        "Content-Type": "application/json"
                    },
                    json={"public": public}
                )
            
            return response.status_code == 200
        except Exception as e:
            print(f"Error following playlist: {e}")
            return False
    
    async def unfollow_playlist(self, playlist_id: str, user_token: str) -> bool:
        """Unfollow a playlist"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.base_url}/playlists/{playlist_id}/followers",
                    headers={"Authorization": f"Bearer {user_token}"}
                )
            
            return response.status_code == 200
        except Exception as e:
            print(f"Error unfollowing playlist: {e}")
            return False
    
    async def update_playlist(
        self,
        playlist_id: str,
        user_token: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        public: Optional[bool] = None,
        collaborative: Optional[bool] = None
    ) -> bool:
        """Update playlist details"""
        try:
            payload = {}
            if name is not None:
                payload["name"] = name
            if description is not None:
                payload["description"] = description
            if public is not None:
                payload["public"] = public
            if collaborative is not None:
                payload["collaborative"] = collaborative
            
            async with httpx.AsyncClient() as client:
                response = await client.put(
                    f"{self.base_url}/playlists/{playlist_id}",
                    headers={
                        "Authorization": f"Bearer {user_token}",
                        "Content-Type": "application/json"
                    },
                    json=payload
                )
            
            return response.status_code == 200
        except Exception as e:
            print(f"Error updating playlist: {e}")
            return False
    
    async def get_current_user(self, user_token: str) -> Optional[Dict[str, Any]]:
        """Get current user profile"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/me",
                    headers={"Authorization": f"Bearer {user_token}"}
                )
            
            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            print(f"Error getting user profile: {e}")
            return None
