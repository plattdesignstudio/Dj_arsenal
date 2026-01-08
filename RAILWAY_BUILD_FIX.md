# Fix Railway Build Failure - scipy/gfortran Issue

## Problem
Railway build is failing because `scipy` requires `gfortran` (Fortran compiler) to build from source, but Railway's build environment doesn't have it.

## Solution Options

### Option 1: Use Minimal Requirements (Recommended - Quick Fix)

**This will deploy successfully but audio analysis features will be disabled.**

1. In Railway dashboard, go to your service → Settings
2. Find "Build Command" or create a build script
3. Set it to use the minimal requirements:

**Or rename the file:**
- Rename `requirements.txt` to `requirements-full.txt`
- Rename `requirements-railway.txt` to `requirements.txt`
- Commit and push

The minimal requirements file excludes:
- `scipy` (requires gfortran)
- `librosa` (requires scipy)
- `essentia`, `keyfinder`, `aubio` (audio processing)

**Your app will still work!** The code already handles missing libraries gracefully.

### Option 2: Install System Dependencies (For Full Audio Features)

If you need audio analysis features, you need to install system dependencies.

1. Create or update `backend/nixpacks.toml`:

```toml
[phases.setup]
nixPkgs = ["python311", "gfortran", "fftw", "libsndfile"]

[phases.install]
cmds = [
  "pip install --upgrade pip",
  "pip install -r requirements.txt"
]

[start]
cmd = "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"
```

2. Commit and push
3. Railway should detect nixpacks.toml and use it

**Note:** This will make builds slower and may still have issues with some packages.

### Option 3: Use Pre-built Wheels (Alternative)

Update `requirements.txt` to use versions with pre-built wheels:

```txt
# Replace scipy line with:
scipy>=1.11.0  # Newer versions may have pre-built wheels
```

But this may not work if Railway's Python version doesn't have compatible wheels.

## Recommended: Quick Fix (Option 1)

**Steps:**

1. **Backup your current requirements:**
   ```bash
   cd backend
   cp requirements.txt requirements-full.txt
   ```

2. **Use the minimal requirements:**
   ```bash
   cp requirements-railway.txt requirements.txt
   ```

3. **Commit and push:**
   ```bash
   git add backend/requirements.txt backend/requirements-full.txt
   git commit -m "Use minimal requirements for Railway deployment"
   git push
   ```

4. **Railway will automatically redeploy**

5. **Verify it works:**
   - Check Railway logs - should build successfully
   - Test your API: `https://your-app.railway.app/health`
   - Audio analysis endpoints will return errors, but core features work

## What Features Still Work?

✅ **All Core Features:**
- API endpoints
- Database operations
- Spotify integration
- OpenAI AI features
- Track management
- Playlist management
- Sets management
- Flow engine
- Harmonic mixing (without audio analysis)

❌ **Disabled Features:**
- Audio file BPM detection
- Audio file key detection
- Audio file energy analysis
- Real-time audio processing

**Note:** You can still manually set BPM, key, and energy for tracks - they just won't be auto-detected from audio files.

## Restore Full Features Later

If you want audio analysis later:

1. Use Option 2 (nixpacks.toml with system dependencies)
2. Or deploy to a platform that supports system dependencies better (like Render, Fly.io, or a VPS)
3. Or use a separate microservice for audio analysis

## Current Status

After applying Option 1, your app will:
- ✅ Deploy successfully on Railway
- ✅ All API endpoints work
- ✅ Database operations work
- ✅ Spotify integration works
- ✅ AI features work
- ⚠️ Audio analysis returns "not available" errors (gracefully handled)

