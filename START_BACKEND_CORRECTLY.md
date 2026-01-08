# How to Start Backend Correctly

## The Command You Need

**Don't type "backend" as a command** - it's a directory name!

## Correct Steps

### Step 1: Navigate to Backend Directory

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
```

This changes your current directory to the `backend` folder.

### Step 2: Start the Backend Server

```bash
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

This starts the backend server.

## Full Command (Copy and Paste)

You can do both steps in one line:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## What Each Part Means

- `cd` = change directory (navigation command)
- `backend` = the directory name (not a command!)
- `python3 -m uvicorn` = the command to start the server
- `main:app` = the Python file and app name
- `--host 0.0.0.0` = allow connections from any IP
- `--port 8000` = run on port 8000
- `--reload` = auto-reload on code changes

## Common Mistakes

❌ **Wrong**: `backend` (this tries to run "backend" as a command)
✅ **Right**: `cd backend` (this navigates INTO the backend directory)

## Verify You're in the Right Place

After running `cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend`, you should see:

```bash
# Check current directory
pwd
# Should show: /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend

# Check if main.py exists
ls main.py
# Should show: main.py
```

## If You Get "Address Already in Use"

Kill the process first:

```bash
lsof -ti:8000 | xargs kill -9
```

Then try starting again.

