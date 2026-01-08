# 🎵 Spotify API Integration Setup

DJ Arsenal now supports real-time trending tracks from Spotify!

## 📋 Prerequisites

1. A Spotify account
2. Access to Spotify Developer Dashboard

## 🎯 Which API to Select

When creating your Spotify app, select **Web API** - this is what we're using.

**Why Web API?**
- ✅ Access to public playlists (Top 50 Global, etc.)
- ✅ No user login required (Client Credentials flow)
- ✅ Perfect for fetching trending tracks
- ✅ Simple setup with just Client ID and Secret

**Not using:**
- ❌ Web Playback SDK (for playing music in browser - not needed)
- ❌ iOS/Android SDKs (mobile apps - not needed)
- ❌ Ads API (advertising - not needed)

## 🔧 Setup Instructions

### Step 1: Create a Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click **"Create an app"**
4. Fill in:
   - **App name**: `DJ Arsenal` (or any name)
   - **App description**: `DJ performance platform`
   - **Website**: `http://localhost:3000` (or your domain)
   - **Redirect URI**: `http://localhost:3000/callback` (required by dashboard, but not used for Client Credentials flow)
   - **Developer**: Your name
   
   **Note**: Even though Redirect URI is marked as required, it's not actually used for the Client Credentials flow we're using. You can use `http://localhost:3000/callback` or any valid URL format. This field is only needed if you plan to use Authorization Code flow (user login) later.
   
5. Accept the terms and click **"Save"**

### Step 2: Get Your Credentials

1. In your app dashboard, you'll see:
   - **Client ID**
   - **Client Secret** (click "View client secret" to reveal)

### Step 3: Add Credentials to Backend

1. Open or create `backend/.env` file:
   ```bash
   cd backend
   nano .env
   ```

2. Add your Spotify credentials:
   ```env
   SPOTIFY_CLIENT_ID=your_client_id_here
   SPOTIFY_CLIENT_SECRET=your_client_secret_here
   ```

3. Save the file (Ctrl+X, then Y, then Enter)

### Step 4: Restart Backend Server

The backend server needs to be restarted to load the new environment variables:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## ✅ Verification

Once configured, the trending tracks page will show:
- **Real Spotify Top 50 Global** tracks
- Track metadata (popularity, preview URLs, album info)
- Direct links to Spotify

The API response will show:
```json
{
  "tracks": [...],
  "count": 50,
  "source": "Spotify Web API"
}
```

## 🔒 Security Notes

- **Never commit** your `.env` file to git
- The `.env` file is already in `.gitignore`
- Client Credentials flow doesn't require user login (perfect for public data)
- Tokens are automatically cached and refreshed

## 🎯 What You Get

- **Top 50 Global Playlist**: Real-time top tracks from Spotify
- **Track Metadata**: Title, artist, album, popularity score
- **Preview URLs**: 30-second previews (when available)
- **Spotify Links**: Direct links to tracks on Spotify

## 🚨 Troubleshooting

### "Spotify API not configured" message
- Check that `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are in `backend/.env`
- Restart the backend server after adding credentials
- Check server logs for authentication errors

### Empty results
- Verify your credentials are correct
- Check that your Spotify app is active in the dashboard
- Look for error messages in backend logs

### Rate Limiting
- Spotify API has rate limits (usually 10,000 requests per hour)
- The service automatically caches access tokens to minimize requests
- If you hit limits, wait a bit and try again

## 📚 API Documentation

- [Spotify Web API Docs](https://developer.spotify.com/documentation/web-api)
- [Client Credentials Flow](https://developer.spotify.com/documentation/general/guides/authorization/client-credentials/)

---

## 🎵 Playlist Integration (NEW)

DJ Arsenal now supports full playlist management through Spotify's Web API!

### Playlist Features

- ✅ **Read user playlists** - Access all your Spotify playlists
- ✅ **Create playlists** - Create new playlists programmatically
- ✅ **Add/Remove tracks** - Manage playlist contents
- ✅ **Reorder tracks** - Organize your playlists
- ✅ **Follow/Unfollow** - Follow playlists from other users
- ✅ **Update playlist details** - Change name, description, privacy settings
- ✅ **Local file support** - Handle local files in playlists
- ✅ **Snapshot support** - Version control for concurrent edits

### Setup for Playlist Features

#### Step 1: Update Spotify App Settings

1. Go to your [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click on your app
3. Go to **Settings**
4. Add the following **Redirect URI**:
   ```
   http://localhost:3000/api/auth/spotify/callback
   ```
5. Click **Add** and **Save**

#### Step 2: Update Environment Variables

Add the redirect URI to your `backend/.env` file:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/spotify/callback
```

#### Step 3: Required Scopes

The following scopes are automatically requested during OAuth:
- `playlist-read-private` - Read private playlists
- `playlist-read-collaborative` - Read collaborative playlists
- `playlist-modify-public` - Modify public playlists
- `playlist-modify-private` - Modify private playlists
- `user-read-private` - Read user profile
- `user-read-email` - Read user email

### Using Playlist API

#### Authentication Flow

1. **Initiate OAuth**:
   ```
   GET /api/auth/spotify
   ```
   Redirects user to Spotify login page

2. **Handle Callback**:
   ```
   GET /api/auth/spotify/callback?code=...
   ```
   Returns access token and refresh token

3. **Refresh Token** (when access token expires):
   ```
   POST /api/auth/spotify/refresh
   Body: { "refresh_token": "..." }
   ```

#### Playlist Endpoints

- `GET /api/spotify/me/playlists` - Get user's playlists
- `GET /api/spotify/playlists/{playlist_id}` - Get playlist details
- `GET /api/spotify/playlists/{playlist_id}/tracks` - Get playlist tracks
- `POST /api/spotify/playlists` - Create new playlist
- `PUT /api/spotify/playlists/{playlist_id}` - Update playlist
- `POST /api/spotify/playlists/{playlist_id}/tracks` - Add tracks
- `DELETE /api/spotify/playlists/{playlist_id}/tracks` - Remove tracks
- `PUT /api/spotify/playlists/{playlist_id}/tracks` - Reorder tracks
- `PUT /api/spotify/playlists/{playlist_id}/follow` - Follow playlist
- `DELETE /api/spotify/playlists/{playlist_id}/follow` - Unfollow playlist

### Frontend Usage

```typescript
import { spotifyAuthApi, spotifyPlaylistsApi } from '@/lib/api'

// Get auth URL and redirect user
const authUrl = spotifyAuthApi.getAuthUrl()
window.location.href = authUrl

// After callback, use token for API calls
const token = 'your_access_token'

// Get user playlists
const playlists = await spotifyPlaylistsApi.getUserPlaylists(token)

// Create playlist
const newPlaylist = await spotifyPlaylistsApi.createPlaylist(
  token,
  'My DJ Set',
  'A curated playlist for my performance',
  true, // public
  false // not collaborative
)

// Add tracks
await spotifyPlaylistsApi.addTracks(
  playlistId,
  token,
  ['spotify:track:4iV5W9uYEdYUVa79Axb7Rh', 'spotify:track:3n3Ppam7vgaVa1iaRUc9LP']
)
```

### Playlist Status Rules

- **Public + Collaborative**: Cannot be both `true` at the same time
- **Public playlists**: Visible in user profile and search results
- **Private playlists**: Only accessible with link
- **Collaborative playlists**: Anyone with link can add/remove tracks

### Local Files

The API handles local files in playlists:
- Local files have `is_local: true` in track items
- Cannot add local files via API (only reorder/remove)
- Use track position and snapshot_id for local file operations

### Snapshot IDs

Every playlist modification returns a `snapshot_id`:
- Use snapshot_id for concurrent modification safety
- Include in remove/reorder requests to prevent conflicts
- Automatically merged by Spotify if conflicts occur

### Example: Creating a DJ Set Playlist

```typescript
// 1. Authenticate user
const authUrl = spotifyAuthApi.getAuthUrl()
// User completes OAuth flow...

// 2. Get access token from callback
const { access_token } = await spotifyAuthApi.handleCallback(code)

// 3. Create playlist
const playlist = await spotifyPlaylistsApi.createPlaylist(
  access_token,
  'Friday Night Set',
  'High energy tracks for the weekend',
  true
)

// 4. Add tracks from your DJ set
const trackUris = selectedTracks.map(t => t.uri)
await spotifyPlaylistsApi.addTracks(playlist.id, access_token, trackUris)

// 5. Reorder for optimal flow
await spotifyPlaylistsApi.reorderTracks(
  playlist.id,
  access_token,
  0, // range_start
  5, // insert_before
  1  // range_length
)
```

### Security Notes

- **Never expose access tokens** in client-side code in production
- Store tokens securely (use secure HTTP-only cookies or server-side sessions)
- Refresh tokens should be stored server-side only
- Tokens expire after 1 hour - use refresh token to get new access token

