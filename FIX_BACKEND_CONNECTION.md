# Fix: AxiosError - Backend Connection Issues

## Problem
Getting `AxiosError` messages for:
- Failed to load dashboard
- Failed to load tracks
- Failed to load personas

## Root Cause
**Backend server is not running or not accessible on `http://localhost:8000`**

## Quick Fix

### Step 1: Start Backend Server

Open a terminal and run:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 2: Verify Backend is Running

1. **Check health endpoint:**
   ```bash
   curl http://localhost:8000/health
   ```
   Should return: `{"status":"healthy"}`

2. **Check API docs:**
   - Open: http://localhost:8000/docs
   - Should show FastAPI Swagger UI

3. **Check root endpoint:**
   ```bash
   curl http://localhost:8000/
   ```
   Should return: `{"message":"DJ Arsenal API","status":"operational"}`

### Step 3: Refresh Frontend

Once backend is running:
1. Refresh your browser (F5 or Cmd+R)
2. Errors should disappear
3. Data should load normally

## Using the Start Script

Alternatively, use the provided script:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
./start-servers.sh
```

This starts both backend and frontend.

## Expected Backend Output

When backend starts successfully, you should see:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## Troubleshooting

### Port Already in Use

If you get "port already in use":

```bash
# Kill existing process
lsof -ti:8000 | xargs kill -9

# Then start again
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Python/uvicorn Not Found

Install dependencies:

```bash
cd backend
pip install -r requirements.txt
```

### Virtual Environment

If using a virtual environment:

```bash
cd backend
source venv/bin/activate  # or: source .venv/bin/activate
pip install -r requirements.txt
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Error Messages Explained

### `ERR_NETWORK`
- Backend server is not running
- Network connection failed
- **Fix:** Start backend server

### `ECONNREFUSED`
- Connection refused by backend
- Backend not listening on port 8000
- **Fix:** Start backend server

### `ERR_NETWORK_IO_SUSPENDED`
- Network I/O suspended
- Usually means backend is not running
- **Fix:** Start backend server

## Prevention

### Keep Backend Running
- Keep the terminal window open where backend is running
- Don't close the terminal or press Ctrl+C
- Backend needs to stay running for frontend to work

### Auto-Start Script
Use `start-servers.sh` to start both servers:
```bash
./start-servers.sh
```

## Verification Checklist

- [ ] Backend terminal shows "Uvicorn running"
- [ ] http://localhost:8000/docs opens successfully
- [ ] `curl http://localhost:8000/health` returns `{"status":"healthy"}`
- [ ] Frontend errors disappear after refresh
- [ ] Data loads in the app

## Still Not Working?

1. **Check backend logs** for specific errors
2. **Verify Python version:** `python3 --version` (should be 3.8+)
3. **Check dependencies:** `pip list | grep uvicorn`
4. **Try different port:** Change port in backend command and update `API_URL` in `lib/api.ts`
5. **Check firewall:** Make sure port 8000 is not blocked

## Quick Reference

**Start Backend:**
```bash
cd backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Check Backend:**
```bash
curl http://localhost:8000/health
```

**Stop Backend:**
Press `Ctrl+C` in the terminal where backend is running

