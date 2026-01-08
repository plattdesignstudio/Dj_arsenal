# 🚀 Starting DJ Arsenal Servers

## Quick Start

### Option 1: Use the Startup Script (Recommended)

```bash
chmod +x start-servers.sh
./start-servers.sh
```

### Option 2: Manual Start

#### 1. Start Backend Server

Open a terminal and run:

```bash
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will be available at: **http://localhost:8000**

#### 2. Start Frontend Server

Open a **new terminal** and run:

```bash
# Install dependencies (first time only)
npm install

# Start the dev server
npm run dev
```

The frontend will be available at: **http://localhost:3000**

---

## Environment Setup

### Backend Requirements

1. **Python 3.8+** installed
2. **Install Python dependencies:**
   ```bash
   cd backend
   pip3 install -r requirements.txt
   ```

3. **Set OpenAI API Key:**
   Create `backend/.env` file:
   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   ```

### Frontend Requirements

1. **Node.js 18+** and **npm** installed
2. **Install dependencies:**
   ```bash
   npm install
   ```

---

## Accessing the UI

Once both servers are running:

1. **Open Safari**
2. **Navigate to:** `http://localhost:3000`
3. **You should see:** DJ Arsenal Dashboard

---

## Troubleshooting

### Backend won't start
- Check if Python 3 is installed: `python3 --version`
- Install dependencies: `pip3 install -r backend/requirements.txt`
- Check if port 8000 is already in use

### Frontend won't start
- Check if Node.js is installed: `node --version`
- Install dependencies: `npm install`
- Check if port 3000 is already in use

### API Connection Errors
- Make sure backend is running on port 8000
- Check `lib/api.ts` has correct API_URL
- Verify CORS settings in `backend/main.py`

### OpenAI API Errors
- Verify `OPENAI_API_KEY` is set in `backend/.env`
- Check your OpenAI API key is valid
- Ensure you have API credits

---

## Server URLs

- **Frontend UI:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Health Check:** http://localhost:8000/health
- **API Docs:** http://localhost:8000/docs

---

## Stopping Servers

- **If using startup script:** Press `Ctrl+C`
- **If running manually:** Press `Ctrl+C` in each terminal

---

## Next Steps

1. ✅ Start both servers
2. ✅ Open http://localhost:3000 in Safari
3. ✅ Explore the Dashboard
4. ✅ Try AI Voice Studio
5. ✅ Test AI Studio features
6. ✅ Use DJ AI Controls

**Enjoy your DJ Arsenal! 🎧**





