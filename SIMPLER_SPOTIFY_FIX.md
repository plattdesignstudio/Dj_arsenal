# Simpler Fix: Use 127.0.0.1 Instead of localhost

## Important Discovery

According to Spotify's documentation:
- ✅ **ALLOWED**: `http://127.0.0.1:8000` (IP address)
- ❌ **NOT ALLOWED**: `http://localhost:8000` (hostname)

This means you DON'T need ngrok for local development! You can use `127.0.0.1` instead.

## Simple Fix (No ngrok needed!)

### Step 1: Create backend/.env File

Create `/Users/PlattDESiGN/Desktop/DJ_BOOTH/backend/.env`:

```bash
SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/api/auth/spotify/callback
FRONTEND_URL=http://localhost:3000
SPOTIFY_CLIENT_ID=a7e64af3aa2247a1b363727b4f640049
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

**Notice**: Using `127.0.0.1` (IP address) instead of `localhost`!

### Step 2: Update Spotify Developer Dashboard

1. Go to: https://developer.spotify.com/dashboard
2. Click your app → "Edit Settings"
3. Under "Redirect URIs":
   - **DELETE** any `http://localhost:8000` entries
   - **ADD**: `http://127.0.0.1:8000/api/auth/spotify/callback`
4. Click "Save"

### Step 3: Restart Backend

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**That's it!** No ngrok needed for local development.

## Why This Works

- Spotify allows HTTP for loopback IP addresses (`127.0.0.1`)
- Spotify does NOT allow HTTP for hostname (`localhost`)
- `127.0.0.1` and `localhost` are the same thing, but Spotify treats them differently

## Alternative: Still Use ngrok (If You Want HTTPS)

If you prefer to use HTTPS with ngrok, that's also fine. But for local development, `127.0.0.1` is simpler.

## Important Notes

- The redirect URI MUST match exactly in:
  1. `backend/.env` file: `http://127.0.0.1:8000/api/auth/spotify/callback`
  2. Spotify Dashboard: `http://127.0.0.1:8000/api/auth/spotify/callback`
- Use `127.0.0.1` (IP), NOT `localhost` (hostname)
- Restart backend after creating/updating `.env`

