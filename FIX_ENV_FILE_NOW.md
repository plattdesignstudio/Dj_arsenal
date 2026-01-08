# FIX YOUR .env FILE - Use 127.0.0.1 NOT localhost

## The Problem

Your backend is still using `http://localhost:8000` but Spotify requires `http://127.0.0.1:8000`.

## Fix Your .env File

You have `backend/.env` open. Make sure it has this EXACT line:

```bash
SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/api/auth/spotify/callback
```

**NOT**: `http://localhost:8000` ❌
**YES**: `http://127.0.0.1:8000` ✅

## Complete .env File Content

Your `backend/.env` file should look like this:

```bash
SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/api/auth/spotify/callback
FRONTEND_URL=http://localhost:3000
SPOTIFY_CLIENT_ID=a7e64af3aa2247a1b363727b4f640049
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
```

## After Fixing .env

### Step 1: Save the .env file
Save your changes.

### Step 2: Update Spotify Dashboard
1. Go to: https://developer.spotify.com/dashboard
2. Click your app → "Edit Settings"
3. Under "Redirect URIs":
   - DELETE any `localhost` entries
   - ADD: `http://127.0.0.1:8000/api/auth/spotify/callback`
4. Save

### Step 3: RESTART Backend
**CRITICAL**: Restart the backend so it reads the updated .env:

```bash
lsof -ti:8000 | xargs kill -9 2>/dev/null; cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Key Points

- ✅ Use `127.0.0.1` (IP address) in redirect URI
- ❌ Don't use `localhost` (hostname) in redirect URI
- ✅ Both `.env` and Spotify Dashboard must match exactly
- ✅ Restart backend after changing .env

## Verify

After restarting, when you click "Sign in to Spotify", check the URL. It should show:
```
redirect_uri=http%3A%2F%2F127.0.0.1%3A8000%2Fapi%2Fauth%2Fspotify%2Fcallback
```

NOT `localhost:8000` anymore!

