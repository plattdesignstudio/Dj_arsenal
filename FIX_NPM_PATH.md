# Fix: npm Command Not Found

## Problem
Getting `zsh: command not found: npm` even though Node.js is installed.

## Root Cause
Node.js/npm is installed at `/opt/homebrew/bin/` but this path is not in your shell's PATH.

## Quick Fix

### Solution 1: Add to PATH (Permanent)

Add this to your `~/.zshrc` file:

```bash
# Add Homebrew to PATH
export PATH="/opt/homebrew/bin:$PATH"
```

**Steps:**
1. Open your `.zshrc` file:
   ```bash
   nano ~/.zshrc
   # or
   code ~/.zshrc
   ```

2. Add this line at the end:
   ```bash
   export PATH="/opt/homebrew/bin:$PATH"
   ```

3. Save and reload:
   ```bash
   source ~/.zshrc
   ```

4. Verify:
   ```bash
   npm --version
   ```

### Solution 2: Use Full Path (Temporary)

For now, use the full path:
```bash
/opt/homebrew/bin/npm install
/opt/homebrew/bin/npm run dev
```

### Solution 3: Restart Terminal

Sometimes just restarting the terminal fixes PATH issues:
1. Close terminal completely
2. Open a new terminal
3. Try `npm --version`

## Verify Installation

After fixing PATH:
```bash
# Check versions
node --version
npm --version

# Should show:
# v25.2.1 (or similar)
# 10.x.x (or similar)
```

## Install Project Dependencies

Once npm works:
```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
npm install
```

## Start Frontend

```bash
npm run dev
```

## Quick Test

Test if it works:
```bash
# Add to PATH for current session
export PATH="/opt/homebrew/bin:$PATH"

# Test
npm --version
```

If this works, add it to `~/.zshrc` permanently (Solution 1).

