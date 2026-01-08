# 🔥 Trending Tracks Integration

DJ Arsenal now features SerpAPI integration to discover the latest hottest tracks from charts and streaming platforms.

## 🎯 Features

### 1. **Trending Tracks Discovery**
- Get real-time trending tracks from Google search
- Genre-specific trending tracks
- Location-based results
- Configurable limit

### 2. **Billboard Hot 100**
- Access to Billboard Hot 100 chart
- Track positions included
- Artist and title parsing

### 3. **Spotify Top Charts**
- Spotify Top 50 Global chart access
- Latest streaming data
- Popular tracks discovery

### 4. **Track Information Search**
- Search for detailed track information
- Knowledge graph integration
- Enhanced metadata

## 📍 API Endpoints

### Trending Tracks
```
GET /api/trending/trending?genre=house&location=United States&limit=20
```

### Billboard Hot 100
```
GET /api/trending/billboard
```

### Spotify Top Charts
```
GET /api/trending/spotify
```

### Track Search
```
GET /api/trending/search?track_name=Song Title&artist_name=Artist Name
```

## 🎨 Frontend Integration

### Trending Page (`/trending`)
- Three tabs: Trending, Billboard, Spotify
- One-click add to library
- External links to sources
- Real-time refresh

### Tracks Page
- Quick link to Trending page
- Easy discovery workflow

## 🔧 Backend Service

### `TrendingTracksService`
Located in `backend/app/services/trending_tracks.py`

**Methods:**
- `get_trending_tracks()` - General trending tracks
- `get_billboard_hot_100()` - Billboard chart
- `get_spotify_top_charts()` - Spotify charts
- `search_track_info()` - Track details search

## ⚙️ Configuration

### Environment Variables
```env
SERPAPI_KEY=your_serpapi_key_here
```

### SerpAPI Setup
1. Get API key from [serpapi.com](https://serpapi.com)
2. Add to `backend/.env`
3. Restart backend server

## 🚀 Usage Examples

### Get Trending Tracks
```typescript
const result = await trendingApi.getTrending("house", "United States", 20)
// Returns: { tracks: [...], count: 20, source: "SerpAPI" }
```

### Get Billboard Chart
```typescript
const billboard = await trendingApi.getBillboard()
// Returns: { tracks: [...], count: 20, source: "Billboard Hot 100" }
```

### Get Spotify Charts
```typescript
const spotify = await trendingApi.getSpotify()
// Returns: { tracks: [...], count: 20, source: "Spotify Top Charts" }
```

### Search Track Info
```typescript
const info = await trendingApi.searchTrack("Song Title", "Artist Name")
// Returns: { title, artist, description, url, type }
```

## 📊 Response Format

### Track Object
```typescript
{
  title: string
  artist: string
  source?: string
  url?: string
  position?: number  // For Billboard
  snippet?: string
}
```

## 🎵 Workflow

1. **Discover** - Browse trending tracks on `/trending` page
2. **Preview** - View track information and snippets
3. **Add** - One-click add to your library
4. **Analyze** - Use track analysis to get BPM, key, energy
5. **Mix** - Add to sets and create perfect flows

## 🔄 Error Handling

- Graceful fallback if API key not configured
- Empty results instead of errors
- User-friendly error messages
- Retry functionality

## 💡 Tips

1. **Refresh Regularly** - Charts update frequently
2. **Genre Filtering** - Use genre parameter for specific styles
3. **Location Matters** - Different regions have different trends
4. **Add to Library** - Quickly build your collection
5. **Analyze After Adding** - Get BPM/key data for mixing

## 🎧 Integration with DJ Arsenal

- **AI Suggestions** - AI can suggest from trending tracks
- **Set Building** - Include trending tracks in AI-generated sets
- **Flow Management** - Analyze and integrate trending tracks
- **Discovery** - Never miss the latest hits

---

**Stay on top of the latest trends! 🔥**





