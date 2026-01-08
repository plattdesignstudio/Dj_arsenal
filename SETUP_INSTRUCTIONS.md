# 🎚️ DJ Arsenal - Setup & Server Start Instructions

## Current Status
✅ Python 3 is installed  
❌ Node.js/npm need to be installed or added to PATH

---

## Step 1: Install Node.js (if not installed)

### Option A: Using Homebrew (Recommended)
```bash
brew install node
```

### Option B: Download from Official Site
1. Visit: https://nodejs.org/
2. Download the LTS version for macOS
3. Install the .pkg file
4. Restart your terminal

### Verify Installation
```bash
node --version
npm --version
```

---

## Step 2: Install Python Dependencies

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
pip3 install -r requirements.txt
```

---

## Step 3: Install Frontend Dependencies

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
npm install
```

---

## Step 4: Set Up OpenAI API Key

Create the `.env` file in the backend directory:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
nano .env
```

Add this line (replace with your actual key):
```
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

Save and exit (Ctrl+X, then Y, then Enter)

---

## Step 5: Start the Servers

### Terminal 1 - Backend Server
```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Keep this terminal open!** You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Terminal 2 - Frontend Server
Open a **NEW terminal window** and run:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
npm run dev
```

**Keep this terminal open!** You should see:
```
  ▲ Next.js 14.2.5
  - Local:        http://localhost:3000

  ✓ Ready in 2.3s
```

---

## Step 6: Open in Safari

1. Open **Safari** browser
2. Navigate to: **http://localhost:3000**
3. You should see the **DJ Arsenal Dashboard**! 🎧

---

## Quick Test

Once both servers are running, test the connection:

1. **Backend Health Check:**
   - Open: http://localhost:8000/health
   - Should show: `{"status":"healthy"}`

2. **Frontend:**
   - Open: http://localhost:3000
   - Should show: DJ Arsenal Dashboard

3. **API Documentation:**
   - Open: http://localhost:8000/docs
   - Should show: FastAPI interactive docs

---

## Troubleshooting

### Backend Issues

**"ModuleNotFoundError"**
```bash
cd backend
pip3 install -r requirements.txt
```

**"Port 8000 already in use"**
```bash
lsof -ti:8000 | xargs kill
```

**"OPENAI_API_KEY not found"**
- Make sure `.env` file exists in `backend/` directory
- Check the file has: `OPENAI_API_KEY=your_key_here`

### Frontend Issues

**"npm: command not found"**
- Install Node.js (see Step 1)

**"Port 3000 already in use"**
```bash
lsof -ti:3000 | xargs kill
```

**"Module not found" errors**
```bash
npm install
```

**"Cannot connect to API"**
- Make sure backend is running on port 8000
- Check `lib/api.ts` has: `API_URL = "http://localhost:8000"`

---

## What's Available

Once running, you can access:

### Frontend Pages
- **Dashboard:** http://localhost:3000/dashboard
- **AI Voice Studio:** http://localhost:3000/ai-voice  
- **AI Studio:** http://localhost:3000/ai-studio
- **Tracks:** http://localhost:3000/tracks
- **Sets:** http://localhost:3000/sets

### Backend API
- **API Root:** http://localhost:8000
- **Health Check:** http://localhost:8000/health
- **API Docs:** http://localhost:8000/docs
- **DJ Intelligence:** http://localhost:8000/api/ai/dj-intel/query
- **AI Voice:** http://localhost:8000/api/ai-voice/generate-enhanced
- **Personas:** http://localhost:8000/api/personas/

---

## Stopping the Servers

In each terminal window, press:
```
Ctrl + C
```

This will stop the respective server.

---

## Need Help?

- Check `QUICK_START.md` for condensed instructions
- Check `START_SERVERS.md` for detailed server info
- Check `OPENAI_INTEGRATION.md` for AI features

---

**You're all set! Enjoy DJ Arsenal! 🎧✨**





