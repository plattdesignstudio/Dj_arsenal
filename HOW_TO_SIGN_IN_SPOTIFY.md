# How to Sign In to Spotify

## Steps to Sign In

### Step 1: Click the Sign In Button

Look for the button that says **"Sign in to Spotify Premium"** or **"Sign in to Spotify"** and click it.

### Step 2: Authorize on Spotify

You'll be redirected to Spotify's authorization page. 
- Log in to your Spotify account (if not already logged in)
- Review the permissions the app is requesting
- Click **"Agree"** or **"Authorize"**

### Step 3: Return to App

After authorization, you'll be redirected back to the app. You should see:
- Your Spotify profile information (name, image)
- Premium status indicator
- Connection status showing you're signed in

## If You Get an Error

### "INVALID_CLIENT: Invalid redirect URI"

This means the redirect URI isn't configured correctly. Fix it:

1. **Create backend/.env file** (if not exists):
   ```bash
   cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
   nano .env
   ```
   
   Add this content:
   ```bash
   SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/api/auth/spotify/callback
   FRONTEND_URL=http://localhost:3000
   SPOTIFY_CLIENT_ID=a7e64af3aa2247a1b363727b4f640049
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   ```

2. **Update Spotify Dashboard**:
   - Go to: https://developer.spotify.com/dashboard
   - Click your app → "Edit Settings"
   - Add redirect URI: `http://127.0.0.1:8000/api/auth/spotify/callback`
   - Click "Save"

3. **Restart backend**:
   ```bash
   lsof -ti:8000 | xargs kill -9 2>/dev/null; cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

### "Connection Error" or "Network Error"

- Make sure backend is running: `http://localhost:8000`
- Check backend terminal for errors
- Make sure frontend can reach backend

## After Signing In

Once signed in, you'll have access to:
- ✅ Full track playback (if you have Premium)
- ✅ Album art from Spotify
- ✅ Play full tracks via Spotify Web Playback SDK
- ✅ Access to your Spotify playlists and library

## Sign Out

To disconnect from Spotify, click the "Disconnect" or "Sign Out" button in the Spotify login component.

## Troubleshooting

- **Button not working**: Check browser console for errors
- **Redirect errors**: Make sure `.env` file exists and backend was restarted
- **Premium features not working**: Make sure you have Spotify Premium account
- **Can't see button**: Make sure you're on a page that has the SpotifyLogin component

