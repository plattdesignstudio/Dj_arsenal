# Playlist Implementation Guide for DJ Booth App

## Current State Analysis

Your app currently has:
- ✅ **Spotify Playlist Integration**: Full CRUD operations via Spotify API
- ✅ **Track Management**: Local tracks stored in database
- ✅ **Drag & Drop UI**: Users can drag tracks to Spotify playlists
- ❌ **Local Playlists**: No database model for local playlists
- ❌ **Hybrid Support**: Can't mix Spotify and local tracks in one playlist

## Best Practices for DJ Application Playlists

### 1. **Dual Playlist System** (Recommended)

Implement both **Local Playlists** and **Spotify Playlists**:

- **Local Playlists**: Stored in your database, work with any tracks (Spotify or local files)
- **Spotify Playlists**: Sync with Spotify, only work with Spotify tracks
- **Hybrid Approach**: Allow users to create local playlists that can reference both

### 2. **Database Schema Design**

Add a `Playlist` model to your database:

```prisma
model Playlist {
  id            String   @id @default(cuid())
  name          String
  description   String?
  coverArt      String?
  isPublic      Boolean  @default(false)
  userId        String?  // For multi-user support later
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  playlistTracks PlaylistTrack[]
  
  @@index([userId])
}

model PlaylistTrack {
  id            String   @id @default(cuid())
  playlistId    String
  playlist      Playlist @relation(fields: [playlistId], references: [id], onDelete: Cascade)
  trackId       String
  track         Track    @relation(fields: [trackId], references: [id])
  position      Int      // Order in playlist
  addedAt       DateTime @default(now())
  notes         String?  // DJ notes for this track in this playlist
  
  // For Spotify tracks, store the URI
  spotifyUri    String?
  
  @@unique([playlistId, position])
  @@index([playlistId])
  @@index([trackId])
}
```

### 3. **Key Features to Implement**

#### A. **Playlist Types**
- **Local Playlists**: Fully managed in your app
- **Spotify Playlists**: Read-only or sync-enabled
- **Smart Playlists**: Auto-generated based on criteria (BPM, key, genre, etc.)

#### B. **Playlist Operations**
- Create/Delete/Edit playlists
- Add/Remove/Reorder tracks
- Duplicate playlists
- Export playlists to Spotify
- Import playlists from Spotify
- Share playlists (if multi-user)

#### C. **DJ-Specific Features**
- **Harmonic Mixing**: Auto-suggest tracks that mix well
- **BPM Progression**: Visualize BPM curve across playlist
- **Key Transitions**: Show compatible key changes
- **Energy Curve**: Track energy levels throughout playlist
- **Set Duration**: Calculate total playlist duration
- **Cue Points**: Store DJ cue points per track in playlist context

### 4. **API Design Recommendations**

#### Backend Endpoints Structure:

```
GET    /api/playlists                    # List all local playlists
POST   /api/playlists                    # Create new local playlist
GET    /api/playlists/{id}               # Get playlist details
PUT    /api/playlists/{id}               # Update playlist metadata
DELETE /api/playlists/{id}               # Delete playlist
GET    /api/playlists/{id}/tracks        # Get tracks in playlist
POST   /api/playlists/{id}/tracks        # Add tracks to playlist
DELETE /api/playlists/{id}/tracks        # Remove tracks
PUT    /api/playlists/{id}/tracks/reorder # Reorder tracks
POST   /api/playlists/{id}/duplicate     # Duplicate playlist
POST   /api/playlists/{id}/export-spotify # Export to Spotify
```

### 5. **UI/UX Best Practices**

#### A. **Playlist Sidebar** (You already have this!)
- ✅ Resizable panel (already implemented)
- ✅ Visual playlist cards with cover art
- ✅ Track count display
- ✅ Drag & drop support (already implemented)
- ➕ Add: Create playlist button
- ➕ Add: Playlist context menu (edit, delete, duplicate)
- ➕ Add: Visual indicator for playlist type (Local vs Spotify)

#### B. **Playlist View Page**
- Track list with drag-to-reorder
- BPM visualization
- Key transition indicators
- Energy curve graph
- Total duration display
- Play/pause playlist
- Export options

#### C. **Smart Features**
- **Auto-arrange by BPM**: Sort tracks by BPM progression
- **Harmonic suggestions**: Show compatible next tracks
- **Gap detection**: Identify BPM/key jumps that need attention
- **Set analysis**: Show energy curve, genre distribution

### 6. **Implementation Priority**

#### Phase 1: Basic Local Playlists (High Priority)
1. Add Playlist and PlaylistTrack models to database
2. Create backend API endpoints for CRUD operations
3. Add "Create Playlist" button in UI
4. Allow adding tracks to local playlists via drag & drop
5. Display local playlists alongside Spotify playlists

#### Phase 2: Enhanced Features (Medium Priority)
1. Playlist detail page with track management
2. Reorder tracks via drag & drop
3. Duplicate playlists
4. Delete playlists with confirmation

#### Phase 3: Advanced Features (Lower Priority)
1. Export local playlists to Spotify
2. Smart playlists (auto-generated)
3. Playlist templates
4. BPM/Key visualization
5. Harmonic mixing suggestions

### 7. **Technical Considerations**

#### A. **Track Compatibility**
- Local playlists should accept both Spotify tracks and local file tracks
- When adding Spotify track to local playlist, store:
  - Track ID (reference to your Track table)
  - Spotify URI (for potential export)
  - Track metadata (title, artist, etc.) for offline access

#### B. **Performance**
- Cache playlist data (you already do this for Spotify playlists)
- Lazy load playlist tracks
- Use pagination for large playlists
- Index database queries properly

#### C. **Data Consistency**
- When a track is deleted, handle playlist references:
  - Option 1: Remove from all playlists (CASCADE)
  - Option 2: Keep reference but mark as "unavailable"
- When Spotify track becomes unavailable, show indicator

### 8. **Spotify Integration Best Practices**

#### A. **Rate Limiting** (You already handle this!)
- ✅ Cache playlists (7-day cache implemented)
- ✅ Handle 429 errors gracefully
- ✅ Auto-retry after rate limit expires

#### B. **Token Management**
- ✅ Refresh tokens automatically
- ✅ Handle expired tokens gracefully

#### C. **Sync Strategy**
- **One-way sync**: Local → Spotify (export)
- **Two-way sync**: More complex, requires conflict resolution
- **Read-only**: Display Spotify playlists but don't modify

### 9. **Recommended Database Migration**

Add to your `backend/app/models.py`:

```python
class Playlist(Base):
    __tablename__ = "playlists"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    cover_art = Column(String, nullable=True)
    is_public = Column(Boolean, nullable=False, default=False)
    user_id = Column(String, nullable=True)  # For future multi-user support
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    playlist_tracks = relationship("PlaylistTrack", back_populates="playlist", 
                                   order_by="PlaylistTrack.position", 
                                   cascade="all, delete-orphan")

class PlaylistTrack(Base):
    __tablename__ = "playlist_tracks"
    
    id = Column(String, primary_key=True, index=True)
    playlist_id = Column(String, ForeignKey("playlists.id", ondelete="CASCADE"), nullable=False)
    track_id = Column(String, ForeignKey("tracks.id"), nullable=False)
    position = Column(Integer, nullable=False)
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)
    spotify_uri = Column(String, nullable=True)  # For Spotify tracks
    
    playlist = relationship("Playlist", back_populates="playlist_tracks")
    track = relationship("Track")
    
    __table_args__ = (
        UniqueConstraint('playlist_id', 'position', name='uq_playlist_position'),
    )
```

### 10. **Frontend API Integration**

Update `lib/api.ts` to include local playlist endpoints:

```typescript
export interface LocalPlaylist {
  id: string
  name: string
  description?: string
  coverArt?: string
  isPublic: boolean
  trackCount: number
  createdAt: string
  updatedAt: string
}

export interface PlaylistTrack {
  id: string
  trackId: string
  position: number
  track: Track
  spotifyUri?: string
  notes?: string
}

export const localPlaylistsApi = {
  getAll: async (): Promise<LocalPlaylist[]> => {
    const response = await api.get("/api/playlists")
    return response.data
  },
  
  create: async (name: string, description?: string): Promise<LocalPlaylist> => {
    const response = await api.post("/api/playlists", { name, description })
    return response.data
  },
  
  // ... other CRUD operations
}
```

## Summary

**Immediate Next Steps:**
1. Add `Playlist` and `PlaylistTrack` models to your database
2. Create backend API router for local playlists
3. Add "Create Playlist" functionality to the UI
4. Extend drag & drop to support local playlists
5. Display local playlists in the sidebar alongside Spotify playlists

**Key Benefits:**
- Users can create playlists without Spotify
- Works with both Spotify and local tracks
- Foundation for advanced DJ features (harmonic mixing, BPM curves)
- Better user experience and data ownership

This approach gives you the flexibility to support both Spotify integration and local playlist management, which is the industry standard for professional DJ applications.




