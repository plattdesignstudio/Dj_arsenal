# Railway Environment Variables - Complete List

Copy and paste these into Railway dashboard → Your Service → Variables tab.

## 🔴 REQUIRED Variables

### Database (Auto-provided by Railway)
```
DATABASE_URL
```
**Note:** Railway automatically provides this when you add PostgreSQL. You don't need to set it manually, but it will be available.

### OpenAI API (Required for AI features)
```
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```
**Where to get it:** https://platform.openai.com/api-keys

### Spotify Integration (Required for Spotify features)
```
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REDIRECT_URI=https://your-app-name.railway.app/api/auth/spotify/callback
```
**Where to get them:**
1. Go to https://developer.spotify.com/dashboard
2. Create an app or use existing one
3. Copy Client ID and Client Secret
4. **IMPORTANT:** Add the redirect URI to your Spotify app's "Redirect URIs" list in the dashboard

**Note:** Replace `your-app-name` with your actual Railway app name. You'll get the exact URL after first deployment.

## 🟡 RECOMMENDED Variables

### Frontend URL
```
FRONTEND_URL=https://your-frontend-domain.com
```
**If frontend is separate:** Use your frontend deployment URL  
**If frontend is same domain:** Use your Railway app URL

### CORS Origins
```
CORS_ORIGINS=https://your-frontend-domain.com,https://your-app-name.railway.app
```
**Format:** Comma-separated list of allowed origins (no spaces after commas)

## 🟢 OPTIONAL Variables

### Redis (For caching - optional)
```
REDIS_URL=redis://default:password@hostname:6379
```
**Note:** Only needed if you add Redis service in Railway. Not required for basic functionality.

### SerpAPI (For trending tracks search - optional)
```
SERPAPI_KEY=your_serpapi_key_here
```
**Where to get it:** https://serpapi.com/ (optional, only for enhanced trending tracks)

## 📋 Complete Copy-Paste Template

Copy this entire block and fill in your values:

```
OPENAI_API_KEY=sk-your-key-here
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=https://your-app-name.railway.app/api/auth/spotify/callback
FRONTEND_URL=https://your-frontend-url.com
CORS_ORIGINS=https://your-frontend-url.com,https://your-app-name.railway.app
```

## 🔍 How to Find Your Railway App URL

1. After first deployment, go to Railway dashboard
2. Click on your service
3. Go to "Settings" → "Domains" tab
4. You'll see your Railway-provided domain (e.g., `your-app-name.railway.app`)
5. Use this for `SPOTIFY_REDIRECT_URI` and `CORS_ORIGINS`

## ⚠️ Important Notes

1. **DATABASE_URL** - Railway provides this automatically when you add PostgreSQL. Don't set it manually.

2. **SPOTIFY_REDIRECT_URI** - Must match EXACTLY what you put in Spotify Developer Dashboard:
   - Go to https://developer.spotify.com/dashboard
   - Click your app
   - Click "Edit Settings"
   - Add to "Redirect URIs": `https://your-app-name.railway.app/api/auth/spotify/callback`
   - Save

3. **CORS_ORIGINS** - No spaces after commas. Example:
   - ✅ Correct: `https://example.com,https://app.railway.app`
   - ❌ Wrong: `https://example.com, https://app.railway.app`

4. **PORT** - Railway sets this automatically. Don't set it manually.

## 🚀 Quick Setup Steps

1. Deploy your app first (even without all variables)
2. Get your Railway app URL from Settings → Domains
3. Update `SPOTIFY_REDIRECT_URI` with your actual Railway URL
4. Add that same URL to Spotify Developer Dashboard
5. Add all other variables
6. Redeploy if needed

## ✅ Verification Checklist

After adding variables, verify:
- [ ] `OPENAI_API_KEY` is set (starts with `sk-`)
- [ ] `SPOTIFY_CLIENT_ID` is set
- [ ] `SPOTIFY_CLIENT_SECRET` is set
- [ ] `SPOTIFY_REDIRECT_URI` matches your Railway domain
- [ ] `SPOTIFY_REDIRECT_URI` is added to Spotify Developer Dashboard
- [ ] `FRONTEND_URL` is set (if you have a separate frontend)
- [ ] `CORS_ORIGINS` includes your frontend URL (if separate)

