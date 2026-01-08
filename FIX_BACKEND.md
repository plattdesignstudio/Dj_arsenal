# Fix Backend Server Connection Issues

## Problem
The frontend is getting `ERR_NETWORK_IO_SUSPENDED` errors because the backend server at `http://localhost:8000` is not running or not responding.

## Quick Fix

### Option 1: Restart Backend Server (Recommended)

1. **Stop any existing backend process:**
   ```bash
   # Kill process on port 8000
   lsof -ti:8000 | xargs kill -9
   ```

2. **Start the backend server:**
   ```bash
   cd backend
   
   # Activate virtual environment if you have one
   source venv/bin/activate  # or: source .venv/bin/activate
   
   # Start the server
   python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

3. **Verify it's running:**
   - Open http://localhost:8000/docs in your browser
   - You should see the FastAPI documentation page

### Option 2: Use the Start Script

If you have the `start-servers.sh` script:

```bash
./start-servers.sh
```

Or if that doesn't work:

```bash
bash start-servers.sh
```

### Option 3: Manual Terminal Commands

Open a new terminal window and run:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Keep this terminal open - the server needs to keep running.

## Verify Backend is Working

1. Check if backend is responding:
   ```bash
   curl http://localhost:8000/health
   ```
   
   Should return: `{"status":"healthy"}`

2. Check API docs:
   - Open http://localhost:8000/docs in your browser
   - You should see the FastAPI Swagger UI

## Common Issues

### Port 8000 Already in Use
If you get "port already in use" error:

```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9

# Then start again
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Python/uvicorn Not Found
Make sure you have the dependencies installed:

```bash
cd backend
pip install -r requirements.txt
# or
pip install fastapi uvicorn
```

### Virtual Environment Issues
If you're using a virtual environment:

```bash
cd backend
source venv/bin/activate  # or: source .venv/bin/activate
pip install -r requirements.txt
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## After Backend is Running

Once the backend is running, refresh your frontend (http://localhost:3000) and the network errors should be resolved.

The backend should show output like:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

