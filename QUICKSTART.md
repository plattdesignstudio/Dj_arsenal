# 🚀 Quick Start Guide

Get DJ Arsenal up and running in minutes!

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Python 3.9+ installed
- [ ] PostgreSQL installed and running
- [ ] Redis installed (optional but recommended)
- [ ] OpenAI API key (for AI voice features)

## Step 1: Frontend Setup

```bash
# Install dependencies
npm install

# Create .env file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env

# Start development server
npm run dev
```

Frontend will be available at: http://localhost:3000

## Step 2: Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dj_arsenal
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_key_here
EOF

# Create database
createdb dj_arsenal  # Or use your PostgreSQL client

# Start server
uvicorn main:app --reload
```

Backend will be available at: http://localhost:8000

## Step 3: Initialize Data

```bash
# Initialize event types
curl -X POST http://localhost:8000/api/events/initialize

# Verify it worked
curl http://localhost:8000/api/events
```

## Step 4: Add Your First Track

### Via API:
```bash
curl -X POST http://localhost:8000/api/tracks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Example Track",
    "artist": "Example Artist",
    "duration": 240,
    "bpm": 128,
    "key": "1A",
    "energy": 0.8,
    "genre": "House"
  }'
```

### Via UI:
1. Navigate to http://localhost:3000/tracks
2. Use the interface to add tracks (UI form coming soon)

## Step 5: Analyze Tracks

If you have audio files, analyze them:

```bash
# First, update track with file_path
# Then analyze
curl -X POST http://localhost:8000/api/tracks/{track_id}/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "track_id": "your_track_id",
    "analysis_type": "full"
  }'
```

## Step 6: Create Your First Set

```bash
curl -X POST http://localhost:8000/api/sets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Set",
    "duration": 3600,
    "track_ids": ["track_id_1", "track_id_2"]
  }'
```

## Step 7: Generate AI Voice

```bash
curl -X POST http://localhost:8000/api/ai-voice/generate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Let'\''s take this higher!",
    "voice_type": "hype"
  }'
```

## Troubleshooting

### Database Connection Issues
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in backend/.env
- Ensure database exists: `psql -l | grep dj_arsenal`

### Port Already in Use
- Frontend: Change port in `package.json` scripts or use `PORT=3001 npm run dev`
- Backend: Use `uvicorn main:app --reload --port 8001`

### Audio Analysis Fails
- Ensure audio file path is correct and accessible
- Check file format is supported (MP3, WAV, etc.)
- Verify Librosa is installed: `pip show librosa`

### OpenAI API Errors
- Verify API key is set in backend/.env
- Check API key is valid and has credits
- Voice generation requires OpenAI API access

## Next Steps

1. **Explore the Dashboard**: http://localhost:3000/dashboard
2. **Browse Tracks**: http://localhost:3000/tracks
3. **Manage Sets**: http://localhost:3000/sets
4. **Try AI Voice**: http://localhost:3000/ai-voice
5. **Performance Mode**: http://localhost:3000/performance

## Production Deployment

See main README.md for production deployment instructions.

---

**Ready to mix? Let's go! 🎧**






