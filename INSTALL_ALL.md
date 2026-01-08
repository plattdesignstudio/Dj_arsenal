# 🚀 Complete Installation - One Command

## Run This One Command:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH && ./install-everything.sh
```

This script will:
1. ✅ Install Homebrew (if not installed)
2. ✅ Install Node.js via Homebrew
3. ✅ Install Xcode Command Line Tools (if needed)
4. ✅ Install all Python dependencies
5. ✅ Install all Node.js dependencies
6. ✅ Start backend server
7. ✅ Start frontend server
8. ✅ Tell you when to open Safari

---

## What It Does:

- **Installs Homebrew** - Package manager for macOS
- **Installs Node.js** - Required for frontend
- **Installs Python packages** - Required for backend
- **Starts both servers** - Backend (port 8000) and Frontend (port 3000)

---

## After Running:

1. **Wait for installation** (5-10 minutes first time)
2. **Look for this message:**
   ```
   ✅ Servers are running!
   📱 Open Safari and go to: http://localhost:3000
   ```
3. **Open Safari** → http://localhost:3000

---

## If You See Xcode Tools Dialog:

- Click **"Install"** when the dialog appears
- Wait for it to complete (5-15 minutes)
- The script will continue automatically

---

## Manual Steps (If Script Fails):

### Install Homebrew:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Install Node.js:
```bash
brew install node
```

### Install Python packages:
```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
python3 -m pip install --user -r requirements.txt
```

### Install Node packages:
```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
npm install
```

### Start servers:
```bash
# Terminal 1
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
npm run dev
```

---

**Just run the one command and wait! 🎧**





