# URGENT: Fix Spotify Redirect URI - Must Use HTTPS

## Current Problem

Your redirect URI is still using `http://localhost:8000/api/auth/spotify/callback`, but Spotify requires HTTPS.

## Quick Fix: Use ngrok HTTPS

### Step 1: Install ngrok (if not installed)
```bash
brew install ngrok
```

### Step 2: Start ngrok tunnel
```bash
ngrok http 8000
```

This will output something like:
```
Forwarding    https://abc123def456.ngrok.io -> http://localhost:8000
```

### Step 3: Copy the HTTPS URL
Copy the `https://abc123def456.ngrok.io` URL (your actual URL will be different)

### Step 4: Create/Update backend/.env

Create or edit `backend/.env` file:

```bash
SPOTIFY_REDIRECT_URI=https://YOUR_NGROK_URL/api/auth/spotify/callback
FRONTEND_URL=http://localhost:3000
SPOTIFY_CLIENT_ID=a7e64af3aa2247a1b363727b4f640049
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

**Replace `YOUR_NGROK_URL` with your actual ngrok URL** (e.g., `abc123def456.ngrok.io`)

### Step 5: Update Spotify Developer Dashboard

1. Go to: https://developer.spotify.com/dashboard
2. Click your app → "Edit Settings"
3. Under "Redirect URIs":
   - Remove any old `http://localhost:8000` entries
   - Add new URI: `https://YOUR_NGROK_URL/api/auth/spotify/callback`
   - (Replace with your actual ngrok URL)
4. Click "Add" and "Save"

### Step 6: Restart Backend

```bash
cd backend
# Stop the server (Ctrl+C) if running
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Example .env File

If your ngrok URL is `https://abc123def456.ngrok.io`, your `.env` should be:

```bash
SPOTIFY_REDIRECT_URI=https://abc123def456.ngrok.io/api/auth/spotify/callback
FRONTEND_URL=http://localhost:3000
SPOTIFY_CLIENT_ID=a7e64af3aa2247a1b363727b4f640049
SPOTIFY_CLIENT_SECRET=your_actual_secret
```

## Important Notes

- ✅ Use `https://` NOT `http://`
- ✅ Use your ngrok URL, not `localhost:8000`
- ✅ Keep ngrok running while developing
- ⚠️ If you restart ngrok, you'll get a new URL - update both `.env` and Spotify Dashboard

## After Setup

1. Backend should be running on port 8000
2. ngrok should be running: `ngrok http 8000`
3. `.env` file should have the ngrok HTTPS URL
4. Spotify Dashboard should have the ngrok HTTPS URL
5. Restart backend after updating `.env`

Then try signing in again!

