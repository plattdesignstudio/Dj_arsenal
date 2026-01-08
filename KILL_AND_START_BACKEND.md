# Kill Process on Port 8000 and Start Backend

## Quick Fix

Run this command to kill the process on port 8000 and start the backend:

```bash
lsof -ti:8000 | xargs kill -9 2>/dev/null; cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

This will:
1. Find the process using port 8000
2. Kill it
3. Navigate to backend directory
4. Start the backend server

## Step by Step (Alternative)

If you prefer to do it step by step:

### Step 1: Kill process on port 8000
```bash
lsof -ti:8000 | xargs kill -9
```

### Step 2: Navigate to backend
```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
```

### Step 3: Start backend
```bash
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Verify Port is Free

Before starting, you can check if port 8000 is free:

```bash
lsof -i:8000
```

If nothing is returned, the port is free. If something is returned, kill it first.

## Expected Output After Starting

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [XXXXX] using StatReload
INFO:     Started server process [XXXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## Troubleshooting

- **"Permission denied"**: You might need to use `sudo` (not recommended, but if needed: `sudo lsof -ti:8000 | xargs kill -9`)
- **Port still in use after kill**: Wait a few seconds, then try starting again
- **Multiple processes**: The kill command will kill all processes on port 8000

