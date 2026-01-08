# Fix: No Trending Tracks Found

## Problem
Getting "No trending tracks found. Try refreshing" error when trying to load Spotify trending tracks.

## Root Causes

### 1. Backend Not Running
- Backend server must be running on `http://localhost:8000`
- Check: http://localhost:8000/docs

### 2. Spotify API Not Configured
- Missing `SPOTIFY_CLIENT_ID` in `backend/.env`
- Missing `SPOTIFY_CLIENT_SECRET` in `backend/.env`

### 3. Playlist Access Issues
- Spotify playlist may require authentication
- Fallback search should work but may need API credentials

## Solutions

### Solution 1: Start Backend Server
```bash
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Solution 2: Configure Spotify API
1. Create `backend/.env` file:
```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

2. Get credentials from:
   - https://developer.spotify.com/dashboard
   - Create a new app
   - Copy Client ID and Client Secret

### Solution 3: Check Backend Logs
Look for error messages:
- "Error getting Spotify access token"
- "Spotify API error"
- "Playlist returned no tracks"

### Solution 4: Verify API Endpoint
Test the endpoint directly:
```bash
curl http://localhost:8000/api/trending/spotify
```

Should return JSON with tracks array.

## What Was Fixed

1. **Improved Fallback Search**
   - Now includes ALL tracks (not just those with preview URLs)
   - Better album art selection (300-640px)
   - Improved error logging

2. **Better Error Handling**
   - Returns sample data if API fails
   - More detailed error messages
   - Graceful degradation

3. **Enhanced Logging**
   - Console logs show what's happening
   - Easier to debug issues

## Expected Behavior

### If Spotify API Works:
- Returns real trending tracks from Spotify Top 50 Global
- Includes album art, track info, popularity scores

### If Spotify API Fails:
- Falls back to search-based trending tracks
- Still includes album art and track info

### If Everything Fails:
- Returns sample track data
- Shows "Sample Data" in source field

## Testing

1. **Check Backend Health:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Test Spotify Endpoint:**
   ```bash
   curl http://localhost:8000/api/trending/spotify
   ```

3. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for error messages
   - Check Network tab for failed requests

## Next Steps

1. Restart backend server
2. Verify Spotify credentials in `.env`
3. Check backend logs for errors
4. Try refreshing tracks in UI
5. Check browser console for frontend errors

## Still Not Working?

1. Verify backend is actually running
2. Check `backend/.env` file exists and has correct values
3. Look at backend terminal output for errors
4. Check browser Network tab for API call status
5. Verify Spotify app credentials are correct

