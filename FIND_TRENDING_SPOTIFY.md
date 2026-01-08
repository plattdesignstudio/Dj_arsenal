# Where to Find Trending Spotify Tracks

## 📍 Locations

### 1. **Trending Page** (Main Page)
**Route:** `/trending` or click "Trending" in navigation

- **URL:** http://localhost:3000/trending
- **Features:**
  - Three tabs: "Trending", "Billboard Hot 100", **"Spotify Top Charts"**
  - Click the **"Spotify Top Charts"** tab to see trending Spotify tracks
  - All tracks include album art
  - Add tracks to your library with one click
  - Refresh button to reload tracks

### 2. **DJ Turntable Track Browser**
**Route:** `/turntable` or click "Turntable" in navigation

- **URL:** http://localhost:3000/turntable
- **Features:**
  - Track Browser on the right side
  - Click the **"Trending"** tab
  - Shows Spotify Top Charts tracks
  - Click any track to load it onto a deck
  - All tracks include album art

### 3. **Track Browser Tabs**
In the DJ Turntable interface, the Track Browser has these tabs:
- **Featured** - Spotify featured playlists (default)
- **Trending** - Spotify Top Charts ⭐
- **Search** - Search Spotify for any track
- **Library** - Your saved tracks

## 🎵 How to Access

### Method 1: Via Navigation
1. Click **"Trending"** in the top navigation bar
2. Click the **"Spotify Top Charts"** tab
3. Browse tracks with album art

### Method 2: Via Turntable
1. Click **"Turntable"** in the top navigation bar
2. In the Track Browser (right side), click the **"Trending"** tab
3. Click any track to load it onto a deck

## 🔄 API Endpoint

The backend endpoint is:
```
GET /api/trending/spotify
```

This returns Spotify's Top Global playlist tracks with:
- Track title and artist
- Album art (album_image_url)
- Preview URLs (if available)
- Full track playback via Spotify SDK (when connected)

## 📊 What You'll See

Each track displays:
- ✅ Album art (high quality from Spotify)
- ✅ Track title and artist
- ✅ Position in charts (if available)
- ✅ Source: "Spotify Top Charts"
- ✅ Add to library button
- ✅ External link to Spotify

## 🎯 Quick Access Tips

1. **Bookmark:** http://localhost:3000/trending
2. **Direct Tab:** Click "Spotify Top Charts" tab on trending page
3. **From Turntable:** Use the "Trending" tab in Track Browser
4. **Refresh:** Click the refresh button to get latest tracks

## 🎨 Visual Indicators

- **Green badge:** "Preview" - Has preview URL
- **Cyan badge:** "Full Track" - Requires Spotify connection
- **Purple badge:** "Local" - Local file

All Spotify tracks will show album art automatically!

