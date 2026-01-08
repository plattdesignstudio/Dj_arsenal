from fastapi import APIRouter, HTTPException, Header, Depends, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv

from app.services.spotify_service import SpotifyService

load_dotenv()

router = APIRouter()

SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

class PlaylistCreate(BaseModel):
    name: str
    description: Optional[str] = None
    public: bool = True
    collaborative: bool = False

class PlaylistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    public: Optional[bool] = None
    collaborative: Optional[bool] = None

class AddTracksRequest(BaseModel):
    track_uris: List[str]
    position: Optional[int] = None

class RemoveTracksRequest(BaseModel):
    track_uris: List[str]
    snapshot_id: Optional[str] = None

class ReorderRequest(BaseModel):
    range_start: int
    insert_before: int
    range_length: int = 1
    snapshot_id: Optional[str] = None

def get_user_token(authorization: Optional[str] = Header(None)) -> str:
    """Extract user token from Authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization token")
    return authorization.replace("Bearer ", "")

@router.get("/me/playlists")
async def get_user_playlists(
    limit: int = 50,
    token: str = Depends(get_user_token)
):
    """Get current user's playlists"""
    service = SpotifyService()
    playlists = await service.get_user_playlists(token, limit)
    return {"playlists": playlists, "count": len(playlists)}

@router.get("/playlists/{playlist_id}")
async def get_playlist(
    playlist_id: str,
    authorization: Optional[str] = Header(None)
):
    """Get a specific playlist"""
    service = SpotifyService()
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
    
    playlist = await service.get_playlist(playlist_id, token)
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return playlist

@router.get("/playlists/{playlist_id}/tracks")
async def get_playlist_tracks(
    playlist_id: str,
    limit: int = 100,
    authorization: Optional[str] = Header(None)
):
    """Get tracks from a playlist"""
    service = SpotifyService()
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
    
    tracks = await service.get_playlist_items(playlist_id, token, limit)
    return {"tracks": tracks, "count": len(tracks)}

@router.get("/playlists")
async def get_playlists(
    authorization: Optional[str] = Header(None),
    refresh_token: Optional[str] = Query(None, description="Refresh token for token refresh on 401")
):
    """
    Get current user's playlists with pagination.
    Requires OAuth scopes: playlist-read-private, playlist-read-collaborative
    """
    # Extract access token from Authorization header
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization token")
    
    access_token = authorization.replace("Bearer ", "")
    
    try:
        all_playlists = []
        next_url = "https://api.spotify.com/v1/me/playlists"
        current_refresh_token = refresh_token  # Keep track of refresh token (it may be updated)
        
        while next_url:
            # Per-request retry flag
            request_retried = False
            
            while True:  # Loop for retry on 401
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        next_url,
                        headers={
                            "Authorization": f"Bearer {access_token}",
                            "Content-Type": "application/json"
                        },
                        params={"limit": 50} if next_url == "https://api.spotify.com/v1/me/playlists" else None
                    )
                
                if response.status_code == 200:
                    data = response.json()
                    items = data.get("items", [])
                    
                    # Normalize playlist items
                    for item in items:
                        images = item.get("images", [])
                        image_url = images[0].get("url") if images and len(images) > 0 else None
                        owner = item.get("owner", {})
                        tracks = item.get("tracks", {})
                        
                        normalized_playlist = {
                            "id": item.get("id"),
                            "name": item.get("name"),
                            "imageUrl": image_url,
                            "ownerId": owner.get("id") if isinstance(owner, dict) else None,
                            "tracksTotal": tracks.get("total", 0) if isinstance(tracks, dict) else 0,
                            "uri": item.get("uri"),
                            "href": item.get("href")
                        }
                        all_playlists.append(normalized_playlist)
                    
                    # Check for next page
                    next_url = data.get("next")
                    break  # Success, exit retry loop
                    
                elif response.status_code == 401:
                    # Token expired, try to refresh and retry once
                    if current_refresh_token and not request_retried:
                        try:
                            # Refresh the token
                            async with httpx.AsyncClient() as refresh_client:
                                refresh_response = await refresh_client.post(
                                    "https://accounts.spotify.com/api/token",
                                    data={
                                        "grant_type": "refresh_token",
                                        "refresh_token": current_refresh_token,
                                        "client_id": SPOTIFY_CLIENT_ID,
                                        "client_secret": SPOTIFY_CLIENT_SECRET
                                    },
                                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                                )
                            
                            if refresh_response.status_code == 200:
                                refresh_data = refresh_response.json()
                                access_token = refresh_data.get("access_token")
                                # Update refresh token if provided (Spotify may return a new one)
                                if refresh_data.get("refresh_token"):
                                    current_refresh_token = refresh_data.get("refresh_token")
                                request_retried = True
                                # Continue inner loop to retry request with new token
                                continue
                            else:
                                raise HTTPException(
                                    status_code=401,
                                    detail=f"Failed to refresh token: {refresh_response.text}"
                                )
                        except HTTPException:
                            raise
                        except Exception as e:
                            raise HTTPException(
                                status_code=401,
                                detail=f"Error refreshing token: {str(e)}"
                            )
                    else:
                        raise HTTPException(
                            status_code=401,
                            detail="Invalid or expired access token. Refresh token not provided or refresh failed."
                        )
                else:
                    # Other error status codes
                    error_detail = f"Spotify API error: {response.status_code}"
                    try:
                        error_data = response.json()
                        if "error" in error_data:
                            error_detail = error_data["error"].get("message", error_detail)
                    except:
                        error_detail = f"{error_detail} - {response.text}"
                    
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=error_detail
                    )
        
        return all_playlists
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching playlists: {str(e)}"
        )

@router.post("/playlists")
async def create_playlist(
    playlist_data: PlaylistCreate,
    token: str = Depends(get_user_token)
):
    """Create a new playlist"""
    service = SpotifyService()
    user = await service.get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid user token")
    
    playlist = await service.create_playlist(
        user_id=user.get("id"),
        user_token=token,
        name=playlist_data.name,
        description=playlist_data.description,
        public=playlist_data.public,
        collaborative=playlist_data.collaborative
    )
    
    if not playlist:
        raise HTTPException(status_code=500, detail="Failed to create playlist")
    
    return playlist

@router.put("/playlists/{playlist_id}")
async def update_playlist(
    playlist_id: str,
    update_data: PlaylistUpdate,
    token: str = Depends(get_user_token)
):
    """Update playlist details"""
    service = SpotifyService()
    success = await service.update_playlist(
        playlist_id=playlist_id,
        user_token=token,
        name=update_data.name,
        description=update_data.description,
        public=update_data.public,
        collaborative=update_data.collaborative
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update playlist")
    
    return {"success": True, "message": "Playlist updated"}

@router.post("/playlists/{playlist_id}/tracks")
async def add_tracks(
    playlist_id: str,
    request: AddTracksRequest,
    token: str = Depends(get_user_token)
):
    """Add tracks to a playlist"""
    service = SpotifyService()
    result = await service.add_tracks_to_playlist(
        playlist_id=playlist_id,
        user_token=token,
        track_uris=request.track_uris,
        position=request.position
    )
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to add tracks")
    
    return result

@router.delete("/playlists/{playlist_id}/tracks")
async def remove_tracks(
    playlist_id: str,
    request: RemoveTracksRequest,
    token: str = Depends(get_user_token)
):
    """Remove tracks from a playlist"""
    service = SpotifyService()
    result = await service.remove_tracks_from_playlist(
        playlist_id=playlist_id,
        user_token=token,
        track_uris=request.track_uris,
        snapshot_id=request.snapshot_id
    )
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to remove tracks")
    
    return result

@router.put("/playlists/{playlist_id}/tracks")
async def reorder_tracks(
    playlist_id: str,
    request: ReorderRequest,
    token: str = Depends(get_user_token)
):
    """Reorder tracks in a playlist"""
    service = SpotifyService()
    result = await service.reorder_playlist_items(
        playlist_id=playlist_id,
        user_token=token,
        range_start=request.range_start,
        insert_before=request.insert_before,
        range_length=request.range_length,
        snapshot_id=request.snapshot_id
    )
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to reorder tracks")
    
    return result

@router.put("/playlists/{playlist_id}/follow")
async def follow_playlist(
    playlist_id: str,
    public: bool = True,
    token: str = Depends(get_user_token)
):
    """Follow a playlist"""
    service = SpotifyService()
    success = await service.follow_playlist(playlist_id, token, public)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to follow playlist")
    
    return {"success": True, "message": "Playlist followed"}

@router.delete("/playlists/{playlist_id}/follow")
async def unfollow_playlist(
    playlist_id: str,
    token: str = Depends(get_user_token)
):
    """Unfollow a playlist"""
    service = SpotifyService()
    success = await service.unfollow_playlist(playlist_id, token)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to unfollow playlist")
    
    return {"success": True, "message": "Playlist unfollowed"}

