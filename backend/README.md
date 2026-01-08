# DJ Arsenal Backend

FastAPI backend for DJ Arsenal platform.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database URL and API keys
```

4. Initialize database:
```bash
# Create database first in PostgreSQL
createdb dj_arsenal

# Run migrations (if using Alembic)
alembic upgrade head

# Or tables will be created automatically on first run
```

5. Initialize event types:
```bash
# After starting server, run:
curl -X POST http://localhost:8000/api/events/initialize
```

6. Start server:
```bash
uvicorn main:app --reload
```

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Environment Variables

```
DATABASE_URL=postgresql://user:password@localhost:5432/dj_arsenal
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_openai_api_key_here
```

## Audio Analysis

The backend uses Librosa for audio analysis. Make sure audio files are accessible at the paths specified in track records.

## Notes

- Audio files should be uploaded to a storage location and paths stored in the database
- OpenAI API key is required for AI voice generation
- Redis is optional but recommended for caching analysis results






