# Install librosa to Fix ModuleNotFoundError

## Problem
You're getting: `ModuleNotFoundError: No module named 'librosa'`

## Solution: Install librosa

### Option 1: Install librosa and soundfile (Recommended)

```bash
pip3 install librosa soundfile
```

### Option 2: Install All Requirements

If you want to install all dependencies from requirements.txt:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
pip3 install -r requirements.txt
```

This will install all dependencies including librosa.

### Option 3: Using Python Module Installer

```bash
python3 -m pip install librosa soundfile
```

## After Installation

After installing librosa, restart your backend:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## What is librosa?

librosa is a Python package for audio and music analysis. It's used in the backend for:
- BPM detection
- Key detection
- Energy analysis
- Audio feature extraction

## Note

The code has been made to handle missing librosa gracefully (it will show a warning), but if you're getting an import error, it means something is trying to import it before the optional check. Installing it will fix the issue.

## If Installation Fails

If you get errors installing librosa:

1. **Make sure you have pip**: `pip3 --version`
2. **Upgrade pip**: `pip3 install --upgrade pip`
3. **Try with --user flag**: `pip3 install --user librosa soundfile`
4. **Use virtual environment** (recommended):
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install librosa soundfile
   ```

