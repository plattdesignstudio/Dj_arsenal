# Fix: Webpack Cache Error

## Problem
Getting webpack cache error:
```
Error: ENOENT: no such file or directory, rename '/Users/.../.next/cache/webpack/...'
```

## Quick Fix

### ⚠️ IMPORTANT: Stop Dev Server First!

**The dev server must be stopped before deleting `.next` directory!**

### Step 1: Stop Next.js Dev Server
1. Find the terminal where `npm run dev` is running
2. Press `Ctrl+C` to stop it
3. Wait for it to fully stop

### Step 2: Delete .next Directory
```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
rm -rf .next
```

### Step 3: Restart Frontend
```bash
npm run dev
```

### Alternative: If Permission Errors Persist

If you still get "Operation not permitted" errors:

```bash
# Force remove (be careful!)
sudo rm -rf .next

# Or try clearing just the cache
rm -rf .next/cache
```

### Solution 2: Clear Next.js Cache
```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
rm -rf .next/cache
```

Then restart the frontend.

## What This Does

- Removes corrupted webpack cache
- Forces Next.js to rebuild cache on next start
- Fixes file system permission issues
- Resolves cache corruption

## After Fixing

1. **Restart frontend:**
   ```bash
   npm run dev
   ```

2. **Wait for rebuild:**
   - Next.js will rebuild the cache
   - First build may take longer
   - Subsequent builds will be faster

3. **Verify:**
   - No more cache errors
   - Frontend loads normally
   - Hot reload works

## Prevention

This error usually happens when:
- Process is interrupted during build
- File system permissions change
- Cache gets corrupted

**Solution:** Just delete `.next` and restart - it's safe!

## Alternative: Full Clean

If issues persist:
```bash
# Remove all build artifacts
rm -rf .next
rm -rf node_modules/.cache

# Reinstall dependencies (optional)
npm install

# Restart
npm run dev
```

## Note

The `.next` directory is automatically generated - it's safe to delete. Next.js will recreate it on the next build.

