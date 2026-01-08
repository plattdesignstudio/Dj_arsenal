#!/bin/bash

# Complete installation script - Installs Homebrew, Node.js, Python packages, and starts servers

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🎚️ DJ Arsenal - Complete Installation"
echo "======================================"
echo ""

# Step 1: Install Homebrew
echo -e "${GREEN}Step 1: Checking Homebrew...${NC}"
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH (for Apple Silicon Macs)
    if [ -f "/opt/homebrew/bin/brew" ]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [ -f "/usr/local/bin/brew" ]; then
        echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/usr/local/bin/brew shellenv)"
    fi
else
    echo -e "${GREEN}✅ Homebrew already installed${NC}"
fi

# Step 2: Install Node.js via Homebrew
echo ""
echo -e "${GREEN}Step 2: Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    brew install node
else
    echo -e "${GREEN}✅ Node.js already installed: $(node --version)${NC}"
fi

# Step 3: Install Xcode Command Line Tools (if needed)
echo ""
echo -e "${GREEN}Step 3: Checking Xcode Command Line Tools...${NC}"
if ! xcode-select -p &> /dev/null; then
    echo "Installing Xcode Command Line Tools..."
    xcode-select --install || {
        echo -e "${YELLOW}⚠️  Please approve the Xcode tools installation dialog${NC}"
        echo "Waiting 30 seconds for installation to start..."
        sleep 30
    }
else
    echo -e "${GREEN}✅ Xcode Command Line Tools already installed${NC}"
fi

# Step 4: Install Python dependencies
echo ""
echo -e "${GREEN}Step 4: Installing Python dependencies...${NC}"
cd backend

# Find Python
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
else
    echo -e "${RED}❌ Python 3 not found!${NC}"
    exit 1
fi

# Install packages
echo "Installing packages..."
$PYTHON_CMD -m pip install --user -r requirements.txt || {
    echo -e "${YELLOW}⚠️  Some packages failed. Trying minimal install...${NC}"
    $PYTHON_CMD -m pip install --user fastapi uvicorn openai python-dotenv pydantic sqlalchemy psycopg2-binary alembic redis
}

cd ..

# Step 5: Install Node.js dependencies
echo ""
echo -e "${GREEN}Step 5: Installing Node.js dependencies...${NC}"
npm install

echo ""
echo -e "${GREEN}======================================"
echo "✅ Installation Complete!"
echo "======================================${NC}"
echo ""
echo "Starting servers..."
echo ""

# Step 6: Start Backend
echo "🚀 Starting backend server..."
cd backend
$PYTHON_CMD -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

sleep 3

# Step 7: Start Frontend
echo "🎨 Starting frontend server..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 5

echo ""
echo -e "${GREEN}======================================"
echo "✅ Servers are running!"
echo "======================================${NC}"
echo ""
echo "📱 Open Safari and go to:"
echo "   http://localhost:3000"
echo ""
echo "🔌 Backend API:"
echo "   http://localhost:8000"
echo ""
echo "📚 API Docs:"
echo "   http://localhost:8000/docs"
echo ""
echo -e "${YELLOW}Logs:${NC}"
echo "   Backend: tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit
}

trap cleanup INT TERM

# Wait
wait





