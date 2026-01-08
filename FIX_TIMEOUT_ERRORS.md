# Fix: Request Timeout Errors

## Problem
Getting `AxiosError: timeout of 10000ms exceeded` or `ECONNABORTED` errors when loading tracks.

## Root Causes

### 1. Backend Not Running
- Most common cause
- Backend server is not started or crashed

### 2. Backend Too Slow
- Backend is running but taking too long to respond
- Database queries are slow
- Network issues

### 3. Port Conflict
- Another process is using port 8000
- Backend can't bind to the port

## Quick Fix

### Step 1: Check if Backend is Running

```bash
# Check if something is listening on port 8000
lsof -ti:8000

# Or test the health endpoint
curl http://localhost:8000/health
```

### Step 2: Start Backend Server

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 3: Verify Backend is Responding

```bash
# Test health endpoint (should be fast)
curl http://localhost:8000/health

# Test tracks endpoint
curl http://localhost:8000/api/tracks
```

## What Was Fixed

### 1. Increased Timeout
- Changed from 10 seconds to 30 seconds
- Gives backend more time to respond
- Better for slower connections

### 2. Better Error Handling
- Detects timeout errors specifically
- Shows clear error messages
- Provides troubleshooting steps

### 3. Improved User Feedback
- Toast notifications for timeout errors
- Clear instructions on what to do
- Less console noise

## Troubleshooting

### Backend Not Starting

1. **Check for port conflicts:**
   ```bash
   lsof -ti:8000 | xargs kill -9
   ```

2. **Check Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Check for errors in backend logs:**
   - Look at the terminal where backend is running
   - Check for import errors or missing modules

### Backend Running But Slow

1. **Check database:**
   - Database might be locked or slow
   - Check database file permissions

2. **Check backend logs:**
   - Look for slow queries
   - Check for errors

3. **Restart backend:**
   ```bash
   # Stop backend (Ctrl+C)
   # Start again
   python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Still Timing Out

1. **Increase timeout further** (if needed):
   - Edit `lib/api.ts`
   - Change `timeout: 30000` to higher value

2. **Check network:**
   - Firewall blocking connections?
   - VPN interfering?

3. **Try different port:**
   - Change backend port to 8001
   - Update `API_URL` in `lib/api.ts`

## Verification

After fixing, verify:

1. **Backend health check:**
   ```bash
   curl http://localhost:8000/health
   ```
   Should return quickly: `{"status":"healthy"}`

2. **Tracks endpoint:**
   ```bash
   curl http://localhost:8000/api/tracks
   ```
   Should return JSON array (may be empty `[]`)

3. **Frontend:**
   - Refresh browser
   - Errors should disappear
   - Tracks should load

## Expected Behavior

### If Backend is Running:
- Requests complete within 30 seconds
- Tracks load successfully
- No timeout errors

### If Backend is Not Running:
- Timeout after 30 seconds
- Clear error message
- Instructions to start backend

## Quick Reference

**Start Backend:**
```bash
cd backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Check Backend:**
```bash
curl http://localhost:8000/health
```

**Kill Process on Port 8000:**
```bash
lsof -ti:8000 | xargs kill -9
```

