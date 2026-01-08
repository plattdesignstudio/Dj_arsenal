# Railway Deployment Guide for DJ Arsenal Backend

This guide will walk you through deploying the DJ Arsenal backend to Railway.

## Prerequisites

1. A Railway account (sign up at https://railway.app)
2. GitHub account (if deploying from a repository)
3. All required API keys (see Environment Variables section)

## Step 1: Prepare Your Repository

### Option A: Deploy from GitHub

1. Push your code to GitHub (if not already done)
2. Make sure the `backend/` folder is in your repository

### Option B: Deploy from Local Directory

Railway CLI can deploy directly from your local directory.

## Step 2: Create Railway Project

1. Go to https://railway.app and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo" (if using GitHub) or "Empty Project" (if using CLI)

## Step 3: Add PostgreSQL Database

1. In your Railway project dashboard, click "New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically create a PostgreSQL database
4. Note the `DATABASE_URL` that Railway provides (you'll need this)

## Step 4: Configure Your Service

### If deploying from GitHub:

1. In your Railway project, click "New" → "GitHub Repo"
2. Select your repository
3. Railway will detect it's a Python project

### If using Railway CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Link to existing project (or create new)
railway link
```

## Step 5: Configure Build Settings

1. In Railway dashboard, go to your service settings
2. Set the following:

**Root Directory:**
```
backend
```

**Start Command:**
```
uvicorn main:app --host 0.0.0.0 --port $PORT
```

**Note:** Railway automatically sets the `$PORT` environment variable. Your app should listen on this port.

## Step 6: Set Environment Variables

In Railway dashboard, go to your service → Variables tab, and add:

### Required Variables:

```
DATABASE_URL=<Railway PostgreSQL URL>
```

Railway automatically provides this if you added PostgreSQL. It will be something like:
```
postgresql://postgres:password@hostname:5432/railway
```

### Optional but Recommended:

```
REDIS_URL=redis://default:password@hostname:6379
```

(Add Redis service in Railway if you want caching)

### API Keys (Required for full functionality):

```
OPENAI_API_KEY=your_openai_api_key_here
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://your-app.railway.app/api/auth/spotify/callback
FRONTEND_URL=https://your-frontend-url.com
SERPAPI_KEY=your_serpapi_key (optional, for trending tracks)
```

### Important Notes:

1. **SPOTIFY_REDIRECT_URI**: Must match exactly what you configured in Spotify Developer Dashboard
   - Format: `https://your-railway-app.railway.app/api/auth/spotify/callback`
   - Update this in your Spotify app settings at https://developer.spotify.com/dashboard

2. **FRONTEND_URL**: Your frontend deployment URL (if separate from backend)

3. **CORS**: You may need to update CORS origins in `main.py` to include your Railway domain

## Step 7: Update Database Configuration

The current `backend/app/database.py` forces SQLite. For Railway, you need PostgreSQL.

**Update `backend/app/database.py`:**

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Use DATABASE_URL from environment, default to SQLite for local dev
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dj_arsenal.db")

# SQLite requires check_same_thread=False for async operations
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

## Step 8: Update CORS Settings

Update `backend/main.py` to include your Railway domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "https://localhost:3000",
        "https://localhost:3001",
        "https://localhost:3002",
        "https://your-app.railway.app",  # Add your Railway domain
        "https://your-frontend-domain.com",  # Add your frontend domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Or use environment variable for dynamic CORS:

```python
import os

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Step 9: Create Procfile (Optional)

Create `backend/Procfile`:

```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Railway will auto-detect this.

## Step 10: Create runtime.txt (Optional)

Create `backend/runtime.txt` to specify Python version:

```
python-3.11
```

Or `python-3.10` depending on your requirements.

## Step 11: Deploy

### If using GitHub:

1. Railway will automatically deploy on every push to your main branch
2. Or click "Deploy" in Railway dashboard

### If using CLI:

```bash
cd backend
railway up
```

## Step 12: Run Database Migrations

After first deployment, run migrations:

1. In Railway dashboard, go to your service
2. Click "Deployments" → Latest deployment → "View Logs"
3. Or use Railway CLI:

```bash
railway run alembic upgrade head
```

Or connect to your service shell:

```bash
railway shell
alembic upgrade head
```

## Step 13: Initialize Event Types

After deployment, initialize event types:

```bash
curl -X POST https://your-app.railway.app/api/events/initialize
```

## Step 14: Verify Deployment

1. Check health endpoint:
   ```
   https://your-app.railway.app/health
   ```

2. Check API docs:
   ```
   https://your-app.railway.app/docs
   ```

3. Check root endpoint:
   ```
   https://your-app.railway.app/
   ```

## Troubleshooting

### Build Fails

- Check Railway build logs for specific errors
- Ensure all dependencies in `requirements.txt` are compatible
- Some packages like `librosa` may require system dependencies

### Database Connection Issues

- Verify `DATABASE_URL` is set correctly
- Check that PostgreSQL service is running
- Ensure database exists

### Port Issues

- Railway sets `$PORT` automatically - use this in your start command
- Don't hardcode port 8000

### CORS Errors

- Update CORS origins in `main.py` to include your frontend domain
- Check that `FRONTEND_URL` environment variable is set correctly

### Spotify OAuth Issues

- Verify `SPOTIFY_REDIRECT_URI` matches exactly in Spotify Dashboard
- Ensure `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are correct
- Check that redirect URI uses HTTPS (Railway provides HTTPS by default)

## Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (auto-provided by Railway) |
| `PORT` | Auto | Port to listen on (set by Railway) |
| `OPENAI_API_KEY` | Yes* | OpenAI API key for AI features |
| `SPOTIFY_CLIENT_ID` | Yes* | Spotify app client ID |
| `SPOTIFY_CLIENT_SECRET` | Yes* | Spotify app client secret |
| `SPOTIFY_REDIRECT_URI` | Yes* | Spotify OAuth redirect URI |
| `FRONTEND_URL` | Recommended | Frontend application URL |
| `REDIS_URL` | Optional | Redis connection string |
| `SERPAPI_KEY` | Optional | SerpAPI key for trending tracks |
| `CORS_ORIGINS` | Optional | Comma-separated list of allowed origins |

*Required for full functionality, but app will start without them

## Next Steps

1. Update your frontend to use the Railway backend URL
2. Configure custom domain in Railway (optional)
3. Set up monitoring and alerts
4. Configure auto-scaling if needed

## Additional Resources

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- FastAPI Deployment: https://fastapi.tiangolo.com/deployment/

