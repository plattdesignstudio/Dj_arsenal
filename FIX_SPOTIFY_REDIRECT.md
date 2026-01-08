# Fix Spotify Redirect URI Error

## Error: INVALID_CLIENT: Insecure redirect URI

This error occurs when the redirect URI in your authorization request doesn't match what's registered in your Spotify app settings.

## Current Redirect URI

From your error, the app is trying to use:
```
http://localhost:3000/api/auth/spotify/callback
```

## Solution: Add Redirect URI to Spotify App

### Step 1: Go to Spotify Developer Dashboard

1. Visit: https://developer.spotify.com/dashboard
2. Log in with your Spotify account
3. Click on your app (or create a new one)

### Step 2: Add Redirect URI

1. Click **"Edit Settings"** button
2. Scroll down to **"Redirect URIs"** section
3. Click **"Add URI"**
4. Add this exact URI:
   ```
   http://localhost:3000/api/auth/spotify/callback
   ```
5. Click **"Add"**
6. Click **"Save"** at the bottom

### Step 3: Verify Environment Variables

Make sure your `backend/.env` file has:
```env
SPOTIFY_CLIENT_ID=a7e64af3aa2247a1b363727b4f640049
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/spotify/callback
FRONTEND_URL=http://localhost:3000
```

### Step 4: Check Your Frontend Port

**Important:** The redirect URI must match your actual frontend port!

- If your frontend runs on **port 3000**: Use `http://localhost:3000/api/auth/spotify/callback`
- If your frontend runs on **port 3001**: Use `http://localhost:3001/api/auth/spotify/callback`
- If your frontend runs on **port 3002**: Use `http://localhost:3002/api/auth/spotify/callback`

### Step 5: Restart Backend

After updating the redirect URI in Spotify Dashboard:
```bash
cd backend
# Stop the backend (Ctrl+C)
# Restart it
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Common Issues

### Issue 1: Port Mismatch
**Problem:** Frontend is on port 3002 but redirect URI says 3000

**Solution:** 
- Check what port your frontend is actually running on
- Update redirect URI in Spotify Dashboard to match
- Update `SPOTIFY_REDIRECT_URI` in `.env` to match

### Issue 2: Multiple Redirect URIs Needed
If you're testing on different ports, you can add multiple redirect URIs:
```
http://localhost:3000/api/auth/spotify/callback
http://localhost:3001/api/auth/spotify/callback
http://localhost:3002/api/auth/spotify/callback
```

### Issue 3: HTTPS vs HTTP
For localhost, use `http://` (not `https://`)

For production, you'll need:
```
https://yourdomain.com/api/auth/spotify/callback
```

## Verification

After adding the redirect URI:

1. **Wait 1-2 minutes** for Spotify to update (sometimes there's a delay)
2. **Try logging in again** from your app
3. You should be redirected to Spotify login page
4. After authorizing, you should be redirected back to your app

## Quick Checklist

- [ ] Redirect URI added to Spotify Dashboard
- [ ] Redirect URI matches exactly (including port)
- [ ] `.env` file has correct `SPOTIFY_REDIRECT_URI`
- [ ] Backend restarted after changes
- [ ] Frontend port matches redirect URI port

## Still Not Working?

1. **Clear browser cache** - Sometimes old redirects are cached
2. **Check browser console** - Look for any additional errors
3. **Verify Client ID** - Make sure it matches your Spotify app
4. **Check for typos** - Redirect URI must match exactly (case-sensitive)

## Production Setup

When deploying to production, you'll need to:

1. Add your production redirect URI to Spotify Dashboard:
   ```
   https://yourdomain.com/api/auth/spotify/callback
   ```

2. Update environment variables:
   ```env
   SPOTIFY_REDIRECT_URI=https://yourdomain.com/api/auth/spotify/callback
   FRONTEND_URL=https://yourdomain.com
   ```

3. Make sure your domain uses HTTPS (required by Spotify)

