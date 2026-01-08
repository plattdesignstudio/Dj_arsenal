#!/bin/bash

# Simple script to start GUI - does minimum needed

echo "🚀 Starting DJ Arsenal GUI..."
echo ""

# Start backend (try with what's available)
echo "Starting backend..."
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment
sleep 2

# Start frontend
echo "Starting frontend..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait a moment
sleep 5

echo ""
echo "✅ Servers starting!"
echo ""
echo "📱 Open Safari and go to: http://localhost:3000"
echo ""
echo "Logs:"
echo "  Backend: tail -f backend.log"
echo "  Frontend: tail -f frontend.log"
echo ""
echo "Press Ctrl+C to stop"

# Cleanup on exit
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup INT TERM
wait





