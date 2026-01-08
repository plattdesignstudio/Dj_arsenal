# Backend Folder Location

## The backend folder exists!

The backend folder is located at:
```
/Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
```

## Verify It Exists

In your terminal, run:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
ls -la | grep backend
```

You should see `backend` listed.

Or check directly:

```bash
ls /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
```

You should see files like `main.py`, `requirements.txt`, etc.

## If You Don't See It in Finder

If you're using Finder (macOS file browser) and don't see it:

1. **Make sure you're in the right folder**: Open Finder → Go → Desktop → DJ_BOOTH
2. **Show hidden files**: Press `Cmd + Shift + .` (period) to show hidden files
3. **Check if it's collapsed**: Click on folders to expand them

## Navigate to Backend in Terminal

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
```

Or step by step:

```bash
cd ~/Desktop/DJ_BOOTH
cd backend
```

## Verify You're in Backend

After navigating, check:

```bash
pwd
# Should show: /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend

ls
# Should show: main.py, requirements.txt, app/, etc.
```

## Start Backend from Any Location

You can start the backend from anywhere using the full path:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

