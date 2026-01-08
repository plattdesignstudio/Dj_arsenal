# 🔴 URGENT: Fix Spotify Redirect URI Error

## The Problem

You're getting: **"INVALID_CLIENT: Insecure redirect URI"**

This means the redirect URI `http://localhost:3000/api/auth/spotify/callback` is **NOT registered** in your Spotify app settings.

## Quick Fix (5 minutes)

### Step 1: Go to Spotify Developer Dashboard

1. Open: https://developer.spotify.com/dashboard
2. Log in with your Spotify account
3. Find your app (Client ID: `a7e64af3aa2247a1b363727b4f640049`)
4. Click on it

### Step 2: Add Redirect URI

1. Click **"Edit Settings"** (or "Settings" button)
2. Scroll down to **"Redirect URIs"** section
3. Click **"Add URI"** button
4. Enter this EXACT URI:
   ```
   https://localhost:3000/api/auth/spotify/callback
   ```
   ⚠️ **IMPORTANT:** 
   - No trailing slash
   - Exact match (case-sensitive)
   - Use `https://` for localhost (Spotify requires HTTPS)
   - Include the full path `/api/auth/spotify/callback`

5. Click **"Add"**
6. Click **"Save"** at the bottom of the page

### Step 3: Check Your Frontend Port

**Check what port your frontend is actually running on:**

Look at your terminal where you ran `npm run dev` - it will show:
- `http://localhost:3000` 
- OR `http://localhost:3001`
- OR `http://localhost:3002`

**If your frontend is on a different port**, you need to:

1. **Add the correct redirect URI to Spotify:**
   - If port 3001: `http://localhost:3001/api/auth/spotify/callback`
   - If port 3002: `http://localhost:3002/api/auth/spotify/callback`

2. **Update your backend `.env` file:**
   ```env
   SPOTIFY_REDIRECT_URI=https://localhost:3001/api/auth/spotify/callback
   FRONTEND_URL=https://localhost:3001
   ```
   (Replace with your actual port)

3. **Restart your backend:**
   ```bash
   cd backend
   # Press Ctrl+C to stop
   python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Step 4: Wait and Retry

1. **Wait 1-2 minutes** after saving (Spotify sometimes takes a moment to update)
2. **Clear your browser cache** (or use incognito mode)
3. **Try logging in again**

## Multiple Ports? Add Multiple URIs

If you're testing on different ports, you can add multiple redirect URIs in Spotify:

```
https://localhost:3000/api/auth/spotify/callback
https://localhost:3001/api/auth/spotify/callback
https://localhost:3002/api/auth/spotify/callback
```

## Verification Checklist

- [ ] Redirect URI added to Spotify Dashboard
- [ ] Redirect URI matches your frontend port exactly
- [ ] No trailing slash on redirect URI
- [ ] Using `http://` (not `https://`) for localhost
- [ ] Backend `.env` has correct `SPOTIFY_REDIRECT_URI`
- [ ] Backend restarted after `.env` changes
- [ ] Waited 1-2 minutes after saving in Spotify Dashboard
- [ ] Cleared browser cache or using incognito

## Still Not Working?

### Check 1: Exact Match
The redirect URI in Spotify Dashboard must match EXACTLY:
- ✅ `https://localhost:3000/api/auth/spotify/callback`
- ❌ `https://localhost:3000/api/auth/spotify/callback/` (trailing slash)
- ❌ `https://localhost:3000/api/auth/spotify/callback ` (trailing space)
- ❌ `http://localhost:3000/api/auth/spotify/callback` (wrong protocol - must use https)

### Check 2: Client ID Match
Make sure the Client ID in your `.env` matches:
```
SPOTIFY_CLIENT_ID=a7e64af3aa2247a1b363727b4f640049
```

### Check 3: Backend Logs
Check your backend terminal for any errors when you try to log in.

### Check 4: Browser Console
Open browser DevTools (F12) and check the Console tab for errors.

## Production Note

When you deploy to production, you'll need to:
1. Add your production redirect URI: `https://yourdomain.com/api/auth/spotify/callback`
2. Update `.env` with production URL
3. Make sure your domain uses HTTPS (required by Spotify)

## Need Help?

If it's still not working after following these steps:
1. Double-check the redirect URI in Spotify Dashboard matches exactly
2. Verify your frontend port
3. Check backend `.env` file
4. Restart both frontend and backend
5. Try in an incognito/private browser window

