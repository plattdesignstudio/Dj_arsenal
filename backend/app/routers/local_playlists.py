from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import uuid
from datetime import datetime

from app.database import get_db
from app.models import Playlist, PlaylistTrack, Track
from app.schemas import (
    PlaylistCreate, PlaylistUpdate, PlaylistResponse, PlaylistWithTracks,
    PlaylistTrackCreate, PlaylistTrackResponse,
    AddTracksToLocalPlaylistRequest, RemoveTracksFromLocalPlaylistRequest,
    ReorderLocalPlaylistRequest, DuplicatePlaylistRequest
)

router = APIRouter()

def get_playlist_track_count(db: Session, playlist_id: str) -> int:
    """Get the count of tracks in a playlist"""
    return db.query(PlaylistTrack).filter(PlaylistTrack.playlist_id == playlist_id).count()

def get_max_position(db: Session, playlist_id: str) -> int:
    """Get the maximum position in a playlist"""
    result = db.query(func.max(PlaylistTrack.position)).filter(
        PlaylistTrack.playlist_id == playlist_id
    ).scalar()
    return result if result is not None else -1

@router.get("", response_model=List[PlaylistResponse])
async def get_all_playlists(db: Session = Depends(get_db)):
    """Get all local playlists"""
    playlists = db.query(Playlist).order_by(Playlist.created_at.desc()).all()
    result = []
    for playlist in playlists:
        track_count = get_playlist_track_count(db, playlist.id)
        playlist_dict = {
            "id": playlist.id,
            "name": playlist.name,
            "description": playlist.description,
            "cover_art": playlist.cover_art,
            "is_public": playlist.is_public,
            "user_id": playlist.user_id,
            "track_count": track_count,
            "created_at": playlist.created_at,
            "updated_at": playlist.updated_at
        }
        result.append(PlaylistResponse(**playlist_dict))
    return result

@router.post("", response_model=PlaylistResponse, status_code=201)
async def create_playlist(
    playlist_data: PlaylistCreate,
    db: Session = Depends(get_db)
):
    """Create a new local playlist"""
    playlist = Playlist(
        id=str(uuid.uuid4()),
        name=playlist_data.name,
        description=playlist_data.description,
        cover_art=playlist_data.cover_art,
        is_public=playlist_data.is_public,
        user_id=None  # For future multi-user support
    )
    db.add(playlist)
    db.commit()
    db.refresh(playlist)
    
    return PlaylistResponse(
        id=playlist.id,
        name=playlist.name,
        description=playlist.description,
        cover_art=playlist.cover_art,
        is_public=playlist.is_public,
        user_id=playlist.user_id,
        track_count=0,
        created_at=playlist.created_at,
        updated_at=playlist.updated_at
    )

@router.get("/{playlist_id}", response_model=PlaylistWithTracks)
async def get_playlist(
    playlist_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific playlist with its tracks"""
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    playlist_tracks = db.query(PlaylistTrack).filter(
        PlaylistTrack.playlist_id == playlist_id
    ).order_by(PlaylistTrack.position).all()
    
    track_responses = []
    for pt in playlist_tracks:
        track = db.query(Track).filter(Track.id == pt.track_id).first()
        if track:
            # Convert track to TrackResponse format
            from app.schemas import TrackResponse
            track_dict = {
                "id": track.id,
                "title": track.title,
                "artist": track.artist,
                "duration": track.duration,
                "bpm": track.bpm,
                "key": track.key,
                "energy": track.energy,
                "genre": track.genre,
                "mood": track.mood,
                "file_path": track.file_path,
                "cover_art": track.cover_art,
                "created_at": track.created_at,
                "updated_at": track.updated_at,
                "album_image_url": track.cover_art if track.cover_art and ("spotify" in track.cover_art.lower() or "scdn.co" in track.cover_art) else None,
                "preview_url": None  # Would need to be stored separately
            }
            track_responses.append(PlaylistTrackResponse(
                id=pt.id,
                playlist_id=pt.playlist_id,
                track_id=pt.track_id,
                position=pt.position,
                added_at=pt.added_at,
                notes=pt.notes,
                spotify_uri=pt.spotify_uri,
                track=TrackResponse(**track_dict)
            ))
    
    return PlaylistWithTracks(
        id=playlist.id,
        name=playlist.name,
        description=playlist.description,
        cover_art=playlist.cover_art,
        is_public=playlist.is_public,
        user_id=playlist.user_id,
        track_count=len(track_responses),
        created_at=playlist.created_at,
        updated_at=playlist.updated_at,
        playlist_tracks=track_responses
    )

@router.put("/{playlist_id}", response_model=PlaylistResponse)
async def update_playlist(
    playlist_id: str,
    update_data: PlaylistUpdate,
    db: Session = Depends(get_db)
):
    """Update playlist metadata"""
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    if update_data.name is not None:
        playlist.name = update_data.name
    if update_data.description is not None:
        playlist.description = update_data.description
    if update_data.cover_art is not None:
        playlist.cover_art = update_data.cover_art
    if update_data.is_public is not None:
        playlist.is_public = update_data.is_public
    
    playlist.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(playlist)
    
    track_count = get_playlist_track_count(db, playlist.id)
    return PlaylistResponse(
        id=playlist.id,
        name=playlist.name,
        description=playlist.description,
        cover_art=playlist.cover_art,
        is_public=playlist.is_public,
        user_id=playlist.user_id,
        track_count=track_count,
        created_at=playlist.created_at,
        updated_at=playlist.updated_at
    )

@router.delete("/{playlist_id}", status_code=204)
async def delete_playlist(
    playlist_id: str,
    db: Session = Depends(get_db)
):
    """Delete a playlist"""
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    db.delete(playlist)
    db.commit()
    return None

@router.get("/{playlist_id}/tracks", response_model=List[PlaylistTrackResponse])
async def get_playlist_tracks(
    playlist_id: str,
    db: Session = Depends(get_db)
):
    """Get all tracks in a playlist"""
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    playlist_tracks = db.query(PlaylistTrack).filter(
        PlaylistTrack.playlist_id == playlist_id
    ).order_by(PlaylistTrack.position).all()
    
    result = []
    for pt in playlist_tracks:
        track = db.query(Track).filter(Track.id == pt.track_id).first()
        if track:
            from app.schemas import TrackResponse
            track_dict = {
                "id": track.id,
                "title": track.title,
                "artist": track.artist,
                "duration": track.duration,
                "bpm": track.bpm,
                "key": track.key,
                "energy": track.energy,
                "genre": track.genre,
                "mood": track.mood,
                "file_path": track.file_path,
                "cover_art": track.cover_art,
                "created_at": track.created_at,
                "updated_at": track.updated_at,
                "album_image_url": track.cover_art if track.cover_art and ("spotify" in track.cover_art.lower() or "scdn.co" in track.cover_art) else None,
                "preview_url": None
            }
            result.append(PlaylistTrackResponse(
                id=pt.id,
                playlist_id=pt.playlist_id,
                track_id=pt.track_id,
                position=pt.position,
                added_at=pt.added_at,
                notes=pt.notes,
                spotify_uri=pt.spotify_uri,
                track=TrackResponse(**track_dict)
            ))
    
    return result

@router.post("/{playlist_id}/tracks", response_model=List[PlaylistTrackResponse])
async def add_tracks_to_playlist(
    playlist_id: str,
    request: AddTracksToLocalPlaylistRequest,
    db: Session = Depends(get_db)
):
    """Add tracks to a playlist"""
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    # Get current max position
    max_pos = get_max_position(db, playlist_id)
    start_position = request.position if request.position is not None else max_pos + 1
    
    added_tracks = []
    for idx, track_id in enumerate(request.track_ids):
        # Check if track exists
        track = db.query(Track).filter(Track.id == track_id).first()
        if not track:
            continue  # Skip non-existent tracks
        
        # Check if track is already in playlist
        existing = db.query(PlaylistTrack).filter(
            PlaylistTrack.playlist_id == playlist_id,
            PlaylistTrack.track_id == track_id
        ).first()
        if existing:
            continue  # Skip duplicates
        
        # Get Spotify URI if available (check track metadata)
        spotify_uri = None
        if track.cover_art and ("spotify" in track.cover_art.lower() or "scdn.co" in track.cover_art):
            # Try to construct Spotify URI from track ID if it looks like a Spotify ID
            if track.id and len(track.id) == 22 and track.id.replace('-', '').isalnum():
                spotify_uri = f"spotify:track:{track.id}"
        
        playlist_track = PlaylistTrack(
            id=str(uuid.uuid4()),
            playlist_id=playlist_id,
            track_id=track_id,
            position=start_position + idx,
            notes=None,
            spotify_uri=spotify_uri
        )
        db.add(playlist_track)
        added_tracks.append(playlist_track)
    
    playlist.updated_at = datetime.utcnow()
    db.commit()
    
    # Return the added tracks
    result = []
    for pt in added_tracks:
        track = db.query(Track).filter(Track.id == pt.track_id).first()
        if track:
            from app.schemas import TrackResponse
            track_dict = {
                "id": track.id,
                "title": track.title,
                "artist": track.artist,
                "duration": track.duration,
                "bpm": track.bpm,
                "key": track.key,
                "energy": track.energy,
                "genre": track.genre,
                "mood": track.mood,
                "file_path": track.file_path,
                "cover_art": track.cover_art,
                "created_at": track.created_at,
                "updated_at": track.updated_at,
                "album_image_url": track.cover_art if track.cover_art and ("spotify" in track.cover_art.lower() or "scdn.co" in track.cover_art) else None,
                "preview_url": None
            }
            result.append(PlaylistTrackResponse(
                id=pt.id,
                playlist_id=pt.playlist_id,
                track_id=pt.track_id,
                position=pt.position,
                added_at=pt.added_at,
                notes=pt.notes,
                spotify_uri=pt.spotify_uri,
                track=TrackResponse(**track_dict)
            ))
    
    return result

@router.delete("/{playlist_id}/tracks", status_code=204)
async def remove_tracks_from_playlist(
    playlist_id: str,
    request: RemoveTracksFromLocalPlaylistRequest,
    db: Session = Depends(get_db)
):
    """Remove tracks from a playlist"""
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    # Remove tracks
    for track_id in request.track_ids:
        playlist_track = db.query(PlaylistTrack).filter(
            PlaylistTrack.playlist_id == playlist_id,
            PlaylistTrack.track_id == track_id
        ).first()
        if playlist_track:
            db.delete(playlist_track)
    
    # Reorder remaining tracks
    remaining_tracks = db.query(PlaylistTrack).filter(
        PlaylistTrack.playlist_id == playlist_id
    ).order_by(PlaylistTrack.position).all()
    
    for idx, pt in enumerate(remaining_tracks):
        pt.position = idx
    
    playlist.updated_at = datetime.utcnow()
    db.commit()
    return None

@router.put("/{playlist_id}/tracks/reorder", response_model=PlaylistWithTracks)
async def reorder_playlist_tracks(
    playlist_id: str,
    request: ReorderLocalPlaylistRequest,
    db: Session = Depends(get_db)
):
    """Reorder tracks in a playlist"""
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    # Find the track to move
    track_to_move = db.query(PlaylistTrack).filter(
        PlaylistTrack.playlist_id == playlist_id,
        PlaylistTrack.track_id == request.track_id
    ).first()
    
    if not track_to_move:
        raise HTTPException(status_code=404, detail="Track not found in playlist")
    
    old_position = track_to_move.position
    new_position = request.new_position
    
    if old_position == new_position:
        # No change needed
        return await get_playlist(playlist_id, db)
    
    # Get all tracks
    all_tracks = db.query(PlaylistTrack).filter(
        PlaylistTrack.playlist_id == playlist_id
    ).order_by(PlaylistTrack.position).all()
    
    # Reorder
    if new_position < old_position:
        # Moving up
        for pt in all_tracks:
            if pt.position >= new_position and pt.position < old_position:
                pt.position += 1
    else:
        # Moving down
        for pt in all_tracks:
            if pt.position > old_position and pt.position <= new_position:
                pt.position -= 1
    
    track_to_move.position = new_position
    playlist.updated_at = datetime.utcnow()
    db.commit()
    
    return await get_playlist(playlist_id, db)

@router.post("/{playlist_id}/duplicate", response_model=PlaylistResponse)
async def duplicate_playlist(
    playlist_id: str,
    request: DuplicatePlaylistRequest,
    db: Session = Depends(get_db)
):
    """Duplicate a playlist"""
    original = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    # Create new playlist
    new_name = request.name if request.name else f"{original.name} (Copy)"
    new_playlist = Playlist(
        id=str(uuid.uuid4()),
        name=new_name,
        description=original.description,
        cover_art=original.cover_art,
        is_public=original.is_public,
        user_id=original.user_id
    )
    db.add(new_playlist)
    db.flush()
    
    # Copy tracks
    original_tracks = db.query(PlaylistTrack).filter(
        PlaylistTrack.playlist_id == playlist_id
    ).order_by(PlaylistTrack.position).all()
    
    for idx, original_pt in enumerate(original_tracks):
        new_pt = PlaylistTrack(
            id=str(uuid.uuid4()),
            playlist_id=new_playlist.id,
            track_id=original_pt.track_id,
            position=idx,
            notes=original_pt.notes,
            spotify_uri=original_pt.spotify_uri
        )
        db.add(new_pt)
    
    db.commit()
    db.refresh(new_playlist)
    
    track_count = get_playlist_track_count(db, new_playlist.id)
    return PlaylistResponse(
        id=new_playlist.id,
        name=new_playlist.name,
        description=new_playlist.description,
        cover_art=new_playlist.cover_art,
        is_public=new_playlist.is_public,
        user_id=new_playlist.user_id,
        track_count=track_count,
        created_at=new_playlist.created_at,
        updated_at=new_playlist.updated_at
    )




