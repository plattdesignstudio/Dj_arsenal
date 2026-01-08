# Debug: INVALID_CLIENT: Invalid redirect URI

## The Problem

You're getting "INVALID_CLIENT: Invalid redirect URI" which means the redirect URI in your code **doesn't exactly match** what's registered in Spotify Dashboard.

## Step-by-Step Debugging

### Step 1: Check What's in Spotify Dashboard

1. Go to https://developer.spotify.com/dashboard
2. Click on your app
3. Click "Edit Settings"
4. Look at the "Redirect URIs" section
5. **Copy the EXACT redirect URI(s) you see there**

Common issues:
- Extra spaces
- Wrong protocol (http vs https)
- Wrong port number
- Missing or extra path segments
- Trailing slash

### Step 2: Check Your Backend Code

Check what redirect URI your code is using:

**Option A: Check environment variable**
```bash
cd backend
cat .env | grep SPOTIFY_REDIRECT_URI
```

**Option B: Check the code default**
The code uses this default if `.env` doesn't have it:
```python
REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI", "https://localhost:3000/api/auth/spotify/callback")
```

### Step 3: Compare Them

The redirect URI must match **EXACTLY**:
- Same protocol (http:// or https://)
- Same domain (localhost)
- Same port (3000, 3001, etc.)
- Same path (/api/auth/spotify/callback)
- No trailing slash
- No extra spaces

### Step 4: Common Mismatches

| Spotify Dashboard | Code | Result |
|------------------|------|--------|
| `https://localhost:3000/api/auth/spotify/callback` | `http://localhost:3000/api/auth/spotify/callback` | ❌ Protocol mismatch |
| `https://localhost:3000/api/auth/spotify/callback` | `https://localhost:3001/api/auth/spotify/callback` | ❌ Port mismatch |
| `https://localhost:3000/api/auth/spotify/callback/` | `https://localhost:3000/api/auth/spotify/callback` | ❌ Trailing slash |
| `https://localhost:3000/api/auth/spotify/callback` | `https://localhost:3000/api/auth/spotify/callback ` | ❌ Trailing space |

## Quick Fix

### Method 1: Update Spotify Dashboard to Match Code

1. Check what your code is using (from Step 2)
2. Go to Spotify Dashboard
3. Remove the old redirect URI
4. Add the EXACT redirect URI from your code
5. Click "Save"
6. Wait 1-2 minutes
7. Try again

### Method 2: Update Code to Match Spotify Dashboard

1. Check what's in Spotify Dashboard (from Step 1)
2. Update your `backend/.env` file:
   ```env
   SPOTIFY_REDIRECT_URI=https://localhost:3000/api/auth/spotify/callback
   ```
   (Use the EXACT value from Spotify Dashboard)

3. Restart backend:
   ```bash
   cd backend
   # Stop (Ctrl+C)
   python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

## Verify Current Configuration

Run this to see what your backend is actually using:

```bash
cd backend
python3 -c "
import os
from dotenv import load_dotenv
load_dotenv()
redirect_uri = os.getenv('SPOTIFY_REDIRECT_URI', 'https://localhost:3000/api/auth/spotify/callback')
print(f'Current redirect URI: {redirect_uri}')
print(f'Length: {len(redirect_uri)} characters')
print(f'Has trailing slash: {redirect_uri.endswith(\"/\")}')
"
```

Then compare this output with what's in Spotify Dashboard.

## Still Not Working?

### Check 1: Multiple Redirect URIs
If you have multiple redirect URIs in Spotify Dashboard, make sure ONE of them matches exactly.

### Check 2: Wait Time
After saving in Spotify Dashboard, wait 1-2 minutes for changes to propagate.

### Check 3: Clear Cache
- Clear browser cache
- Try incognito/private mode
- Restart browser

### Check 4: Check Browser Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to log in
4. Look at the authorization request URL
5. Find the `redirect_uri` parameter
6. Copy it and compare with Spotify Dashboard

The URL will look like:
```
https://accounts.spotify.com/authorize?client_id=...&redirect_uri=...&scope=...
```

The `redirect_uri` parameter should match EXACTLY what's in Spotify Dashboard.

## Exact Match Checklist

Before trying again, verify:

- [ ] Redirect URI in Spotify Dashboard matches code EXACTLY
- [ ] No trailing slash
- [ ] No leading/trailing spaces
- [ ] Same protocol (http vs https)
- [ ] Same port number
- [ ] Same path
- [ ] Case-sensitive match
- [ ] Saved in Spotify Dashboard
- [ ] Waited 1-2 minutes after saving
- [ ] Backend restarted after .env changes
- [ ] Cleared browser cache

## Need Help?

If still not working, provide:
1. The EXACT redirect URI from Spotify Dashboard
2. The output of the Python script above
3. The redirect_uri parameter from browser Network tab

