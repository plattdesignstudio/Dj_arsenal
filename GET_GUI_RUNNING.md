# 🎯 GET GUI RUNNING - Copy & Paste These Commands

## Fastest Way (2 Terminals)

### Terminal 1 - Backend:
```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
python3 -m pip install --user fastapi uvicorn openai python-dotenv pydantic sqlalchemy 2>&1 | tail -5
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Terminal 2 - Frontend (NEW terminal window):
```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
npm install 2>&1 | tail -10
npm run dev
```

### Then:
**Open Safari → http://localhost:3000**

---

## If Backend Fails:

Try minimal install:
```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
python3 -m pip install --user fastapi uvicorn openai
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## If Frontend Fails:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
npm install
npm run dev
```

---

## Check If It's Working:

- Backend: http://localhost:8000/health (should show `{"status":"healthy"}`)
- Frontend: http://localhost:3000 (should show DJ Arsenal)

---

**Just copy/paste the commands above! 🚀**





