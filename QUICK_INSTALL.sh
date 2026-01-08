#!/bin/bash

# Quick install - Just installs Homebrew and Node.js, then you run servers manually

echo "🚀 Quick Install - Homebrew + Node.js"
echo ""

# Install Homebrew
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add to PATH
    if [ -f "/opt/homebrew/bin/brew" ]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
else
    echo "✅ Homebrew already installed"
fi

# Install Node.js
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    brew install node
else
    echo "✅ Node.js already installed"
fi

# Install Python packages
echo "Installing Python packages..."
cd backend
python3 -m pip install --user -r requirements.txt || python3 -m pip install --user fastapi uvicorn openai python-dotenv pydantic sqlalchemy
cd ..

# Install Node packages
echo "Installing Node packages..."
npm install

echo ""
echo "✅ Installation complete!"
echo ""
echo "Now start servers:"
echo "  Terminal 1: cd backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000"
echo "  Terminal 2: npm run dev"
echo "  Safari: http://localhost:3000"





