# Check Your Redirect URI Configuration

## The Problem

You're still getting a 400 Bad Request, which means the redirect URI doesn't match between:
1. Your backend `.env` file
2. Spotify Developer Dashboard

## Check Your .env File

Open `backend/.env` and verify it has this EXACT line:

```bash
SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/api/auth/spotify/callback
```

**Must be exactly:**
- `http://127.0.0.1:8000/api/auth/spotify/callback`
- NOT `localhost`
- NOT `https://`
- NOT missing `/api/auth/spotify/callback`

## Check Spotify Dashboard

1. Go to: https://developer.spotify.com/dashboard
2. Click your app
3. Click "Edit Settings"
4. Look at "Redirect URIs"
5. Make sure it has EXACTLY: `http://127.0.0.1:8000/api/auth/spotify/callback`
6. Remove any other redirect URIs
7. Click "Save"

## After Making Changes

**CRITICAL**: After updating `.env` OR Spotify Dashboard:

1. **Save the .env file**
2. **RESTART the backend**:
   ```bash
   lsof -ti:8000 | xargs kill -9 2>/dev/null
   cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
   python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

## Verification Checklist

- [ ] `.env` file has `SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/api/auth/spotify/callback`
- [ ] Spotify Dashboard has `http://127.0.0.1:8000/api/auth/spotify/callback`
- [ ] Both match EXACTLY (including http, 127.0.0.1, port 8000, full path)
- [ ] Backend was restarted after updating .env
- [ ] No typos or extra spaces

## Common Mistakes

❌ `SPOTIFY_REDIRECT_URI=http://localhost:8000/api/auth/spotify/callback` (use 127.0.0.1)
❌ `SPOTIFY_REDIRECT_URI=https://127.0.0.1:8000/...` (use http)
❌ `SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000` (missing path)
❌ `.env` updated but backend not restarted
❌ Different URIs in `.env` vs Spotify Dashboard

