# Fix: INVALID_CLIENT: Invalid redirect URI

## The Issue

The redirect URI in your code must **match EXACTLY** what's registered in Spotify Dashboard.

## Current Code Configuration

Your code is set to use (as default):
```
https://localhost:3000/api/auth/spotify/callback
```

## What You Need To Do

### Step 1: Check Spotify Dashboard

1. Go to: https://developer.spotify.com/dashboard
2. Click on your app
3. Click "Edit Settings"
4. Scroll to "Redirect URIs"
5. **Write down EXACTLY what you see there** (copy it)

### Step 2: Verify They Match

The redirect URI in Spotify Dashboard must match your code EXACTLY:

✅ **Must match:**
- Protocol: `https://` (both must use https)
- Domain: `localhost` (exact)
- Port: `3000` (must match your frontend port)
- Path: `/api/auth/spotify/callback` (exact path)
- No trailing slash
- No spaces

### Step 3: Update .env File

Make sure your `backend/.env` file has the EXACT redirect URI from Spotify Dashboard:

```env
SPOTIFY_CLIENT_ID=a7e64af3aa2247a1b363727b4f640049
SPOTIFY_CLIENT_SECRET=your_secret_here
SPOTIFY_REDIRECT_URI=https://localhost:3000/api/auth/spotify/callback
FRONTEND_URL=https://localhost:3000
```

**IMPORTANT:** Use the EXACT value from Spotify Dashboard.

### Step 4: Check Frontend Port

**Check what port your frontend is actually running on:**

Look at your terminal output when you run `npm run dev`:
- `http://localhost:3000` → Use port 3000
- `http://localhost:3001` → Use port 3001  
- `http://localhost:3002` → Use port 3002

**If your frontend port is different, you need to:**

1. **Add redirect URI in Spotify Dashboard with correct port:**
   - If port 3001: `https://localhost:3001/api/auth/spotify/callback`
   - If port 3002: `https://localhost:3002/api/auth/spotify/callback`

2. **Update `.env` file with correct port:**
   ```env
   SPOTIFY_REDIRECT_URI=https://localhost:3001/api/auth/spotify/callback
   FRONTEND_URL=https://localhost:3001
   ```

### Step 5: Restart Backend

After updating `.env`:
```bash
cd backend
# Stop backend (Ctrl+C)
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 6: Wait and Retry

1. **Wait 1-2 minutes** after saving in Spotify Dashboard
2. **Clear browser cache** or use incognito mode
3. **Try logging in again**

## Debug: Check What's Being Sent

To see what redirect URI is actually being sent:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Click "Sign in to Spotify Premium"
4. Look for the request to `accounts.spotify.com/authorize`
5. Click on it
6. Look at the "Query String Parameters"
7. Find `redirect_uri` - this should match Spotify Dashboard EXACTLY

## Common Mistakes

| ❌ Wrong | ✅ Correct |
|---------|-----------|
| `https://localhost:3000/api/auth/spotify/callback/` | `https://localhost:3000/api/auth/spotify/callback` |
| `https://localhost:3000/api/auth/spotify/callback ` | `https://localhost:3000/api/auth/spotify/callback` |
| `http://localhost:3000/api/auth/spotify/callback` | `https://localhost:3000/api/auth/spotify/callback` |
| `https://localhost:3001/api/auth/spotify/callback` | `https://localhost:3000/api/auth/spotify/callback` (if frontend is on 3000) |

## Exact Match Checklist

Before trying again:

- [ ] Redirect URI in Spotify Dashboard matches code EXACTLY
- [ ] Using `https://` (not `http://`)
- [ ] Port number matches your frontend port
- [ ] No trailing slash
- [ ] No spaces before or after
- [ ] Path is exactly `/api/auth/spotify/callback`
- [ ] Saved in Spotify Dashboard
- [ ] `.env` file updated
- [ ] Backend restarted
- [ ] Waited 1-2 minutes
- [ ] Cleared browser cache

## Still Not Working?

1. **Double-check the redirect URI in Spotify Dashboard** - copy it exactly
2. **Update `.env` with that EXACT value** (no changes)
3. **Restart backend**
4. **Try in incognito/private browser window**
5. **Check browser Network tab** to see what's actually being sent

