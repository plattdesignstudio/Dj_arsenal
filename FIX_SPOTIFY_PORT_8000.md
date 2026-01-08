# Fix Spotify Redirect URI - Port 8000 Issue

## Problem

The redirect URI is set to `http://localhost:8000/api/auth/spotify/callback` (backend port), which is causing a 400 Bad Request error from Spotify.

## Solution

The redirect URI should point to your **backend** endpoint (port 8000), and this exact URI must be registered in your Spotify Developer Dashboard.

### Step 1: Add Redirect URI to Spotify Developer Dashboard

1. Go to: https://developer.spotify.com/dashboard
2. Click on your app
3. Click "Edit Settings"
4. Under "Redirect URIs", add **EXACTLY** this URI:
   ```
   http://localhost:8000/api/auth/spotify/callback
   ```
5. Click "Add" and then "Save"

### Step 2: Update Backend .env File (Optional but Recommended)

Create or update `backend/.env` to explicitly set the redirect URI:

```bash
SPOTIFY_REDIRECT_URI=http://localhost:8000/api/auth/spotify/callback
FRONTEND_URL=http://localhost:3000
```

(Adjust FRONTEND_URL to match your actual frontend port: 3000, 3001, or 3002)

### Step 3: Restart Backend

After updating the `.env` file, restart your backend:

```bash
cd backend
# Stop the server (Ctrl+C) if running
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Important Notes

- The redirect URI points to the **backend** (port 8000), not the frontend
- The backend callback endpoint receives the OAuth code and exchanges it for tokens
- After exchanging tokens, the backend redirects to the frontend (FRONTEND_URL)
- The URI in Spotify Dashboard must match **EXACTLY**: `http://localhost:8000/api/auth/spotify/callback`
- Use `http://` not `https://` for localhost
- No trailing slash

## Verification

After adding the redirect URI to Spotify Dashboard:
1. The URI in Spotify Dashboard should be: `http://localhost:8000/api/auth/spotify/callback`
2. The backend code uses this same URI
3. Both must match EXACTLY

