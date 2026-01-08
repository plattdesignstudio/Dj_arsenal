# Spotify Redirect URI Setup

## Fix: INVALID_CLIENT: Insecure redirect URI

This error occurs when the redirect URI in your Spotify app settings doesn't match what's being used in the code.

### Step 1: Check Your Current Port

First, check what port your frontend is running on:
- If using `npm run dev`, it's usually `http://localhost:3000`
- Check your terminal or browser URL to confirm

### Step 2: Update Spotify App Settings

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click on your app
3. Go to **Settings**
4. Under **Redirect URIs**, make sure you have EXACTLY:
   ```
   http://localhost:3000/api/auth/spotify/callback
   ```
   (Replace `3000` with your actual port if different)

5. **Important**: 
   - No trailing slash
   - Exact match (case-sensitive)
   - Must include the full path `/api/auth/spotify/callback`
   - Use `http://` for localhost (not `https://`)

6. Click **Add** and **Save**

### Step 3: Update Backend Environment

Make sure your `backend/.env` file has:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/spotify/callback
FRONTEND_URL=http://localhost:3000
```

(Replace `3000` with your actual port)

### Step 4: Restart Backend Server

After updating the `.env` file, restart your backend server:

```bash
cd backend
# Stop the server (Ctrl+C) and restart
uvicorn main:app --reload
```

### Common Issues

1. **Port Mismatch**: If your frontend runs on port 3001, use `http://localhost:3001/api/auth/spotify/callback`
2. **Trailing Slash**: Don't add a trailing slash to the redirect URI
3. **HTTPS vs HTTP**: For localhost, use `http://` not `https://`
4. **Path Mismatch**: The path must be exactly `/api/auth/spotify/callback`

### Testing

After setup, try signing in again. The redirect URI should now match and the error should be resolved.

