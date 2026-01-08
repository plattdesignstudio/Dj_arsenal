# Setting Up HTTPS for Spotify OAuth (Localhost)

## Problem

Spotify requires HTTPS for redirect URIs in production, but for localhost development, you have a few options.

## Solution Options

### Option 1: Use ngrok (Easiest - Recommended)

ngrok creates an HTTPS tunnel to your localhost, which Spotify will accept.

#### Step 1: Install ngrok
```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

#### Step 2: Start your backend
```bash
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### Step 3: Create HTTPS tunnel
```bash
ngrok http 8000
```

This will give you a URL like: `https://abc123.ngrok.io`

#### Step 4: Update Spotify Dashboard
1. Go to https://developer.spotify.com/dashboard
2. Click your app → "Edit Settings"
3. Add redirect URI:
   ```
   https://abc123.ngrok.io/api/auth/spotify/callback
   ```
   (Use your actual ngrok URL)
4. Click "Add" and "Save"

#### Step 5: Update backend/.env
```bash
SPOTIFY_REDIRECT_URI=https://abc123.ngrok.io/api/auth/spotify/callback
FRONTEND_URL=http://localhost:3000
```
(Use your actual ngrok URL)

#### Step 6: Restart backend

**Note**: ngrok URLs change each time you restart (unless you have a paid plan with a fixed domain). Free ngrok URLs are perfect for development/testing.

---

### Option 2: Self-Signed Certificate for Localhost (More Complex)

This requires generating SSL certificates and configuring your server.

#### Step 1: Generate Self-Signed Certificate

```bash
# Create certificates directory
mkdir -p backend/certs
cd backend/certs

# Generate private key
openssl genrsa -out localhost.key 2048

# Generate certificate signing request
openssl req -new -key localhost.key -out localhost.csr \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -days 365 -in localhost.csr -signkey localhost.key \
  -out localhost.crt -extensions v3_req -extfile <(
    echo '[v3_req]'
    echo 'subjectAltName = @alt_names'
    echo '[alt_names]'
    echo 'DNS.1 = localhost'
    echo 'IP.1 = 127.0.0.1'
  )
```

#### Step 2: Update Backend to Use HTTPS

You'll need to modify the backend to use uvicorn with SSL or use a reverse proxy. This is complex and ngrok is easier.

---

### Option 3: Check Spotify Settings

Some Spotify apps allow HTTP for localhost in development mode. Check your Spotify app settings:
1. Go to https://developer.spotify.com/dashboard
2. Click your app → "Edit Settings"
3. Look for any settings about "Allow HTTP for localhost" or "Development mode"

---

## Recommended: Use ngrok

For development, **ngrok is the easiest solution**:
- ✅ Quick setup (2 minutes)
- ✅ Real HTTPS (Spotify accepts it)
- ✅ No certificate management
- ✅ Works immediately

### Quick ngrok Setup:

```bash
# 1. Install ngrok
brew install ngrok

# 2. Start backend
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 3. In another terminal, start ngrok
ngrok http 8000

# 4. Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# 5. Add to Spotify Dashboard: https://abc123.ngrok.io/api/auth/spotify/callback
# 6. Update backend/.env with the ngrok URL
# 7. Restart backend
```

### Updating Redirect URI After ngrok Restart

If you restart ngrok and get a new URL, you'll need to:
1. Update Spotify Dashboard with the new ngrok URL
2. Update backend/.env with the new URL
3. Restart backend

For a fixed domain (no changes on restart), consider ngrok's paid plan or use Option 2 with a proper certificate setup.
