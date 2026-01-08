# 🚀 OPEN GUI NOW - 3 Commands

## Just run these 3 commands:

### 1. Start Backend (Terminal 1)
```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2. Start Frontend (Terminal 2 - NEW terminal)
```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH && npm run dev
```

### 3. Open Safari
Go to: **http://localhost:3000**

---

## OR Use the Script:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
./START_GUI.sh
```

Then open Safari: **http://localhost:3000**

---

## If You Get Errors:

**"Module not found"** - Install packages:
```bash
# Backend (in backend folder)
python3 -m pip install --user fastapi uvicorn openai

# Frontend (in main folder)
npm install
```

**"Port in use"** - Kill existing:
```bash
lsof -ti:8000 | xargs kill
lsof -ti:3000 | xargs kill
```

---

**That's it! Just 2 terminals + Safari = GUI running! 🎧**





