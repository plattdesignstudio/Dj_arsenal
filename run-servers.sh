#!/bin/bash

# DJ Arsenal - Quick Server Startup (assumes dependencies are installed)
# Use this if you've already run install-and-start.sh

echo "🎚️ Starting DJ Arsenal Servers..."
echo ""

# Find Python
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Python not found!"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found!"
    exit 1
fi

# Start backend
echo "🚀 Starting backend (port 8000)..."
cd backend
$PYTHON_CMD -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

sleep 2

# Start frontend
echo "🎨 Starting frontend (port 3000)..."
npm run dev &
FRONTEND_PID=$!

sleep 3

echo ""
echo "✅ Servers starting!"
echo ""
echo "📱 UI: http://localhost:3000"
echo "🔌 API: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop"

cleanup() {
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup INT TERM
wait





