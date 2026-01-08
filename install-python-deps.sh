#!/bin/bash

# Install Python dependencies without sudo (user install)
# Use this if you can't install Xcode tools or don't have sudo access

set -e

echo "📦 Installing Python dependencies (user install)..."
echo ""

cd backend

# Find Python
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Python not found!"
    exit 1
fi

echo "Using: $PYTHON_CMD"
echo ""

# Check if pip works
if ! $PYTHON_CMD -m pip --version &> /dev/null; then
    echo "❌ pip is not available."
    echo ""
    echo "You need to install Xcode Command Line Tools:"
    echo "  xcode-select --install"
    echo ""
    exit 1
fi

# Install to user directory
echo "Installing packages to: ~/Library/Python/$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')/bin"
echo ""

$PYTHON_CMD -m pip install --user -r requirements.txt

echo ""
echo "✅ Python dependencies installed!"
echo ""
echo "Note: If you get 'command not found' errors, add this to your ~/.zshrc:"
echo "  export PATH=\"\$HOME/Library/Python/$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')/bin:\$PATH\""
echo ""

cd ..





