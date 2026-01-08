from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
import httpx
import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI", "http://localhost:3000/api/auth/spotify/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Required scopes for playlist management and full playback
SCOPES = [
    "playlist-read-private",
    "playlist-read-collaborative",
    "playlist-modify-public",
    "playlist-modify-private",
    "user-read-private",
    "user-read-email",
    "streaming",  # Required for Web Playback SDK
    "user-read-playback-state",
    "user-modify-playback-state",
]

@router.get("/auth/spotify")
async def spotify_login():
    """Initiate Spotify OAuth flow"""
    if not SPOTIFY_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Spotify client ID not configured")
    
    from urllib.parse import quote_plus
    # URL encode the redirect URI to ensure it's properly formatted
    encoded_redirect_uri = quote_plus(REDIRECT_URI)
    encoded_scopes = quote_plus(' '.join(SCOPES))
    
    auth_url = (
        "https://accounts.spotify.com/authorize?"
        f"client_id={SPOTIFY_CLIENT_ID}&"
        f"response_type=code&"
        f"redirect_uri={encoded_redirect_uri}&"
        f"scope={encoded_scopes}"
    )
    
    return RedirectResponse(url=auth_url)

@router.get("/auth/spotify/callback")
async def spotify_callback(code: Optional[str] = Query(None), error: Optional[str] = Query(None)):
    """Handle Spotify OAuth callback"""
    if error:
        # Redirect to frontend with error
        from urllib.parse import urlencode
        redirect_url = f"{FRONTEND_URL}/trending?{urlencode({'error': error})}"
        return RedirectResponse(url=redirect_url)
    
    if not code:
        from urllib.parse import urlencode
        redirect_url = f"{FRONTEND_URL}/trending?{urlencode({'error': 'no_code'})}"
        return RedirectResponse(url=redirect_url)
    
    if not SPOTIFY_CLIENT_ID or not SPOTIFY_CLIENT_SECRET:
        from urllib.parse import urlencode
        redirect_url = f"{FRONTEND_URL}/trending?{urlencode({'error': 'config_error'})}"
        return RedirectResponse(url=redirect_url)
    
    try:
        # Exchange code for token
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://accounts.spotify.com/api/token",
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": REDIRECT_URI,
                    "client_id": SPOTIFY_CLIENT_ID,
                    "client_secret": SPOTIFY_CLIENT_SECRET
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
        
        if response.status_code == 200:
            data = response.json()
            # Redirect to frontend with tokens in URL (for development)
            # In production, use secure session storage or HTTP-only cookies
            from urllib.parse import urlencode
            token_params = {
                'access_token': data.get("access_token"),
                'refresh_token': data.get("refresh_token"),
                'expires_in': data.get("expires_in"),
            }
            redirect_url = f"{FRONTEND_URL}/trending?{urlencode(token_params)}"
            return RedirectResponse(url=redirect_url)
        else:
            from urllib.parse import urlencode
            redirect_url = f"{FRONTEND_URL}/trending?{urlencode({'error': 'token_exchange_failed'})}"
            return RedirectResponse(url=redirect_url)
    except Exception as e:
        from urllib.parse import urlencode
        redirect_url = f"{FRONTEND_URL}/trending?{urlencode({'error': 'server_error'})}"
        return RedirectResponse(url=redirect_url)

@router.post("/auth/spotify/refresh")
async def refresh_token(request: dict):
    """Refresh Spotify access token"""
    refresh_token_value = request.get("refresh_token")
    if not refresh_token_value:
        raise HTTPException(status_code=400, detail="refresh_token is required")
    
    if not SPOTIFY_CLIENT_ID or not SPOTIFY_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Spotify credentials not configured")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://accounts.spotify.com/api/token",
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token_value,
                    "client_id": SPOTIFY_CLIENT_ID,
                    "client_secret": SPOTIFY_CLIENT_SECRET
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to refresh token: {response.text}"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error refreshing token: {str(e)}")

@router.get("/auth/spotify/me")
async def get_user_profile(access_token: str = Query(..., description="Spotify access token")):
    """Get Spotify user profile including Premium status"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.spotify.com/v1/me",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
            )
        
        if response.status_code == 200:
            user_data = response.json()
            # Check Premium status
            product = user_data.get("product", "free")  # 'premium', 'free', 'open', 'unlimited'
            is_premium = product == "premium"
            
            return {
                "id": user_data.get("id"),
                "display_name": user_data.get("display_name"),
                "email": user_data.get("email"),
                "product": product,
                "is_premium": is_premium,
                "country": user_data.get("country"),
                "images": user_data.get("images", []),
            }
        elif response.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid or expired access token")
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to get user profile: {response.text}"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting user profile: {str(e)}")

@router.get("/auth/spotify/check-premium")
async def check_premium_status(access_token: str = Query(..., description="Spotify access token")):
    """Quick check if user has Spotify Premium"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.spotify.com/v1/me",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
            )
        
        if response.status_code == 200:
            user_data = response.json()
            product = user_data.get("product", "free")
            is_premium = product == "premium"
            
            return {
                "is_premium": is_premium,
                "product": product,
                "message": "Premium account" if is_premium else "Free account - Upgrade to Premium for full playback"
            }
        elif response.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid or expired access token")
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to check Premium status: {response.text}"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking Premium status: {str(e)}")

