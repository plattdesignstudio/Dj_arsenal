# 🎧 DJ ARSENAL

**AI-Augmented DJ Dashboard & Generative Artist Studio**

A professional DJ performance and creation platform that combines intelligent track discovery, harmonic mixing, flow management, and AI-powered voice generation.

---

## 🚀 Features

### Core Modules

1. **DJ Dashboard** - Central control room with real-time BPM flow, key progression, and energy monitoring
2. **Track Library & Discovery** - Auto-analyze tracks (BPM, key, energy) with smart filtering
3. **Event Type Engine** - Prebuilt profiles for Club Night, Festival, Wedding, Corporate, etc.
4. **Flow & Tempo Engine** - Automatic track ordering with smooth BPM transitions
5. **Harmonic Mixing System** - Camelot wheel-based key compatibility
6. **AI DJ Voice Generator** - Generate hype phrases, drop intros, and DJ tags
7. **Live Performance Mode** - Full-screen performance interface with emergency controls

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** + **ShadCN/UI**
- **Framer Motion** (animations)
- **Recharts** (data visualization)
- **WaveSurfer.js** (waveform visualization)

### Backend
- **FastAPI** (Python)
- **PostgreSQL** + **Prisma ORM**
- **Redis** (caching)
- **OpenAI API** (voice generation)
- **Librosa** (audio analysis)

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL
- Redis

### Frontend Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run development server
npm run dev
```

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database and API keys

# Run database migrations
alembic upgrade head

# Start FastAPI server
uvicorn main:app --reload
```

### Database Setup

```bash
# Using Prisma
npx prisma generate
npx prisma migrate dev

# Or using SQLAlchemy (backend)
# Database tables will be created automatically on first run
```

---

## 🎯 Usage

### 1. Initialize Event Types

First, initialize the predefined event profiles:

```bash
curl -X POST http://localhost:8000/api/events/initialize
```

### 2. Add Tracks

Import tracks through the Track Library interface or API:

```bash
POST /api/tracks
{
  "title": "Track Name",
  "artist": "Artist Name",
  "duration": 240,
  "file_path": "/path/to/track.mp3"
}
```

### 3. Analyze Tracks

Auto-analyze BPM, key, and energy:

```bash
POST /api/tracks/{track_id}/analyze
{
  "track_id": "...",
  "analysis_type": "full"
}
```

### 4. Create Sets

Build DJ sets with automatic flow optimization:

```bash
POST /api/sets
{
  "name": "Club Night Set",
  "event_type_id": "...",
  "duration": 3600,
  "track_ids": ["track1", "track2", ...]
}
```

### 5. Generate AI Voice

Create custom DJ voiceovers:

```bash
POST /api/ai-voice/generate
{
  "text": "Let's take this higher!",
  "voice_type": "hype"
}
```

---

## 📁 Project Structure

```
DJ_BOOTH/
├── app/                    # Next.js app directory
│   ├── dashboard/          # Main dashboard
│   ├── tracks/             # Track library
│   ├── sets/               # Set management
│   ├── ai-voice/           # AI voice studio
│   └── performance/        # Live performance mode
├── components/             # React components
│   ├── dashboard/          # Dashboard components
│   └── ui/                 # ShadCN UI components
├── lib/                    # Utilities & API client
├── backend/                # FastAPI backend
│   ├── app/
│   │   ├── routers/       # API routes
│   │   ├── services/      # Business logic
│   │   └── models.py       # Database models
│   └── main.py            # FastAPI app
├── prisma/                 # Prisma schema
└── package.json           # Frontend dependencies
```

---

## 🎨 UI/UX

- **Dark, club-ready theme** with neon accents
- **Glassmorphism panels** for modern aesthetic
- **Beat-synced animations** for performance mode
- **Responsive design** for all screen sizes
- **Zero clutter** interface optimized for live use

---

## 🔧 Configuration

### Environment Variables

**Frontend (.env)**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend (.env)**
```
DATABASE_URL=postgresql://user:password@localhost:5432/dj_arsenal
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_openai_api_key_here
```

---

## 🧪 Development

### Running Tests

```bash
# Frontend
npm run type-check
npm run lint

# Backend
pytest  # (when tests are added)
```

### Database Migrations

```bash
# Prisma
npx prisma migrate dev

# SQLAlchemy (Alembic)
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

---

## 🚀 Production Deployment

1. Build frontend: `npm run build`
2. Set production environment variables
3. Run database migrations
4. Deploy backend (FastAPI) to your server
5. Deploy frontend (Next.js) to Vercel/Netlify

---

## 📝 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 🎵 Audio Analysis

The platform uses **Librosa** for:
- **BPM Detection** - Beat tracking algorithm
- **Key Detection** - Chroma feature analysis → Camelot wheel mapping
- **Energy Analysis** - RMS, spectral centroid, zero crossing rate

---

## 🎹 Harmonic Mixing

Implements the **Camelot Wheel** system:
- **Perfect matches**: Same number, opposite mode (relative major/minor)
- **Safe transitions**: Adjacent numbers (±1)
- **Risky transitions**: Perfect fifth relationships (±4)

---

## 🤖 AI Voice Generation

Powered by **OpenAI TTS**:
- Customizable voice settings (tone, accent, gender)
- Context-aware phrase generation
- BPM and key-aware timing
- Optional autotune processing

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🙏 Credits

Built with:
- Next.js
- FastAPI
- OpenAI
- Librosa
- And many other amazing open-source projects

---

**Ready to take your DJ game to the next level? Let's mix! 🎧**






