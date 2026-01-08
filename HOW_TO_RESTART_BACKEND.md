# How to Restart Backend

## Quick Steps

### Step 1: Stop the Backend (if running)

If the backend is running in a terminal:
- Go to that terminal window
- Press `Ctrl+C` to stop it

Or kill the process on port 8000:
```bash
lsof -ti:8000 | xargs kill -9
```

### Step 2: Start the Backend

Navigate to backend directory and start the server:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## All-in-One Command

If port 8000 is already in use, use this command to kill it and restart:

```bash
lsof -ti:8000 | xargs kill -9 2>/dev/null; cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## What You Should See

After starting, you should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [XXXXX] using StatReload
INFO:     Started server process [XXXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## Important Notes

- **After updating `.env` file**: Always restart backend for changes to take effect
- **Keep terminal open**: Backend needs to keep running
- **Stop backend**: Press `Ctrl+C` in the terminal where it's running

## Verify Backend is Running

You can check if backend is running:
```bash
curl http://localhost:8000/health
```

Or check if port 8000 is in use:
```bash
lsof -i:8000
```

