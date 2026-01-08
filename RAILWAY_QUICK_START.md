# Railway Deployment - Quick Start

## TL;DR - Deploy in 5 Minutes

### 1. Create Railway Project
- Go to https://railway.app
- Click "New Project" → "Deploy from GitHub repo"
- Select your repository

### 2. Add PostgreSQL
- In Railway dashboard: "New" → "Database" → "Add PostgreSQL"
- Railway auto-provides `DATABASE_URL` environment variable

### 3. Configure Service
- Set **Root Directory**: `backend`
- Railway auto-detects Python and installs dependencies

### 4. Set Environment Variables
Add these in Railway dashboard → Variables:

```
OPENAI_API_KEY=your_key_here
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=https://your-app.railway.app/api/auth/spotify/callback
FRONTEND_URL=https://your-frontend-url.com
CORS_ORIGINS=https://your-frontend-url.com,https://your-app.railway.app
```

**Important:** Update `SPOTIFY_REDIRECT_URI` in Spotify Developer Dashboard to match!

### 5. Deploy
- Railway auto-deploys on git push
- Or click "Deploy" in dashboard

### 6. Run Migrations
After first deployment:

```bash
railway run alembic upgrade head
```

Or via Railway dashboard → Service → Deployments → Run Command

### 7. Initialize Events
```bash
curl -X POST https://your-app.railway.app/api/events/initialize
```

## Verify Deployment

- Health: `https://your-app.railway.app/health`
- API Docs: `https://your-app.railway.app/docs`

## Common Issues

**Build fails?** Check logs in Railway dashboard

**Database errors?** Verify `DATABASE_URL` is set (auto-provided by Railway PostgreSQL)

**CORS errors?** Add your frontend URL to `CORS_ORIGINS` environment variable

**Spotify OAuth fails?** Ensure `SPOTIFY_REDIRECT_URI` matches exactly in Spotify Dashboard

## Full Guide

See `RAILWAY_DEPLOYMENT.md` for detailed instructions.

