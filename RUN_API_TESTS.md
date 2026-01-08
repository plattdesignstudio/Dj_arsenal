# Run API Sanity Tests

## Quick Start

### 1. Make sure backend is running

```bash
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Run the test script

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
python3 test_all_apis.py
```

## What Gets Tested

The test script will verify:

1. **Backend Health** - Is the server running?
2. **Spotify API** - Authentication and track retrieval
3. **Spotify Search** - Track search functionality
4. **Trending Tracks** - Trending endpoint
5. **SERPAPI** - Optional fallback service
6. **OpenAI Integration** - DJ Intelligence queries
7. **AI Recommendations** - Track recommendation engine
8. **Dashboard Endpoints** - Sets, Personas, Tracks
9. **Flow Engine** - Energy curve calculations

## Expected Output

You'll see:
- ✅ Green checkmarks for passing tests
- ❌ Red X's for failing tests
- ⚠️ Yellow warnings for optional/missing features
- A summary at the end with pass/fail counts

## Troubleshooting

### Backend Not Running
```
✗ Cannot connect to backend: Connection refused
```
**Fix:** Start the backend server (see step 1 above)

### Missing Environment Variables
```
⚠ SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET not set
⚠ OPENAI_API_KEY not set
```
**Fix:** Add these to `backend/.env`:
```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
OPENAI_API_KEY=your_openai_key
SERPAPI_KEY=your_serpapi_key  # Optional
```

### API Errors
If you see API-specific errors:
- Check your API keys are valid
- Verify API quotas/limits haven't been exceeded
- Check backend logs for detailed error messages

## Manual Testing

You can also test endpoints manually:

```bash
# Health check
curl http://localhost:8000/health

# Spotify trending
curl http://localhost:8000/api/trending/spotify

# Trending tracks
curl http://localhost:8000/api/trending

# OpenAI DJ Intelligence
curl -X POST http://localhost:8000/api/ai/dj-intel/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What should I play next?", "current_bpm": 128}'
```

## Frontend Dashboard Test

1. Start frontend:
   ```bash
   npm run dev
   ```

2. Open dashboard:
   - Go to `http://localhost:3000/dashboard` (or 3001/3002)
   - Open browser DevTools (F12)
   - Check Console for errors

3. Verify components load:
   - Sets display
   - AI Track Suggestions work
   - DJ AI Controls respond
   - Personas load
   - Charts/graphs display (if you have data)

## Next Steps

After tests pass:
1. ✅ All integrations working
2. ✅ Dashboard can load data
3. ✅ Ready to use the app!

If tests fail:
1. Check backend is running
2. Verify environment variables
3. Review error messages
4. Check API quotas/limits

