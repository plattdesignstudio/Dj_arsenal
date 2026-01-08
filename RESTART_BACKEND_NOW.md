# How to Restart Backend

## Quick Steps

### 1. Stop Backend (if running)
- Go to the terminal where backend is running
- Press `Ctrl+C` to stop it

### 2. Start Backend
```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
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

## Important Notes

- **After updating `.env` file**: Always restart backend for changes to take effect
- **If using ngrok**: Keep ngrok running in a separate terminal (`ngrok http 8000`)
- **Backend runs on**: `http://localhost:8000`

## Verify .env is Loaded

After restarting, you can check if your `.env` file is being read by looking at the backend logs. If you set `SPOTIFY_REDIRECT_URI` in `.env`, the backend should use that URL when initiating Spotify OAuth.

## Troubleshooting

- **Port already in use**: Another process is using port 8000. Find and kill it: `lsof -ti:8000 | xargs kill -9`
- **Module errors**: Make sure you're in the `backend` directory and dependencies are installed
- **.env not loading**: Make sure the file is named `.env` (not `.env.txt`) and is in the `backend/` directory

