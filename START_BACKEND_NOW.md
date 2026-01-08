# Start Backend Server - Quick Guide

## ✅ Current Status
Backend is **NOT running** on port 8000.

## 🚀 Start Backend (Do This Now)

### Step 1: Open Terminal
Open a new terminal window.

### Step 2: Navigate to Backend Directory
```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
```

### Step 3: Start the Server
```bash
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 4: Wait for Startup
You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Step 5: Keep Terminal Open
**IMPORTANT:** Don't close this terminal! The backend needs to keep running.

## ✅ Verify It's Working

In a **new terminal window**, test:

```bash
curl http://localhost:8000/health
```

Should return: `{"status":"healthy"}`

## 🔧 If You Get Errors

### Error: "ModuleNotFoundError: No module named 'librosa'"
**Solution:** The backend will still start! You'll see:
```
Warning: librosa not installed. Audio analysis features will be disabled.
```
This is OK - other features will work.

### Error: "port already in use"
**Solution:**
```bash
# Kill existing process
lsof -ti:8000 | xargs kill -9

# Then start again
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Error: "No module named 'fastapi'"
**Solution:**
```bash
pip install -r requirements.txt
# or minimal:
pip install fastapi uvicorn python-dotenv pydantic sqlalchemy
```

## 📱 After Backend Starts

1. **Refresh your browser** (F5 or Cmd+R)
2. **Errors should disappear**
3. **Tracks should load**
4. **Spotify tracks should work**

## 🎯 Quick Test

Once backend is running, test these:

```bash
# Health check (should be fast)
curl http://localhost:8000/health

# Get tracks (may return empty array)
curl http://localhost:8000/api/tracks

# Get Spotify trending
curl http://localhost:8000/api/trending/spotify
```

## 💡 Pro Tip

Use the start script:
```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
./start-servers.sh
```

This starts both backend AND frontend automatically!

## ⚠️ Remember

- Keep the backend terminal open
- Backend must stay running for frontend to work
- Press Ctrl+C to stop the backend when done

