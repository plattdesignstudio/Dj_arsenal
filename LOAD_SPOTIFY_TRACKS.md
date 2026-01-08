# How to Load Spotify Tracks

## 🎵 Quick Start

### Method 1: From DJ Turntable (Recommended)
1. Navigate to **Turntable** page (`/turntable`)
2. In the **Track Browser** (right side), you'll see 4 tabs:
   - **Featured** - Spotify featured playlists (auto-loads on page load)
   - **Trending** - Spotify Top Charts
   - **Search** - Search Spotify for any track
   - **Library** - Your saved tracks

3. Click any tab to load tracks:
   - **Featured**: Click "Featured" tab → Tracks load automatically
   - **Trending**: Click "Trending" tab → Loads Spotify Top Charts
   - **Search**: Type in search box → Results appear as you type

### Method 2: From Trending Page
1. Navigate to **Trending** page (`/trending`)
2. Click the **"Spotify Top Charts"** tab
3. Browse tracks with album art
4. Click "Add to Library" to save tracks

## 🔄 Loading Process

### Automatic Loading
- **Featured tracks** load automatically when you open the Turntable page
- Tracks include:
  - ✅ Album art (high quality from Spotify)
  - ✅ Track title and artist
  - ✅ Preview URLs (if available)
  - ✅ Full track playback (via Spotify SDK when connected)

### Manual Refresh
- Click the **"Refresh"** button next to the tab name
- Or click the tab again to reload tracks

## 📊 What Gets Loaded

### Featured Tracks
- Source: Spotify Featured Playlists
- Limit: 30 tracks
- Includes: Album art, preview URLs, full track info

### Trending Tracks
- Source: Spotify Top Global Playlist
- Limit: 50 tracks
- Includes: Chart positions, album art, popularity scores

### Search Results
- Source: Spotify Search API
- Limit: 30 tracks per search
- Includes: All matching tracks with album art

## 🎨 Visual Indicators

When tracks are loading:
- **Spinner** appears with loading message
- Shows: "Loading featured Spotify tracks..." or "Loading Spotify Top Charts..."

When tracks are loaded:
- **Album art** displays for each track
- **Track info** shows title, artist, BPM, key (if available)
- **Badges** indicate playability:
  - 🟢 "Preview" - Has preview URL
  - 🔵 "Full Track" - Requires Spotify connection
  - 🟣 "Local" - Local file

## ⚠️ Troubleshooting

### No Tracks Loading?

1. **Check Backend Server**
   - Make sure backend is running on port 8000
   - Visit: http://localhost:8000/docs
   - Should show FastAPI documentation

2. **Check Spotify API Configuration**
   - Verify `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` in `backend/.env`
   - Check backend logs for errors

3. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for error messages
   - Check Network tab for failed requests

4. **Retry Loading**
   - Click the "Refresh" button
   - Or click the tab again

### Empty State Messages

If you see "No tracks found":
- **Featured/Trending tabs**: Click "Retry" button
- **Search tab**: Enter a search query (3+ characters)
- **Library tab**: Add tracks from Trending page first

## 🚀 Loading Tracks onto Decks

1. **Click any track** in the Track Browser
2. Track loads onto the selected deck (or default to Deck A)
3. **Album art** displays on the deck
4. **Play controls** become available

## 📝 API Endpoints Used

- `GET /api/trending/spotify-featured` - Featured playlists
- `GET /api/trending/spotify` - Top charts
- `GET /api/trending/spotify-search?query=...` - Search tracks

## ✅ Success Indicators

When tracks load successfully:
- ✅ Tracks appear in the list
- ✅ Album art displays for each track
- ✅ Track count shows in console: "Loaded X Spotify tracks"
- ✅ No error messages in console

## 🎯 Best Practices

1. **Start with Featured** - Always has tracks available
2. **Use Trending** - For current popular tracks
3. **Use Search** - For specific tracks or artists
4. **Refresh regularly** - Get latest tracks
5. **Connect to Spotify** - For full track playback

## 📱 Quick Access

- **Turntable**: http://localhost:3000/turntable
- **Trending**: http://localhost:3000/trending
- **Backend API**: http://localhost:8000/docs

Happy mixing! 🎧

