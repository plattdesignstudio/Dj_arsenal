# STEP-BY-STEP: Fix Spotify HTTPS Redirect (Do This Now)

## Current Problem
Your backend is using: `http://localhost:8000/api/auth/spotify/callback`
Spotify requires: `https://YOUR_NGROK_URL/api/auth/spotify/callback`

## Complete Fix (Follow Every Step)

### Step 1: Install ngrok
```bash
brew install ngrok
```

### Step 2: Start ngrok (in a NEW terminal window)
```bash
ngrok http 8000
```

**Important**: Keep this terminal window open! You'll see:
```
Forwarding    https://abc123def456.ngrok.io -> http://localhost:8000
```

Copy the HTTPS URL (the `https://abc123def456.ngrok.io` part)

### Step 3: Create backend/.env File

Navigate to your backend directory and create the `.env` file:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
nano .env
```

Or use any text editor. Add this content (replace with YOUR actual ngrok URL):

```bash
SPOTIFY_REDIRECT_URI=https://abc123def456.ngrok.io/api/auth/spotify/callback
FRONTEND_URL=http://localhost:3000
SPOTIFY_CLIENT_ID=a7e64af3aa2247a1b363727b4f640049
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
```

**REPLACE `abc123def456.ngrok.io` with YOUR actual ngrok URL from Step 2**

Save the file (in nano: Ctrl+O, Enter, Ctrl+X)

### Step 4: Update Spotify Developer Dashboard

1. Go to: https://developer.spotify.com/dashboard
2. Click on your app
3. Click "Edit Settings"
4. Under "Redirect URIs":
   - **DELETE** any entries with `http://localhost:8000`
   - **ADD** new URI: `https://YOUR_NGROK_URL/api/auth/spotify/callback`
   - (Use the SAME ngrok URL from Step 2)
5. Click "Save"

### Step 5: Restart Backend

Stop the backend (Ctrl+C in the terminal where it's running), then:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 6: Verify

After restarting, when you click "Sign in to Spotify", check the browser console/network tab. The redirect URI should now show:
```
redirect_uri=https%3A%2F%2FYOUR_NGROK_URL%2Fapi%2Fauth%2Fspotify%2Fcallback
```

NOT `localhost:8000` anymore!

## Critical Checklist

- [ ] ngrok is installed
- [ ] ngrok is running: `ngrok http 8000`
- [ ] Copied the HTTPS URL from ngrok
- [ ] Created `backend/.env` file
- [ ] `.env` has `SPOTIFY_REDIRECT_URI=https://YOUR_NGROK_URL/api/auth/spotify/callback`
- [ ] Updated Spotify Dashboard with the SAME HTTPS URL
- [ ] Restarted backend after creating/updating `.env`
- [ ] ngrok terminal is still running

## Example .env File

If your ngrok URL is `https://abc123.ngrok.io`, your `.env` should look like:

```bash
SPOTIFY_REDIRECT_URI=https://abc123.ngrok.io/api/auth/spotify/callback
FRONTEND_URL=http://localhost:3000
SPOTIFY_CLIENT_ID=a7e64af3aa2247a1b363727b4f640049
SPOTIFY_CLIENT_SECRET=your_actual_secret_here
```

## Troubleshooting

**Still seeing `localhost:8000`?**
- Make sure `.env` file exists in the `backend` directory
- Make sure you restarted the backend after creating `.env`
- Check that `SPOTIFY_REDIRECT_URI` is set correctly in `.env`

**ngrok URL changed?**
- Free ngrok URLs change when you restart ngrok
- Update both `.env` and Spotify Dashboard with the new URL
- Restart backend

**Getting errors?**
- Make sure ngrok is running
- Make sure backend is running on port 8000
- Make sure the URLs match EXACTLY in `.env` and Spotify Dashboard

