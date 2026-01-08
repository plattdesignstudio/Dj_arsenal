# 🚀 RUN THIS - Complete Setup Instructions

## Quick Start (Recommended)

Open **Terminal** and run:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
./install-and-start.sh
```

This script will:
1. ✅ Check/install Python dependencies
2. ✅ Check/install Node.js dependencies  
3. ✅ Start backend server (port 8000)
4. ✅ Start frontend server (port 3000)
5. ✅ Open the UI in your browser

---

## Manual Steps (If Script Doesn't Work)

### 1. Install Python Dependencies

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
python3 -m pip install -r requirements.txt
```

### 2. Install Node.js Dependencies

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
npm install
```

### 3. Start Backend Server

**Terminal 1:**
```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Start Frontend Server

**Terminal 2 (new terminal):**
```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
npm run dev
```

### 5. Open in Safari

Go to: **http://localhost:3000**

---

## Prerequisites

### If Python doesn't work:
```bash
# Install Xcode command line tools
xcode-select --install
```

### If Node.js is missing:
```bash
# Install via Homebrew
brew install node

# OR download from:
# https://nodejs.org/
```

---

## Verify .env File

Make sure `backend/.env` exists and has your OpenAI API key:

```bash
cat backend/.env
```

Should show:
```
OPENAI_API_KEY=sk-your-actual-key-here
```

---

## Troubleshooting

### "Command not found" errors
- Make sure you're in the project directory
- Check that Python/Node.js are installed
- Try using full paths: `/usr/bin/python3` or `/usr/local/bin/node`

### Port already in use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill

# Kill process on port 3000
lsof -ti:3000 | xargs kill
```

### Dependencies won't install
- Check internet connection
- Try: `pip3 install --user -r requirements.txt`
- Try: `npm install --legacy-peer-deps`

---

## What You'll See

Once running:
- ✅ Backend: http://localhost:8000/health shows `{"status":"healthy"}`
- ✅ Frontend: http://localhost:3000 shows DJ Arsenal Dashboard
- ✅ API Docs: http://localhost:8000/docs

---

**Run the script and enjoy! 🎧**





