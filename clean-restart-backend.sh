#!/bin/bash

# Clean restart of backend server

echo "🔄 Cleaning up and restarting backend..."

# Kill all processes on port 8000
echo "Stopping all processes on port 8000..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || echo "No processes to kill"
sleep 2

# Verify port is free
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "⚠️  Warning: Port 8000 still in use. Trying again..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    sleep 2
fi

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

# Start uvicorn with reload
echo "Starting uvicorn..."
$PYTHON_CMD -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload


