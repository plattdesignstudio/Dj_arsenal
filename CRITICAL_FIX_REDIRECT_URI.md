# CRITICAL: Fix Spotify Redirect URI Error

## The Problem
You're getting `INVALID_CLIENT: Invalid redirect URI` because:
1. Spotify requires HTTPS
2. Your backend is probably using the default HTTP URL
3. You need to set up ngrok and configure it properly

## Complete Fix (Follow All Steps)

### Step 1: Install ngrok (if not installed)
```bash
brew install ngrok
```

### Step 2: Start ngrok in a NEW terminal window
```bash
ngrok http 8000
```

**Keep this terminal open!** You'll see output like:
```
Forwarding    https://abc123def456.ngrok.io -> http://localhost:8000
```

**Copy the HTTPS URL** (e.g., `abc123def456.ngrok.io`)

### Step 3: Create backend/.env File

Navigate to backend directory and create `.env` file:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
nano .env
```

Or use any text editor. Add this content:

```bash
SPOTIFY_REDIRECT_URI=https://YOUR_NGROK_URL/api/auth/spotify/callback
FRONTEND_URL=http://localhost:3000
SPOTIFY_CLIENT_ID=a7e64af3aa2247a1b363727b4f640049
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
```

**REPLACE `YOUR_NGROK_URL` with your actual ngrok URL** (just the domain, like `abc123def456.ngrok.io`)

Example:
```bash
SPOTIFY_REDIRECT_URI=https://abc123def456.ngrok.io/api/auth/spotify/callback
FRONTEND_URL=http://localhost:3000
SPOTIFY_CLIENT_ID=a7e64af3aa2247a1b363727b4f640049
SPOTIFY_CLIENT_SECRET=your_actual_secret
```

Save the file (in nano: `Ctrl+O`, `Enter`, `Ctrl+X`)

### Step 4: Update Spotify Developer Dashboard

1. Go to: https://developer.spotify.com/dashboard
2. Click on your app
3. Click "Edit Settings"
4. Under "Redirect URIs":
   - **DELETE** any `http://localhost:8000` or `http://localhost:3000` entries
   - **ADD**: `https://YOUR_NGROK_URL/api/auth/spotify/callback`
   - (Use the SAME ngrok URL from Step 2)
5. Click "Save"

### Step 5: RESTART Backend

**CRITICAL**: You MUST restart the backend after creating/updating `.env`:

```bash
# Kill any existing backend processes
lsof -ti:8000 | xargs kill -9 2>/dev/null

# Start backend
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 6: Verify

After restarting, when you click "Sign in to Spotify", check the browser console/network tab. The redirect URI should show:
```
redirect_uri=https%3A%2F%2FYOUR_NGROK_URL%2Fapi%2Fauth%2Fspotify%2Fcallback
```

**NOT** `localhost:8000` anymore!

## Critical Checklist

- [ ] ngrok is installed
- [ ] ngrok is running: `ngrok http 8000`
- [ ] Copied the HTTPS URL from ngrok
- [ ] Created `backend/.env` file
- [ ] `.env` has `SPOTIFY_REDIRECT_URI=https://YOUR_NGROK_URL/api/auth/spotify/callback`
- [ ] Updated Spotify Dashboard with the SAME HTTPS URL
- [ ] **RESTARTED backend** after creating `.env`
- [ ] ngrok terminal is still running

## Common Mistakes

❌ **Forgot to create .env file** - Backend uses default HTTP URL
❌ **Forgot to restart backend** - Changes don't take effect
❌ **Wrong URL format** - Must be `https://` not `http://`
❌ **URLs don't match** - `.env` and Spotify Dashboard must be identical
❌ **ngrok stopped** - Keep ngrok running while testing

## Quick Verification Commands

Check if `.env` exists:
```bash
ls -la /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend/.env
```

Check `.env` contents:
```bash
cat /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend/.env
```

Check if ngrok is running:
```bash
curl http://localhost:4040/api/tunnels 2>/dev/null | grep -o 'https://[^"]*ngrok[^"]*'
```

