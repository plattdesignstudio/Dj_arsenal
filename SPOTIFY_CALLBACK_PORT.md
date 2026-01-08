# Spotify Callback URL: Which Port?

## Answer: Use Backend Port (8000)

The Spotify callback URL should point to your **backend** (port 8000), not the frontend.

## Correct Callback URL

```
http://localhost:8000/api/auth/spotify/callback
```

**NOT:**
- ❌ `http://localhost:3000/api/auth/spotify/callback` (frontend port)
- ✅ `http://localhost:8000/api/auth/spotify/callback` (backend port)

## Why?

1. **Backend handles the callback**: The callback endpoint `/api/auth/spotify/callback` is defined in your backend code
2. **Backend runs on port 8000**: Your backend server runs on port 8000
3. **Spotify redirects to backend**: After authentication, Spotify redirects the browser to your backend endpoint
4. **Backend exchanges code for tokens**: Your backend receives the authorization code and exchanges it for access tokens
5. **Backend redirects to frontend**: After getting tokens, the backend redirects to your frontend

## Setup Instructions

### Step 1: Update Spotify Dashboard

1. Go to: https://developer.spotify.com/dashboard
2. Click your app → "Edit Settings"
3. Under "Redirect URIs", add:
   ```
   http://localhost:8000/api/auth/spotify/callback
   ```
4. Click "Save"

### Step 2: Update backend/.env

Make sure your `backend/.env` file has:

```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:8000/api/auth/spotify/callback
FRONTEND_URL=http://localhost:3000
```

**Note:** 
- `SPOTIFY_REDIRECT_URI` = backend port (8000) - where Spotify redirects TO
- `FRONTEND_URL` = frontend port (3000) - where backend redirects TO after authentication

### Step 3: Restart Backend

```bash
cd backend
# Stop with Ctrl+C
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Flow Explanation

1. User clicks "Sign in to Spotify"
2. Browser goes to: `http://localhost:8000/api/auth/spotify` (backend)
3. Backend redirects to Spotify login page
4. User logs in and authorizes
5. **Spotify redirects to:** `http://localhost:8000/api/auth/spotify/callback` (backend)
6. Backend receives authorization code
7. Backend exchanges code for tokens
8. Backend redirects to: `http://localhost:3000/turntable?access_token=...` (frontend)

## Port Summary

| Component | Port | Purpose |
|-----------|------|---------|
| Frontend (Next.js) | 3000 | User interface |
| Backend (FastAPI) | 8000 | API and OAuth callback |
| Spotify Redirect | 8000 | Redirects to backend callback |

## Quick Checklist

- [ ] Spotify Dashboard redirect URI: `http://localhost:8000/api/auth/spotify/callback`
- [ ] `backend/.env` has: `SPOTIFY_REDIRECT_URI=http://localhost:8000/api/auth/spotify/callback`
- [ ] `backend/.env` has: `FRONTEND_URL=http://localhost:3000`
- [ ] Backend restarted
- [ ] Both backend (8000) and frontend (3000) are running

