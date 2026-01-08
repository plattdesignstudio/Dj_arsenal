# Complete Environment Variables Guide for Railway Deployment

Yes, your frontend and backend variables are **different**! Here's the complete breakdown:

## 🎯 Quick Answer

**Frontend** needs to know: **Where is the backend?**  
**Backend** needs to know: **Where is the frontend?** (for CORS and redirects)

---

## 📱 FRONTEND Variables

### If deploying frontend separately (Vercel, Netlify, etc.)

Add this to your frontend deployment platform:

```
NEXT_PUBLIC_API_URL=https://your-backend-app.railway.app
```

**Where to set:**
- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Environment Variables
- **Railway** (if deploying frontend on Railway): Service → Variables

**Example:**
```
NEXT_PUBLIC_API_URL=https://dj-arsenal-backend.railway.app
```

---

## 🔧 BACKEND Variables (Railway)

Add these to your **Railway backend service** → Variables tab:

### Required

```
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REDIRECT_URI=https://your-backend-app.railway.app/api/auth/spotify/callback
```

### Recommended

```
FRONTEND_URL=https://your-frontend-app.vercel.app
CORS_ORIGINS=https://your-frontend-app.vercel.app,https://your-backend-app.railway.app
```

### Auto-Provided by Railway

```
DATABASE_URL=postgresql://... (Railway provides this automatically)
PORT=... (Railway sets this automatically)
```

---

## 📊 Variable Comparison Table

| Variable | Frontend | Backend | Purpose |
|----------|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | ✅ **Required** | ❌ No | Frontend needs to know backend URL |
| `DATABASE_URL` | ❌ No | ✅ Auto-provided | Backend database connection |
| `OPENAI_API_KEY` | ❌ No | ✅ **Required** | AI features |
| `SPOTIFY_CLIENT_ID` | ❌ No | ✅ **Required** | Spotify integration |
| `SPOTIFY_CLIENT_SECRET` | ❌ No | ✅ **Required** | Spotify integration |
| `SPOTIFY_REDIRECT_URI` | ❌ No | ✅ **Required** | Spotify OAuth callback (backend URL) |
| `FRONTEND_URL` | ❌ No | ✅ Recommended | Backend needs to know frontend URL for redirects |
| `CORS_ORIGINS` | ❌ No | ✅ Recommended | Backend allows frontend to make requests |

---

## 🔄 How They Work Together

```
┌─────────────────┐                    ┌─────────────────┐
│   FRONTEND      │                    │    BACKEND      │
│  (Vercel/etc)   │                    │   (Railway)     │
│                 │                    │                 │
│ NEXT_PUBLIC_    │ ────API Calls────> │ DATABASE_URL    │
│ API_URL=        │                    │ OPENAI_API_KEY  │
│ https://...     │ <───JSON Response──│ SPOTIFY_*       │
│                 │                    │ FRONTEND_URL    │
│                 │                    │ CORS_ORIGINS    │
└─────────────────┘                    └─────────────────┘
```

---

## 📝 Step-by-Step Setup

### Step 1: Deploy Backend to Railway
1. Get your Railway backend URL: `https://your-backend-app.railway.app`
2. Add backend variables (see above)

### Step 2: Update Backend Variables
In Railway backend service → Variables:
```
SPOTIFY_REDIRECT_URI=https://your-backend-app.railway.app/api/auth/spotify/callback
FRONTEND_URL=https://your-frontend-app.vercel.app
CORS_ORIGINS=https://your-frontend-app.vercel.app,https://your-backend-app.railway.app
```

### Step 3: Deploy Frontend
1. Deploy frontend to Vercel/Netlify/etc.
2. Get your frontend URL: `https://your-frontend-app.vercel.app`
3. Add frontend variable:
```
NEXT_PUBLIC_API_URL=https://your-backend-app.railway.app
```

### Step 4: Update Spotify Dashboard
1. Go to https://developer.spotify.com/dashboard
2. Edit your app settings
3. Add redirect URI: `https://your-backend-app.railway.app/api/auth/spotify/callback`

---

## 🎯 Real Example

Let's say:
- **Backend Railway URL**: `https://dj-arsenal-api.railway.app`
- **Frontend Vercel URL**: `https://dj-arsenal.vercel.app`

### Frontend (Vercel) Variables:
```
NEXT_PUBLIC_API_URL=https://dj-arsenal-api.railway.app
```

### Backend (Railway) Variables:
```
OPENAI_API_KEY=sk-...
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REDIRECT_URI=https://dj-arsenal-api.railway.app/api/auth/spotify/callback
FRONTEND_URL=https://dj-arsenal.vercel.app
CORS_ORIGINS=https://dj-arsenal.vercel.app,https://dj-arsenal-api.railway.app
```

### Spotify Dashboard:
- Redirect URI: `https://dj-arsenal-api.railway.app/api/auth/spotify/callback`

---

## ⚠️ Important Notes

1. **Frontend `NEXT_PUBLIC_API_URL`** must point to your **Railway backend URL**

2. **Backend `SPOTIFY_REDIRECT_URI`** must point to your **Railway backend URL** (not frontend!)

3. **Backend `FRONTEND_URL`** must point to your **frontend deployment URL** (Vercel/Netlify/etc.)

4. **Backend `CORS_ORIGINS`** must include your **frontend URL** so the frontend can make API calls

5. **Spotify Dashboard** redirect URI must match **backend `SPOTIFY_REDIRECT_URI`** exactly

---

## ✅ Verification Checklist

After setting up:

- [ ] Frontend has `NEXT_PUBLIC_API_URL` pointing to Railway backend
- [ ] Backend has all required variables set
- [ ] Backend `SPOTIFY_REDIRECT_URI` uses Railway backend URL
- [ ] Backend `FRONTEND_URL` uses frontend deployment URL
- [ ] Backend `CORS_ORIGINS` includes frontend URL
- [ ] Spotify Dashboard redirect URI matches backend `SPOTIFY_REDIRECT_URI`
- [ ] Both services are deployed and running

---

## 🐛 Common Mistakes

❌ **Wrong**: Frontend `NEXT_PUBLIC_API_URL` pointing to localhost  
✅ **Right**: Frontend `NEXT_PUBLIC_API_URL` pointing to Railway backend

❌ **Wrong**: Backend `SPOTIFY_REDIRECT_URI` pointing to frontend URL  
✅ **Right**: Backend `SPOTIFY_REDIRECT_URI` pointing to Railway backend URL

❌ **Wrong**: Backend `CORS_ORIGINS` missing frontend URL  
✅ **Right**: Backend `CORS_ORIGINS` includes frontend URL

❌ **Wrong**: Spotify Dashboard redirect URI doesn't match backend  
✅ **Right**: Spotify Dashboard redirect URI matches backend exactly

