#!/bin/bash

# DJ Arsenal - Complete Installation and Startup Script
# Run this script to install all dependencies and start both servers

set -e  # Exit on error

echo "🎚️ DJ Arsenal - Installation & Startup"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Warning: backend/.env not found${NC}"
    echo "Creating .env file template..."
    echo "OPENAI_API_KEY=your_openai_api_key_here" > backend/.env
    echo -e "${YELLOW}Please edit backend/.env and add your OpenAI API key!${NC}"
    echo ""
fi

# Step 1: Install Python dependencies
echo -e "${GREEN}Step 1: Installing Python dependencies...${NC}"
cd backend

# Try different Python commands
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo -e "${RED}❌ Python not found! Please install Python 3.8+${NC}"
    exit 1
fi

echo "Using: $PYTHON_CMD"

# Check if pip is available
if ! $PYTHON_CMD -m pip --version &> /dev/null; then
    echo -e "${RED}❌ pip is not available. Xcode Command Line Tools may be missing.${NC}"
    echo ""
    echo "Please install Xcode Command Line Tools:"
    echo "  xcode-select --install"
    echo ""
    echo "Or see INSTALL_XCODE_TOOLS.md for detailed instructions"
    exit 1
fi

# Try user install first (no sudo needed)
echo "Installing Python packages to user directory..."
$PYTHON_CMD -m pip install --user -r requirements.txt || {
    echo -e "${YELLOW}⚠️  User install failed. Trying system install (may require password)...${NC}"
    sudo $PYTHON_CMD -m pip install -r requirements.txt || {
        echo -e "${RED}❌ Installation failed.${NC}"
        echo ""
        echo "Try installing Xcode Command Line Tools first:"
        echo "  xcode-select --install"
        echo ""
        echo "Or install packages manually:"
        echo "  cd backend"
        echo "  python3 -m pip install --user -r requirements.txt"
        exit 1
    }
}

cd ..

# Step 2: Install Node.js dependencies
echo ""
echo -e "${GREEN}Step 2: Installing Node.js dependencies...${NC}"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found!${NC}"
    echo "Please install Node.js:"
    echo "  - Visit: https://nodejs.org/"
    echo "  - Or use Homebrew: brew install node"
    exit 1
fi

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# Install npm dependencies
npm install

echo ""
echo -e "${GREEN}✅ All dependencies installed!${NC}"
echo ""

# Step 3: Start servers
echo -e "${GREEN}Step 3: Starting servers...${NC}"
echo ""

# Start backend in background
echo "🚀 Starting backend server (port 8000)..."
cd backend
$PYTHON_CMD -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Check if backend is running
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend server is running on http://localhost:8000${NC}"
else
    echo -e "${YELLOW}⚠️  Backend server may still be starting...${NC}"
fi

# Start frontend
echo ""
echo "🎨 Starting frontend server (port 3000)..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

echo ""
echo -e "${GREEN}======================================"
echo "✅ Servers are starting!"
echo "======================================${NC}"
echo ""
echo "📱 Frontend UI: http://localhost:3000"
echo "🔌 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Logs:"
echo "  - Backend: tail -f backend.log"
echo "  - Frontend: tail -f frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit
}

trap cleanup INT TERM

# Wait for user interrupt
wait





