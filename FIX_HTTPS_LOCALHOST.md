# Fix: ERR_SSL_PROTOCOL_ERROR - localhost HTTPS Issue

## The Problem

You're getting `ERR_SSL_PROTOCOL_ERROR` because:
- Your frontend is running on `http://localhost:3000` (HTTP)
- But the code is trying to use `https://localhost:3000` (HTTPS)
- Localhost doesn't have SSL certificates by default

## Solution Options

### Option 1: Use HTTP for Localhost (Simplest)

If Spotify allows HTTP for localhost (some apps do), switch back to HTTP:

1. **Update `backend/.env`:**
   ```env
   SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/spotify/callback
   FRONTEND_URL=http://localhost:3000
   ```

2. **Update Spotify Dashboard:**
   - Go to Spotify Dashboard → Your App → Edit Settings
   - Change redirect URI to: `http://localhost:3000/api/auth/spotify/callback`
   - Save

3. **Update backend code default:**
   The code will use HTTP if you set it in `.env`

4. **Restart backend:**
   ```bash
   cd backend
   # Ctrl+C to stop
   python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Option 2: Use ngrok for HTTPS Tunnel (Recommended if Spotify Requires HTTPS)

If Spotify requires HTTPS, use ngrok to create an HTTPS tunnel:

1. **Install ngrok:**
   ```bash
   brew install ngrok
   # Or download from https://ngrok.com
   ```

2. **Start your frontend on HTTP (port 3000):**
   ```bash
   npm run dev
   ```

3. **In another terminal, start ngrok:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL** ngrok gives you (e.g., `https://abc123.ngrok.io`)

5. **Update Spotify Dashboard:**
   - Redirect URI: `https://abc123.ngrok.io/api/auth/spotify/callback`

6. **Update `backend/.env`:**
   ```env
   SPOTIFY_REDIRECT_URI=https://abc123.ngrok.io/api/auth/spotify/callback
   FRONTEND_URL=https://abc123.ngrok.io
   ```

7. **Restart backend**

**Note:** ngrok URLs change each time you restart it (unless you have a paid plan with a fixed domain).

### Option 3: Next.js Experimental HTTPS (If Needed)

If you want to run Next.js with HTTPS locally:

1. **Install local certificate tool:**
   ```bash
   brew install mkcert
   mkcert -install
   ```

2. **Create certificates:**
   ```bash
   cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
   mkcert localhost 127.0.0.1 ::1
   # This creates localhost.pem and localhost-key.pem
   ```

3. **Update `package.json`:**
   ```json
   {
     "scripts": {
       "dev": "next dev --experimental-https --experimental-https-key localhost-key.pem --experimental-https-cert localhost.pem"
     }
   }
   ```

4. **Restart frontend:**
   ```bash
   npm run dev
   ```

5. **Accept browser security warning** (it's safe for localhost)

## Quick Fix: Try HTTP First

Since you're getting SSL errors, let's try HTTP first:

1. **Update `backend/.env`:**
   ```env
   SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/spotify/callback
   FRONTEND_URL=http://localhost:3000
   ```

2. **Update Spotify Dashboard redirect URI to:** `http://localhost:3000/api/auth/spotify/callback`

3. **Restart backend**

4. **Try again**

If Spotify rejects HTTP, then use Option 2 (ngrok) or Option 3 (Next.js HTTPS).

