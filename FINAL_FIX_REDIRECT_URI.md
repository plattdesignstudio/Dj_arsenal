# FINAL FIX: Invalid Redirect URI Error

## The Problem

You're getting `INVALID_CLIENT: Invalid redirect URI` because either:
1. The `backend/.env` file doesn't exist, OR
2. The redirect URI in `.env` doesn't match Spotify Dashboard

## Complete Fix (Do ALL Steps)

### Step 1: Create backend/.env File

Navigate to the backend directory and create the `.env` file:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
```

Create the file using any text editor:

**Using nano:**
```bash
nano .env
```

**Using vim:**
```bash
vim .env
```

**Or use any text editor** (VS Code, TextEdit, etc.) and create the file at:
`/Users/PlattDESiGN/Desktop/DJ_BOOTH/backend/.env`

### Step 2: Add This Content to .env

Copy and paste this EXACT content:

```bash
SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/api/auth/spotify/callback
FRONTEND_URL=http://localhost:3000
SPOTIFY_CLIENT_ID=a7e64af3aa2247a1b363727b4f640049
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
```

**IMPORTANT**: 
- Use `127.0.0.1` (IP address), NOT `localhost`
- Replace `your_spotify_client_secret_here` with your actual Spotify client secret

**Save the file!**

### Step 3: Update Spotify Developer Dashboard

1. Go to: https://developer.spotify.com/dashboard
2. Click on your app
3. Click "Edit Settings"
4. Under "Redirect URIs":
   - **DELETE ALL existing entries** (click X to remove them)
   - **ADD new URI**: `http://127.0.0.1:8000/api/auth/spotify/callback`
   - Make sure it's EXACTLY: `http://127.0.0.1:8000/api/auth/spotify/callback`
5. Click "Save"

### Step 4: RESTART Backend (CRITICAL!)

After creating `.env`, you MUST restart the backend:

```bash
# Kill existing backend
lsof -ti:8000 | xargs kill -9 2>/dev/null

# Start backend
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**The backend will NOT read the .env file until you restart it!**

### Step 5: Verify

After restarting, check the backend logs. You should see it starting without errors.

Then try signing in to Spotify again.

## Checklist

Make sure you've done ALL of these:

- [ ] Created `backend/.env` file
- [ ] Added `SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/api/auth/spotify/callback` to `.env`
- [ ] Used `127.0.0.1` NOT `localhost`
- [ ] Updated Spotify Dashboard with `http://127.0.0.1:8000/api/auth/spotify/callback`
- [ ] **RESTARTED backend** after creating/updating `.env`
- [ ] The URLs match EXACTLY in both `.env` and Spotify Dashboard

## Verify .env File Exists

Check if the file exists:
```bash
ls -la /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend/.env
```

If it doesn't exist, create it following Step 1-2 above.

## Common Mistakes

❌ **Forgot to create .env file** - Backend uses default HTTP URL
❌ **Forgot to restart backend** - Changes don't take effect
❌ **Used localhost instead of 127.0.0.1** - Spotify doesn't allow localhost
❌ **URLs don't match exactly** - Must be identical in .env and Dashboard
❌ **Missing /api/auth/spotify/callback path** - Must include full path

## Example .env File

Your `backend/.env` should look exactly like this:

```bash
SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/api/auth/spotify/callback
FRONTEND_URL=http://localhost:3000
SPOTIFY_CLIENT_ID=a7e64af3aa2247a1b363727b4f640049
SPOTIFY_CLIENT_SECRET=your_actual_secret_here
```

## Still Not Working?

1. Double-check `.env` file exists: `ls -la backend/.env`
2. Verify content: `cat backend/.env` (if accessible)
3. Make sure backend was restarted AFTER creating .env
4. Check Spotify Dashboard has EXACT same URI
5. Try clearing browser cache/cookies
6. Check backend terminal for error messages

