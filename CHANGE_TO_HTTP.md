# Fix SSL Error: Change to HTTP for Localhost

## Quick Fix

Since your frontend is running on HTTP (not HTTPS), we need to use HTTP for localhost.

### Step 1: Update backend/.env

Open `backend/.env` and change:

```env
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/spotify/callback
FRONTEND_URL=http://localhost:3000
```

(Change `https://` to `http://`)

### Step 2: Update Spotify Dashboard

1. Go to: https://developer.spotify.com/dashboard
2. Click your app → "Edit Settings"
3. Under "Redirect URIs", change to:
   ```
   http://localhost:3000/api/auth/spotify/callback
   ```
4. Click "Save"

### Step 3: Restart Backend

```bash
cd backend
# Stop with Ctrl+C
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 4: Clear Browser Cache & Try Again

- Clear browser cache or use incognito mode
- Try logging in again

## Note About HTTPS

If Spotify **requires** HTTPS (some apps do), you'll need to:
- Use ngrok to create an HTTPS tunnel, OR
- Set up HTTPS certificates for localhost

But try HTTP first - many Spotify apps accept HTTP for localhost development.

## Code Already Updated

I've updated the backend code default to use HTTP, so if you don't have `SPOTIFY_REDIRECT_URI` in your `.env`, it will use HTTP automatically.

