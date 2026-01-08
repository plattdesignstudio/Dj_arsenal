#!/bin/bash

# Restart Backend Server Script

echo "🔄 Restarting Backend Server..."
echo ""

# Kill any existing process on port 8000
echo "Stopping existing backend on port 8000..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || echo "No process found on port 8000"
sleep 1

# Find Python
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Python not found!"
    exit 1
fi

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Start backend
echo "🚀 Starting backend server on port 8000..."
cd backend

# Check if virtual environment exists and activate it
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
elif [ -d ".venv" ]; then
    echo "Activating virtual environment..."
    source .venv/bin/activate
fi

# Start uvicorn
$PYTHON_CMD -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

