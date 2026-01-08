# Quick Setup: ngrok for HTTPS Localhost

## Why ngrok?

Spotify requires HTTPS for OAuth redirect URIs. ngrok creates an HTTPS tunnel to your localhost backend, which Spotify accepts.

## Setup Steps

### 1. Install ngrok

```bash
# macOS
brew install ngrok

# Or download from: https://ngrok.com/download
```

### 2. Start Your Backend

```bash
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Start ngrok (in a new terminal)

```bash
ngrok http 8000
```

You'll see output like:
```
Forwarding    https://abc123def456.ngrok.io -> http://localhost:8000
```

### 4. Copy the HTTPS URL

Copy the `https://` URL from ngrok (e.g., `https://abc123def456.ngrok.io`)

### 5. Update Spotify Developer Dashboard

1. Go to: https://developer.spotify.com/dashboard
2. Click your app → "Edit Settings"
3. Under "Redirect URIs", add:
   ```
   https://abc123def456.ngrok.io/api/auth/spotify/callback
   ```
   (Replace with your actual ngrok URL)
4. Click "Add" and "Save"

### 6. Update Backend .env File

Create or update `backend/.env`:

```bash
SPOTIFY_REDIRECT_URI=https://abc123def456.ngrok.io/api/auth/spotify/callback
FRONTEND_URL=http://localhost:3000
```

(Replace with your actual ngrok URL, and adjust FRONTEND_URL to your frontend port)

### 7. Restart Backend

After updating `.env`, restart your backend:

```bash
cd backend
# Stop (Ctrl+C) and restart
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Important Notes

- **Free ngrok URLs change** each time you restart ngrok
- If you restart ngrok and get a new URL, update both:
  - Spotify Dashboard redirect URI
  - Backend `.env` file
- For a **fixed domain** (no changes), consider ngrok's paid plan ($8/month)
- Keep ngrok running while developing

## Testing

1. Start backend on port 8000
2. Start ngrok: `ngrok http 8000`
3. Copy the HTTPS URL from ngrok
4. Update Spotify Dashboard and `.env` file
5. Restart backend
6. Try signing in to Spotify from your app

## Troubleshooting

- **"Connection refused"**: Make sure backend is running on port 8000
- **"Invalid redirect URI"**: Double-check the URL matches exactly in Spotify Dashboard and `.env`
- **URL changed**: If you restarted ngrok, update both Spotify Dashboard and `.env` with the new URL

