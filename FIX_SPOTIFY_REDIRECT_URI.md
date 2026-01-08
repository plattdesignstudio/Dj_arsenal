# Fix Spotify Redirect URI Error

## Error: INVALID_CLIENT: Invalid redirect URI

This error occurs when the redirect URI configured in your Spotify Developer Dashboard doesn't match exactly what your backend is sending.

## Quick Fix Steps

### 1. Check Your Current Port

First, check what port your frontend is running on:
- Default: `http://localhost:3000`
- Or it might be: `http://localhost:3001` or `http://localhost:3002`

### 2. Update Backend .env File

Make sure your `backend/.env` file has the correct redirect URI:

```bash
# For port 3000
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/spotify/callback
FRONTEND_URL=http://localhost:3000

# OR for port 3001
SPOTIFY_REDIRECT_URI=http://localhost:3001/api/auth/spotify/callback
FRONTEND_URL=http://localhost:3001

# OR for port 3002
SPOTIFY_REDIRECT_URI=http://localhost:3002/api/auth/spotify/callback
FRONTEND_URL=http://localhost:3002
```

### 3. Update Spotify Developer Dashboard

1. Go to: https://developer.spotify.com/dashboard
2. Click on your app
3. Click "Edit Settings"
4. Under "Redirect URIs", add EXACTLY this URI (matching your port):
   ```
   http://localhost:3000/api/auth/spotify/callback
   ```
   Or use the port your frontend is running on (3001, 3002, etc.)

5. **IMPORTANT**: The URI must match EXACTLY:
   - Use `http://` NOT `https://` for localhost
   - Include the full path: `/api/auth/spotify/callback`
   - No trailing slash
   - Match the port number exactly

6. Click "Add" and then "Save"

### 4. Restart Your Backend

After updating the `.env` file, restart your backend:

```bash
cd backend
# Stop the server (Ctrl+C) if running
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Common Mistakes to Avoid

1. ❌ Using `https://` instead of `http://` for localhost
2. ❌ Missing the full path `/api/auth/spotify/callback`
3. ❌ Adding a trailing slash `/api/auth/spotify/callback/`
4. ❌ Using wrong port number
5. ❌ Not matching the URI in both `.env` and Spotify Dashboard
6. ❌ Not saving changes in Spotify Dashboard

## Verify It's Working

1. The redirect URI in your `.env` file should match EXACTLY what's in Spotify Dashboard
2. Both should use the same protocol (`http://`), port, and path
3. No trailing slashes
4. Restart backend after making changes

## Example Configuration

If your frontend runs on port 3000:

**backend/.env:**
```
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/spotify/callback
FRONTEND_URL=http://localhost:3000
```

**Spotify Dashboard Redirect URIs:**
```
http://localhost:3000/api/auth/spotify/callback
```

These must match EXACTLY!

