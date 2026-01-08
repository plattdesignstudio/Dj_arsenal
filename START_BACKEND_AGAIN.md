# Start Backend in New Terminal

## Your Terminal Session Ended

The terminal session has completed. You'll need to open a new terminal window to start the backend.

## Steps to Start Backend

### 1. Open a New Terminal Window

Open Terminal (or iTerm, or your preferred terminal app).

### 2. Navigate to Backend Directory

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
```

### 3. Start the Backend

```bash
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## What You Should See

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [XXXXX] using StatReload
INFO:     Started server process [XXXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## Important Reminders

1. **If using ngrok**: Make sure ngrok is running in another terminal:
   ```bash
   ngrok http 8000
   ```

2. **If you created backend/.env**: The backend will read it on startup

3. **Keep the terminal open**: The backend needs to keep running

## Quick Start Command

You can copy and paste this entire command:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## If Port 8000 is Still in Use

If you get "Address already in use" error:

```bash
# Kill the process on port 8000
lsof -ti:8000 | xargs kill -9

# Then start backend again
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

