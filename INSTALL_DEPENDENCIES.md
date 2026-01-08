# Install Python Dependencies

## Problem
Getting `ModuleNotFoundError: No module named 'librosa'` when starting backend.

## Quick Fix

### Option 1: Install All Dependencies (Recommended)
```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
pip install -r requirements.txt
```

### Option 2: Install Minimal Dependencies (Faster)
```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
pip install -r requirements-minimal.txt
```

### Option 3: Install Just librosa
```bash
pip install librosa soundfile
```

## Using Virtual Environment (Recommended)

1. **Create virtual environment:**
   ```bash
   cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
   python3 -m venv venv
   ```

2. **Activate virtual environment:**
   ```bash
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start backend:**
   ```bash
   python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

## What Was Fixed

The backend now handles missing `librosa` gracefully:
- ✅ Backend can start without librosa
- ✅ Audio analysis features are disabled if librosa is missing
- ✅ Clear warning message if librosa is not installed
- ✅ Other features work normally

## Required Dependencies

### Core (Always Required)
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `python-dotenv` - Environment variables
- `pydantic` - Data validation
- `sqlalchemy` - Database ORM

### Optional (For Audio Analysis)
- `librosa` - Audio analysis
- `soundfile` - Audio file I/O
- `numpy` - Numerical computing
- `scipy` - Scientific computing

### Optional (For Advanced Features)
- `openai` - AI features
- `redis` - Caching
- `google-search-results` - Search API

## Troubleshooting

### Permission Errors
If you get permission errors:
```bash
pip install --user -r requirements.txt
```

### macOS Specific Issues
librosa requires system libraries on macOS:
```bash
# Install system dependencies (if needed)
brew install libsndfile
pip install librosa soundfile
```

### Python Version
Make sure you're using Python 3.8+:
```bash
python3 --version
```

## Verify Installation

After installing, verify:
```bash
python3 -c "import librosa; print('librosa installed successfully')"
```

## Start Backend

Once dependencies are installed:
```bash
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

If librosa is missing, you'll see:
```
Warning: librosa not installed. Audio analysis features will be disabled.
```

But the backend will still start and work for other features!

