# Spotify Premium OAuth Integration

## Overview

The DJ Booth now includes enhanced Spotify OAuth integration that:
- ✅ Authenticates users with Spotify
- ✅ Checks for Spotify Premium status
- ✅ Displays user profile information
- ✅ Enables full track playback for Premium users
- ✅ Shows clear Premium/Free account indicators

## Features

### 1. User Profile Display
- Shows user's display name and profile image
- Displays account type (Premium or Free)
- Visual indicators (green for Premium, yellow for Free)

### 2. Premium Status Check
- Automatically checks Premium status after login
- Shows appropriate messaging based on account type
- Enables full playback features for Premium users

### 3. Enhanced Authentication Flow
- Secure token storage in localStorage
- Automatic token refresh
- Profile loading on successful authentication

## Backend Endpoints

### Get User Profile
```
GET /api/auth/spotify/me?access_token={token}
```
Returns user profile including Premium status.

### Check Premium Status
```
GET /api/auth/spotify/check-premium?access_token={token}
```
Quick check for Premium account status.

## Frontend Components

### SpotifyLogin Component
Located at `components/spotify/SpotifyLogin.tsx`

**Features:**
- Login/logout functionality
- Profile display with Premium indicator
- Automatic profile loading after authentication
- Token refresh handling

**Usage:**
```tsx
import { SpotifyLogin } from "@/components/spotify/SpotifyLogin"

<SpotifyLogin />
```

### useSpotifyAuth Hook
Hook to access current Spotify authentication state.

**Usage:**
```tsx
import { useSpotifyAuth } from "@/components/spotify/SpotifyLogin"

const { accessToken, userProfile } = useSpotifyAuth()
const isPremium = userProfile?.isPremium ?? false
```

## Setup

### 1. Backend Environment Variables
Ensure these are set in `backend/.env`:
```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=https://localhost:3000/api/auth/spotify/callback
FRONTEND_URL=https://localhost:3000
```

**Note:** Spotify requires HTTPS even for localhost development.

### 2. Spotify App Configuration
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create or select your app
3. Add redirect URI: `https://localhost:3000/api/auth/spotify/callback`
4. Copy Client ID and Client Secret to `.env`

### 3. Required Scopes
The app requests these scopes:
- `playlist-read-private`
- `playlist-read-collaborative`
- `playlist-modify-public`
- `playlist-modify-private`
- `user-read-private`
- `user-read-email`
- `streaming` (Required for Web Playback SDK)
- `user-read-playback-state`
- `user-modify-playback-state`

## User Experience

### Premium Users
- ✅ Full track playback enabled
- ✅ Green "Premium" indicator
- ✅ Profile image and name displayed
- ✅ Access to all features

### Free Users
- ⚠️ Limited playback (preview only)
- ⚠️ Yellow "Free" indicator
- ⚠️ Message suggesting Premium upgrade
- ⚠️ Some features may be limited

## Testing

1. **Start Backend:**
   ```bash
   cd backend
   python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Start Frontend:**
   ```bash
   npm run dev
   ```

3. **Test Authentication:**
   - Click "Sign in to Spotify Premium" button
   - Authorize the app on Spotify
   - Check that profile loads with Premium status
   - Verify Premium indicator displays correctly

## Troubleshooting

### Profile Not Loading
- Check that access token is valid
- Verify backend is running
- Check browser console for errors

### Premium Status Incorrect
- Verify user actually has Premium account
- Check Spotify API response
- Ensure token has `user-read-private` scope

### Token Refresh Issues
- Check refresh token is stored correctly
- Verify backend refresh endpoint works
- Check token expiration times

## Security Notes

- Tokens are stored in localStorage (development)
- In production, consider using HTTP-only cookies
- Tokens are automatically refreshed before expiration
- Logout clears all stored authentication data

## Next Steps

- [ ] Add Premium upgrade prompt for Free users
- [ ] Implement secure token storage for production
- [ ] Add user settings page
- [ ] Show Premium benefits comparison

