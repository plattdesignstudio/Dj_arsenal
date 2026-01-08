# Fix: Port 3000/3001 Already in Use

## Current Situation
Next.js is automatically using port 3002 because ports 3000 and 3001 are already in use.

## Options

### Option 1: Use Port 3002 (Easiest)
**Just use the port Next.js chose!**

Your frontend will be available at:
- **http://localhost:3002**

The backend is still on port 8000, so everything will work fine.

### Option 2: Kill Existing Processes (If You Want Port 3000)

If you want to use port 3000 instead:

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Then restart Next.js
npm run dev
```

### Option 3: Specify Port Explicitly

Start Next.js on a specific port:

```bash
# Use port 3000 (will fail if in use)
PORT=3000 npm run dev

# Or use port 3003
PORT=3003 npm run dev
```

## Recommended: Just Use Port 3002

**The easiest solution is to just use port 3002!**

1. **Access your app at:**
   - http://localhost:3002

2. **Backend is still on:**
   - http://localhost:8000

3. **Everything will work normally** - the frontend will connect to the backend regardless of which port it uses.

## Update API URL (If Needed)

If you want to hardcode a specific port, you can update `lib/api.ts`:

```typescript
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
```

This doesn't need to change - it's the backend URL, not the frontend port.

## Verify Everything Works

1. **Frontend:** http://localhost:3002 (or whatever port Next.js chose)
2. **Backend:** http://localhost:8000
3. **Test connection:** The frontend should connect to backend automatically

## Quick Reference

**Current Setup:**
- Frontend: http://localhost:3002 (auto-selected by Next.js)
- Backend: http://localhost:8000

**To kill existing processes:**
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

**To use specific port:**
```bash
PORT=3000 npm run dev
```

