# Run npm Commands Correctly

## Problem
Getting `IndentationError: unexpected indent` when running `npm install`.

## Root Cause
You're in a **Python interpreter** (`>>>` prompt) instead of a **shell** (`$` or `%` prompt).

## Quick Fix

### Step 1: Exit Python
If you see `>>>` prompt, type:
```python
exit()
```
or press `Ctrl+D`

### Step 2: Make Sure You're in Shell
You should see a prompt like:
```
PlattDESiGN@thomas-platts-macbook-pro DJ_BOOTH %
```

NOT:
```
>>>
```

### Step 3: Add npm to PATH (If Needed)
```bash
export PATH="/opt/homebrew/bin:$PATH"
```

### Step 4: Run npm Commands
```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
npm install
```

## How to Tell What You're In

### Python Interpreter:
```
Python 3.x.x
>>> 
```
- Prompt shows `>>>`
- Commands don't work
- You need to type `exit()`

### Shell (zsh/bash):
```
PlattDESiGN@thomas-platts-macbook-pro ~ %
```
- Prompt shows `%` or `$`
- Commands work normally
- This is where you run `npm install`

## Complete Setup Steps

1. **Make sure you're in a shell (not Python):**
   - If you see `>>>`, type `exit()`
   - You should see `%` or `$` prompt

2. **Add npm to PATH:**
   ```bash
   export PATH="/opt/homebrew/bin:$PATH"
   ```

3. **Navigate to project:**
   ```bash
   cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Start frontend:**
   ```bash
   npm run dev
   ```

## Quick Test

Test if you're in the right place:
```bash
# Should show version number
npm --version

# Should show "zsh" or "bash"
echo $SHELL
```

If you get errors, you might still be in Python - type `exit()` first!

