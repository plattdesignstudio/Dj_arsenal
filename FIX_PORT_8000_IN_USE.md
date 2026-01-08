# Fix: Port 8000 Already in Use

## Problem
Port 8000 is already being used by another process (probably another backend instance).

## Solution: Kill the Process Using Port 8000

### Option 1: Kill the Process (Recommended)

Find and kill the process using port 8000:

```bash
# Find the process ID
lsof -ti:8000

# Kill it
kill -9 $(lsof -ti:8000)
```

Or as a single command:
```bash
lsof -ti:8000 | xargs kill -9
```

### Option 2: Find and Kill Manually

1. Find the process:
   ```bash
   lsof -i:8000
   ```
   
   This will show something like:
   ```
   COMMAND   PID    USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
   python3  12345  user   5u  IPv4  ...     0t0  TCP *:8000 (LISTEN)
   ```

2. Kill the process using the PID (Process ID):
   ```bash
   kill -9 12345
   ```
   (Replace 12345 with the actual PID from step 1)

### Option 3: Use a Different Port

If you want to use a different port instead:

```bash
python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

But remember to:
- Update ngrok to point to the new port: `ngrok http 8001`
- Update backend/.env with the new port in the redirect URI

## After Killing the Process

Once you've killed the process on port 8000, try starting the backend again:

```bash
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Quick Fix Command

Run this to kill any process on port 8000:

```bash
lsof -ti:8000 | xargs kill -9 2>/dev/null; echo "Port 8000 cleared"
```

Then start the backend:
```bash
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

