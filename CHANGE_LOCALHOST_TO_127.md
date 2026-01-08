# Change localhost to 127.0.0.1 in .env File

## The Problem

Your redirect URI is still using `localhost`:
- ❌ Current: `http://localhost:8000/api/auth/spotify/callback`
- ✅ Required: `http://127.0.0.1:8000/api/auth/spotify/callback`

## Fix Your .env File

Since you have `backend/.env` open:

1. **Find this line** (or similar):
   ```bash
   SPOTIFY_REDIRECT_URI=http://localhost:8000/api/auth/spotify/callback
   ```

2. **Change it to**:
   ```bash
   SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/api/auth/spotify/callback
   ```

   **Change `localhost` to `127.0.0.1`**

3. **Save the file**

## Complete .env File Should Look Like:

```bash
SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/api/auth/spotify/callback
FRONTEND_URL=http://localhost:3000
SPOTIFY_CLIENT_ID=a7e64af3aa2247a1b363727b4f640049
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

Note: `FRONTEND_URL` can still use `localhost` - only `SPOTIFY_REDIRECT_URI` needs `127.0.0.1`

## Update Spotify Dashboard

1. Go to: https://developer.spotify.com/dashboard
2. Click your app → "Edit Settings"
3. Under "Redirect URIs":
   - DELETE: `http://localhost:8000/api/auth/spotify/callback` (if exists)
   - ADD: `http://127.0.0.1:8000/api/auth/spotify/callback`
4. Click "Save"

## RESTART Backend (CRITICAL!)

After saving `.env`, you MUST restart the backend:

```bash
lsof -ti:8000 | xargs kill -9 2>/dev/null
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**The backend will NOT use the new .env values until you restart it!**

## Verify It's Fixed

After restarting, when you click "Sign in to Spotify", the URL should show:
```
redirect_uri=http%3A%2F%2F127.0.0.1%3A8000%2Fapi%2Fauth%2Fspotify%2Fcallback
```

Which decodes to: `http://127.0.0.1:8000/api/auth/spotify/callback`

NOT `localhost:8000` anymore!

## Why 127.0.0.1 Instead of localhost?

Spotify allows `http://127.0.0.1` (IP address) but NOT `http://localhost` (hostname) for local development. They treat them differently even though they're the same thing.

