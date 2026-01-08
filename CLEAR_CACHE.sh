#!/bin/bash

# Clear Next.js Cache Script
# Run this when you get webpack cache errors

echo "🧹 Clearing Next.js cache..."
echo ""

# Check if dev server is running
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️  Warning: Dev server is running on port 3000"
    echo "   Please stop it first (Ctrl+C in the terminal running 'npm run dev')"
    echo "   Then run this script again"
    exit 1
fi

# Remove .next directory
if [ -d ".next" ]; then
    echo "Removing .next directory..."
    rm -rf .next
    echo "✅ .next directory removed"
else
    echo "ℹ️  .next directory doesn't exist"
fi

# Remove node_modules cache (optional)
if [ -d "node_modules/.cache" ]; then
    echo "Removing node_modules/.cache..."
    rm -rf node_modules/.cache
    echo "✅ node_modules cache removed"
fi

echo ""
echo "✅ Cache cleared!"
echo ""
echo "Now restart the dev server:"
echo "  npm run dev"

