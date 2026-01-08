# DO THIS NOW: Fix Spotify HTTPS Redirect

## The Problem
Your backend is still using `http://localhost:8000` which Spotify rejects. You MUST use HTTPS.

## Solution: Use ngrok (5 minutes)

### Step 1: Install ngrok
```bash
brew install ngrok
```

### Step 2: Start ngrok
Open a NEW terminal window and run:
```bash
ngrok http 8000
```

You'll see:
```
Forwarding    https://abc123def456.ngrok.io -> http://localhost:8000
```

### Step 3: Copy Your ngrok HTTPS URL
Copy the `https://` URL (e.g., `https://abc123def456.ngrok.io`)

### Step 4: Create backend/.env File

Create the file `backend/.env` with this content:

```bash
SPOTIFY_REDIRECT_URI=https://YOUR_NGROK_URL/api/auth/spotify/callback
FRONTEND_URL=http://localhost:3000
SPOTIFY_CLIENT_ID=a7e64af3aa2247a1b363727b4f640049
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

**REPLACE `YOUR_NGROK_URL`** with your actual ngrok URL (e.g., `abc123def456.ngrok.io`)

Example if your ngrok URL is `https://abc123.ngrok.io`:
```bash
SPOTIFY_REDIRECT_URI=https://abc123.ngrok.io/api/auth/spotify/callback
FRONTEND_URL=http://localhost:3000
SPOTIFY_CLIENT_ID=a7e64af3aa2247a1b363727b4f640049
SPOTIFY_CLIENT_SECRET=your_actual_secret_here
```

### Step 5: Update Spotify Dashboard

1. Go to: https://developer.spotify.com/dashboard
2. Click your app → "Edit Settings"
3. Under "Redirect URIs":
   - DELETE any `http://localhost:8000` entries
   - ADD: `https://YOUR_NGROK_URL/api/auth/spotify/callback`
   - (Use the SAME ngrok URL from Step 3)
4. Click "Save"

### Step 6: RESTART Backend

```bash
cd backend
# Stop the server (Ctrl+C if running)
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Critical Points

✅ **MUST use HTTPS** - Spotify requires it
✅ **MUST match exactly** - `.env` and Spotify Dashboard must use the SAME URL
✅ **Keep ngrok running** - Don't close the ngrok terminal
✅ **Restart backend** - After updating `.env`, always restart

## Verify It's Fixed

After restarting, when you click "Sign in to Spotify", the URL should show:
```
redirect_uri=https%3A%2F%2FYOUR_NGROK_URL%2Fapi%2Fauth%2Fspotify%2Fcallback
```

NOT `localhost:8000` anymore!

## If ngrok URL Changes

Free ngrok URLs change when you restart ngrok. If this happens:
1. Copy the new ngrok URL
2. Update `backend/.env` file
3. Update Spotify Dashboard
4. Restart backend

For a fixed domain, consider ngrok paid plan ($8/month).

