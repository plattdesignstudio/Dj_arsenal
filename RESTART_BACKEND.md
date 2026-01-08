# How to Restart Backend

## Quick Restart

### If backend is currently running:

1. **Stop the server**: Press `Ctrl+C` in the terminal where backend is running

2. **Start it again**:
   ```bash
   cd backend
   python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Full Command

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## What This Does

- `--host 0.0.0.0` - Allows connections from any IP (including ngrok)
- `--port 8000` - Runs on port 8000
- `--reload` - Auto-reloads when code changes (useful for development)

## Verify Backend is Running

You should see output like:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## Important Notes

- **Keep ngrok running** if you're using it for HTTPS
- **Check your .env file** is updated with the ngrok HTTPS URL
- Backend must be running for the app to work

## Troubleshooting

- **Port already in use**: Another process is using port 8000. Stop it first or use a different port
- **Module not found**: Make sure you're in the `backend` directory and dependencies are installed (`pip install -r requirements.txt`)
- **Permission denied**: Check file permissions or use `python3` instead of `python`

