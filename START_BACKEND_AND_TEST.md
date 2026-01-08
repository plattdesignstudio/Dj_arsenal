# Start Backend and Run Tests

## Step 1: Start the Backend

Open a **new terminal window** and run:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Keep this terminal open** - the backend needs to keep running.

## Step 2: Run the Tests

In a **different terminal window**, run:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
python3 test_apis_simple.py
```

## Step 3: Check Results

The test will show:
- ✅ Green checkmarks for working endpoints
- ❌ Red X's for failed endpoints
- A summary at the end

## Common Issues

### Backend Won't Start

**Error: Module not found**
```bash
cd backend
pip3 install -r requirements.txt
```

**Error: Port 8000 already in use**
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9
```

### Tests Fail

**All tests show "Connection refused"**
- Make sure backend is running (Step 1)
- Check backend terminal for errors
- Verify backend is on port 8000

**Spotify/OpenAI tests fail**
- Check `backend/.env` file exists
- Verify API keys are set:
  ```
  SPOTIFY_CLIENT_ID=your_id
  SPOTIFY_CLIENT_SECRET=your_secret
  OPENAI_API_KEY=your_key
  ```

## Fixed Issues

1. ✅ Fixed API endpoint: Changed `/api/trending/trending` to `/api/trending`
2. ✅ Created simple test script using built-in Python libraries
3. ✅ Improved error messages

## Next Steps

After tests pass:
1. Frontend should now connect to backend
2. Trending tracks should load
3. Featured tracks should load
4. Dashboard should work

