# Exit Python Interpreter

## Problem
You're seeing `>>>` which means you're inside a Python interpreter, not your shell.

## Solution: Exit Python

### Option 1: Type exit command
```
exit()
```
Then press Enter

### Option 2: Press Ctrl+D
Just press `Ctrl+D` to exit Python

### Option 3: Type quit()
```
quit()
```
Then press Enter

## After Exiting Python

You'll see your normal shell prompt (like `$` or `%`), then you can run:

```bash
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## How to Tell Where You Are

- **Python interpreter**: Prompt shows `>>>`
- **Shell (bash/zsh)**: Prompt shows `$` or `%` or your username

## Running Backend Correctly

The backend command should be run in your **shell**, not in Python:

```bash
# In your shell (not Python):
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

This runs the `uvicorn` command using Python, but you execute it from your shell terminal.

