#!/bin/bash

echo "🎧 DJ Arsenal Setup Script"
echo "=========================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi
echo "✅ Node.js found: $(node --version)"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9+ first."
    exit 1
fi
echo "✅ Python found: $(python3 --version)"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL not found. Make sure PostgreSQL is installed and running."
else
    echo "✅ PostgreSQL found"
fi

echo ""
echo "Setting up frontend..."
echo "----------------------"

# Frontend setup
if [ ! -f ".env" ]; then
    echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env
    echo "✅ Created .env file"
fi

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
    echo "✅ Frontend dependencies installed"
else
    echo "✅ Frontend dependencies already installed"
fi

echo ""
echo "Setting up backend..."
echo "---------------------"

cd backend

# Backend setup
if [ ! -f ".env" ]; then
    cat > .env << EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dj_arsenal
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_openai_api_key_here
EOF
    echo "✅ Created backend/.env file"
    echo "⚠️  Please edit backend/.env and add your OpenAI API key"
fi

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

echo "Installing backend dependencies..."
source venv/bin/activate
pip install -r requirements.txt
echo "✅ Backend dependencies installed"

cd ..

echo ""
echo "=========================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env and add your OpenAI API key"
echo "2. Create PostgreSQL database: createdb dj_arsenal"
echo "3. Start backend: cd backend && source venv/bin/activate && uvicorn main:app --reload"
echo "4. Start frontend: npm run dev"
echo "5. Initialize event types: curl -X POST http://localhost:8000/api/events/initialize"
echo ""
echo "See QUICKSTART.md for detailed instructions."
echo ""






