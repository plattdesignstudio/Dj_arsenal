#!/bin/bash

echo "🔧 Fixing and Restarting Backend..."
echo ""

# Kill ALL processes on port 8000
echo "1. Killing all processes on port 8000..."
for pid in $(lsof -ti:8000); do
    kill -9 $pid 2>/dev/null
done
sleep 2

# Verify port is free
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "⚠️  Force killing remaining processes..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    sleep 2
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found!"
    exit 1
fi

# Navigate to backend
cd "$(dirname "$0")/backend" || exit 1

# Activate venv if exists
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Verify route exists
echo "2. Verifying route registration..."
python3 -c "
from app.routers.ai_voice import router
routes = [r.path for r in router.routes if hasattr(r, 'path')]
if '/generate-enhanced' in [r.split('/')[-1] for r in routes]:
    print('✓ Route /generate-enhanced found')
else:
    print('✗ Route /generate-enhanced NOT found')
    print('Available routes:', routes)
" 2>&1

# Start backend
echo ""
echo "3. Starting backend server..."
echo "   Server will run on http://localhost:8000"
echo "   API docs available at http://localhost:8000/docs"
echo ""
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload


