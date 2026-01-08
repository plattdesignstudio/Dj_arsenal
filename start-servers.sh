#!/bin/bash

# DJ Arsenal Server Startup Script
# This script starts both the backend and frontend servers

echo "🎚️ Starting DJ Arsenal Servers..."
echo ""

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Warning: backend/.env not found"
    echo "   Create it with: OPENAI_API_KEY=your_key_here"
    echo ""
fi

# Start backend server
echo "🚀 Starting Backend Server (port 8000)..."
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Check if backend is running
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend server is running on http://localhost:8000"
else
    echo "⚠️  Backend server may not be ready yet"
fi

echo ""
echo "🎨 Starting Frontend Server (port 3000)..."
echo "   (This may take a moment if dependencies need to be installed)"
echo ""

# Start frontend server
npm run dev &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 5

echo ""
echo "✅ Servers are starting!"
echo ""
echo "📱 Access the UI at:"
echo "   http://localhost:3000"
echo ""
echo "🔌 Backend API at:"
echo "   http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait





