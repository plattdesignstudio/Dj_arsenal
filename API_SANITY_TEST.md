# API Sanity Test Guide

This guide helps you verify that all API integrations are working correctly.

## Prerequisites

1. **Backend must be running:**
   ```bash
   cd backend
   python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Environment variables set** (in `backend/.env`):
   - `SPOTIFY_CLIENT_ID` - Spotify API client ID
   - `SPOTIFY_CLIENT_SECRET` - Spotify API client secret
   - `OPENAI_API_KEY` - OpenAI API key
   - `SERPAPI_KEY` - (Optional) SERPAPI key for trending tracks fallback

## Running the Test Suite

### Option 1: Python Test Script (Comprehensive)

Run the comprehensive test script:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
python3 test_all_apis.py
```

This will test:
- ✅ Backend health
- ✅ Spotify API authentication
- ✅ Spotify track search
- ✅ Trending tracks endpoint
- ✅ SERPAPI integration (optional)
- ✅ OpenAI DJ Intelligence
- ✅ AI Recommendations
- ✅ Dashboard endpoints (Sets, Personas, Tracks)
- ✅ Flow Engine

### Option 2: Manual API Testing

#### Test Backend Health
```bash
curl http://localhost:8000/health
```

Expected: `{"status": "healthy"}`

#### Test Spotify Integration
```bash
curl http://localhost:8000/api/trending/spotify-top-charts
```

Expected: JSON with tracks array containing Spotify tracks with album art

#### Test Trending Tracks
```bash
curl http://localhost:8000/api/trending
```

Expected: JSON with trending tracks

#### Test OpenAI DJ Intelligence
```bash
curl -X POST http://localhost:8000/api/ai/dj-intel/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What should I play next?",
    "current_bpm": 128,
    "current_key": "C",
    "current_energy": 7
  }'
```

Expected: JSON with AI response

#### Test Dashboard Endpoints
```bash
# Test Sets
curl http://localhost:8000/api/sets

# Test Personas
curl http://localhost:8000/api/personas

# Test Tracks
curl http://localhost:8000/api/tracks
```

### Option 3: Frontend Dashboard Test

1. **Start the frontend:**
   ```bash
   npm run dev
   ```

2. **Open the dashboard:**
   - Navigate to `http://localhost:3000/dashboard` (or 3001/3002)
   - Open browser DevTools (F12)
   - Check the Console tab for errors

3. **What to check:**
   - ✅ Dashboard loads without errors
   - ✅ Sets are displayed
   - ✅ AI Track Suggestions component loads
   - ✅ DJ AI Controls work
   - ✅ Persona Selector loads personas
   - ✅ BPM Flow Graph displays (if you have sets with tracks)
   - ✅ Energy Meter displays

## Expected Results

### ✅ All Tests Passing
- Backend responds to all requests
- Spotify API returns tracks with album art
- OpenAI API returns intelligent responses
- Dashboard loads all data correctly

### ⚠️ Warnings (Non-Critical)
- SERPAPI key not set (optional, uses Spotify API instead)
- No sets/tracks in database (expected for new installations)
- Flow engine needs tracks in sets to work

### ❌ Failures (Need Attention)
- Backend not running → Start backend server
- Spotify credentials missing → Add to `.env`
- OpenAI key missing → Add to `.env`
- Network errors → Check backend is accessible

## Troubleshooting

### Backend Not Running
```bash
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Missing Environment Variables
1. Create `backend/.env` file
2. Add required variables:
   ```
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   OPENAI_API_KEY=your_openai_key
   SERPAPI_KEY=your_serpapi_key  # Optional
   ```

### CORS Errors
- Make sure backend CORS allows your frontend port (3000, 3001, or 3002)
- Check `backend/main.py` CORS configuration

### Timeout Errors
- Backend might be slow to respond
- Check backend logs for errors
- Increase timeout in `lib/api.ts` if needed

## Dashboard Data Flow

The dashboard loads data from these sources:

1. **Sets API** (`/api/sets`)
   - Loads all DJ sets
   - Used by `CurrentSetOverview` component

2. **Flow API** (`/api/flow/energy-curve/{set_id}`)
   - Loads energy curve for a set
   - Used by `BPMFlowGraph` and `EnergyMeter`

3. **Tracks API** (`/api/tracks`)
   - Loads all tracks
   - Used by `AITrackSuggestions`

4. **Personas API** (`/api/personas`)
   - Loads DJ personas
   - Used by `PersonaSelector`

5. **AI Recommendations** (`/api/ai/recommend`)
   - Gets AI track suggestions
   - Used by `AITrackSuggestions`

6. **DJ Intelligence** (`/api/ai/dj-intel/query`)
   - Gets AI responses
   - Used by `DJAIControls`

7. **Trending Tracks** (`/api/trending`)
   - Gets trending tracks from Spotify
   - Used by `TrackBrowser` component

## Next Steps

After running tests:
1. Fix any failed tests
2. Add missing environment variables
3. Verify dashboard loads correctly
4. Test individual features in the UI

