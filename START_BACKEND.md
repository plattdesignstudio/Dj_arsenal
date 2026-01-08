# How to Start the Backend Server

## 🚀 Quick Start

### Option 1: Use the Start Script (Easiest)
```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
./start-servers.sh
```

This starts both backend and frontend servers.

### Option 2: Start Backend Only

1. **Kill any existing processes on port 8000:**
   ```bash
   lsof -ti:8000 | xargs kill -9
   ```

2. **Navigate to backend directory:**
   ```bash
   cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
   ```

3. **Activate virtual environment (if you have one):**
   ```bash
   source venv/bin/activate  # or: source .venv/bin/activate
   ```

4. **Start the server:**
   ```bash
   python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

## ✅ Verify Backend is Running

1. **Check health endpoint:**
   ```bash
   curl http://localhost:8000/health
   ```
   Should return: `{"status":"healthy"}`

2. **Check API docs:**
   - Open: http://localhost:8000/docs
   - Should show FastAPI Swagger UI

3. **Check root endpoint:**
   ```bash
   curl http://localhost:8000/
   ```
   Should return: `{"message":"DJ Arsenal API","status":"operational"}`

## 🔧 Troubleshooting

### Port Already in Use
If you get "port already in use" error:
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9

# Then start again
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Python/uvicorn Not Found
Install dependencies:
```bash
cd backend
pip install -r requirements.txt
# or
pip install fastapi uvicorn python-dotenv
```

### Virtual Environment Issues
If using a virtual environment:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Environment Variables
Make sure `backend/.env` exists with:
```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/spotify/callback
FRONTEND_URL=http://localhost:3000
OPENAI_API_KEY=your_key_here  # Optional
```

## 📊 Expected Output

When backend starts successfully, you should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## 🎯 Next Steps

Once backend is running:
1. ✅ Verify: http://localhost:8000/docs
2. ✅ Start frontend: `npm run dev` (in project root)
3. ✅ Access UI: http://localhost:3000
4. ✅ Load Spotify tracks from the app

## 💡 Tips

- Keep the terminal open - the server needs to keep running
- Use `--reload` flag for auto-reload during development
- Check backend logs for any errors
- If backend stops, restart it using the same command

