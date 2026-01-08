# Quick Fix: Spotify Redirect URI

## The Problem
"INVALID_CLIENT: Invalid redirect URI" means the redirect URI doesn't match exactly.

## 3-Minute Fix

### 1. Check Spotify Dashboard

Go to: https://developer.spotify.com/dashboard → Your App → Edit Settings → Redirect URIs

**Copy the EXACT redirect URI** you see there (if any), or note what needs to be added.

### 2. Add/Update in Spotify Dashboard

If not present, add:
```
https://localhost:3000/api/auth/spotify/callback
```

**OR** if your frontend runs on a different port (3001, 3002, etc.), use:
```
https://localhost:3001/api/auth/spotify/callback
```
(Replace with your actual port)

Click "Add" then "Save"

### 3. Update backend/.env

Open `backend/.env` and make sure it has:

```env
SPOTIFY_REDIRECT_URI=https://localhost:3000/api/auth/spotify/callback
FRONTEND_URL=https://localhost:3000
```

(Use the SAME port as in Spotify Dashboard)

### 4. Restart Backend

```bash
cd backend
# Stop with Ctrl+C
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 5. Wait & Retry

- Wait 1-2 minutes
- Clear browser cache
- Try again

## Must Match EXACTLY

Both Spotify Dashboard and `.env` file must have the SAME redirect URI:
- Same protocol (`https://`)
- Same port (`3000`, `3001`, etc.)
- Same path (`/api/auth/spotify/callback`)
- No trailing slash
- No spaces

## That's It!

If they match exactly, it should work.

