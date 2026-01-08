# 🚀 Quick Start Guide - Get DJ Arsenal Running

## Step 1: Install Dependencies (One-Time Setup)

### Backend (Python)
```bash
cd backend
pip3 install -r requirements.txt
```

### Frontend (Node.js)
```bash
# Make sure you're in the project root
npm install
```

## Step 2: Set Up OpenAI API Key

Create `backend/.env` file:
```bash
cd backend
echo "OPENAI_API_KEY=your_actual_openai_api_key_here" > .env
```

## Step 3: Start Backend Server

Open **Terminal 1**:
```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Step 4: Start Frontend Server

Open **Terminal 2** (new terminal window):
```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
npm run dev
```

You should see:
```
  ▲ Next.js 14.2.5
  - Local:        http://localhost:3000
```

## Step 5: Open in Safari

1. Open **Safari**
2. Go to: **http://localhost:3000**
3. You should see the DJ Arsenal Dashboard! 🎧

---

## Troubleshooting

### "python3: command not found"
- Install Python 3 from python.org or use Homebrew: `brew install python3`

### "npm: command not found"
- Install Node.js from nodejs.org or use Homebrew: `brew install node`

### "Module not found" errors
- Run `pip3 install -r backend/requirements.txt` for backend
- Run `npm install` for frontend

### Port already in use
- Kill the process using the port:
  - Port 8000: `lsof -ti:8000 | xargs kill`
  - Port 3000: `lsof -ti:3000 | xargs kill`

### Backend won't start
- Check if you have all Python dependencies installed
- Verify `.env` file exists in `backend/` directory

---

## What You'll See

Once running, you can access:

- **Dashboard:** http://localhost:3000/dashboard
- **AI Voice Studio:** http://localhost:3000/ai-voice
- **AI Studio:** http://localhost:3000/ai-studio
- **Backend API Docs:** http://localhost:8000/docs

---

## Need Help?

Check the full documentation:
- `START_SERVERS.md` - Detailed server setup
- `OPENAI_INTEGRATION.md` - AI features guide
- `UI_UPDATES.md` - UI component documentation





