"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"

export interface PlayingTrack {
  id?: string
  title: string
  artist: string
  album?: string
  album_image_url?: string
  cover_art?: string
  duration?: number
  preview_url?: string
  isSpotify?: boolean
  spotifyId?: string
}

interface PlayerContextType {
  currentTrack: PlayingTrack | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  setCurrentTrack: (track: PlayingTrack | null) => void
  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  playTrack: (track: PlayingTrack) => void
  pauseTrack: () => void
  resumeTrack: () => void
  togglePlay: () => void
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined)

export function PlayerProvider({ children }: { children: ReactNode }) {
  // Initialize state without localStorage to avoid hydration mismatch
  const [currentTrack, setCurrentTrackState] = useState<PlayingTrack | null>(null)
  const [isPlaying, setIsPlayingState] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(0.8)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load state from localStorage after hydration (client-side only)
  useEffect(() => {
    setIsHydrated(true)
    
    try {
      // Load currentTrack
      const savedTrack = localStorage.getItem('player_currentTrack')
      if (savedTrack) {
        const parsed = JSON.parse(savedTrack)
        console.log('🔄 [PlayerContext] Restoring track from localStorage:', parsed)
        // Ensure all required fields are present
        if (parsed && parsed.title && parsed.artist) {
          setCurrentTrackState(parsed)
        } else {
          console.warn('⚠️ [PlayerContext] Invalid track data in localStorage, clearing:', parsed)
          localStorage.removeItem('player_currentTrack')
        }
      }

      // Load isPlaying
      const savedIsPlaying = localStorage.getItem('player_isPlaying')
      if (savedIsPlaying === 'true') {
        setIsPlayingState(true)
      }

      // Load duration
      const savedDuration = localStorage.getItem('player_duration')
      if (savedDuration) {
        setDuration(parseFloat(savedDuration))
      }

      // Load volume
      const savedVolume = localStorage.getItem('player_volume')
      if (savedVolume) {
        setVolumeState(parseFloat(savedVolume))
      }
    } catch (e) {
      console.warn('Failed to load player state from localStorage:', e)
    }
  }, [])

  // Persist currentTrack to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && isHydrated) {
      try {
        if (currentTrack) {
          // Ensure we're saving complete track data
          const trackToSave = {
            id: currentTrack.id,
            title: currentTrack.title,
            artist: currentTrack.artist,
            album: currentTrack.album,
            album_image_url: currentTrack.album_image_url,
            cover_art: currentTrack.cover_art,
            duration: currentTrack.duration,
            preview_url: currentTrack.preview_url,
            isSpotify: currentTrack.isSpotify,
            spotifyId: currentTrack.spotifyId,
          }
          console.log('💾 [PlayerContext] Saving track to localStorage:', trackToSave)
          localStorage.setItem('player_currentTrack', JSON.stringify(trackToSave))
        } else {
          localStorage.removeItem('player_currentTrack')
        }
      } catch (e) {
        console.warn('Failed to save currentTrack to localStorage:', e)
      }
    }
  }, [currentTrack, isHydrated])

  // Persist isPlaying to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('player_isPlaying', String(isPlaying))
      } catch (e) {
        console.warn('Failed to save isPlaying to localStorage:', e)
      }
    }
  }, [isPlaying])

  // Persist volume to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('player_volume', String(volume))
      } catch (e) {
        console.warn('Failed to save volume to localStorage:', e)
      }
    }
  }, [volume])

  // Wrapper for setCurrentTrack that also persists
  const setCurrentTrack = (track: PlayingTrack | null) => {
    console.log('🔄 [PlayerContext] setCurrentTrack called:', track ? {
      title: track.title,
      artist: track.artist,
      id: track.id,
    } : 'null')
    setCurrentTrackState(track)
  }

  // Wrapper for setIsPlaying that also persists
  const setIsPlaying = (playing: boolean) => {
    setIsPlayingState(playing)
  }

  // Wrapper for setVolume that also persists
  const setVolume = (vol: number) => {
    setVolumeState(vol)
  }

  // Debug: Log whenever currentTrack changes
  useEffect(() => {
    console.log("🎵 [PlayerContext] currentTrack state changed:", currentTrack ? {
      title: currentTrack.title,
      artist: currentTrack.artist,
      hasPreviewUrl: !!currentTrack.preview_url,
    } : null)
  }, [currentTrack])

  const playTrack = (track: PlayingTrack) => {
    // Normalize track fields to ensure title and artist are always present
    const normalizedTrack: PlayingTrack = {
      ...track,
      title: track.title || (track as any).name || "Unknown Track",
      artist: track.artist || (track as any).artists?.[0]?.name || (track as any).artists?.map((a: any) => a.name).join(", ") || "Unknown Artist",
    }
    
    console.log("🎵 [PlayerContext] playTrack called with:", {
      id: normalizedTrack.id,
      title: normalizedTrack.title,
      artist: normalizedTrack.artist,
      duration: normalizedTrack.duration,
      isSpotify: normalizedTrack.isSpotify,
      spotifyId: normalizedTrack.spotifyId,
      hasPreviewUrl: !!normalizedTrack.preview_url,
      previewUrl: normalizedTrack.preview_url,
      originalTitle: track.title,
      originalName: (track as any).name,
    })
    console.log("🎵 [PlayerContext] Setting currentTrack to:", normalizedTrack)
    
    // Ensure track has required fields
    if (!normalizedTrack.title || !normalizedTrack.artist) {
      console.error("❌ [PlayerContext] Invalid track - missing title or artist:", normalizedTrack)
      return
    }
    
    // Check if this is the same track that's already playing (resuming)
    const isSameTrack = currentTrack && (
      currentTrack.id === normalizedTrack.id ||
      (currentTrack.spotifyId && currentTrack.spotifyId === normalizedTrack.spotifyId) ||
      (currentTrack.title === normalizedTrack.title && currentTrack.artist === normalizedTrack.artist)
    )
    
    setCurrentTrackState(normalizedTrack) // Use setCurrentTrackState directly to ensure it's set immediately
    setIsPlaying(true)
    
    // Only reset currentTime if it's a NEW track, not when resuming the same track
    if (!isSameTrack) {
      console.log("🆕 [PlayerContext] New track - resetting currentTime to 0")
      setCurrentTime(0)
    } else {
      console.log("▶️ [PlayerContext] Same track - preserving currentTime:", currentTime)
      // Keep currentTime as is - it will be updated by the progress polling
    }
    
    if (normalizedTrack.duration && normalizedTrack.duration > 0) {
      setDuration(normalizedTrack.duration)
      console.log("📊 [PlayerContext] Set duration to:", normalizedTrack.duration, "seconds")
    } else {
      console.log("⚠️ [PlayerContext] No duration provided or duration is 0")
      // Keep existing duration or set to 0
      if (duration <= 0) {
        setDuration(0)
      }
    }
  }

  const pauseTrack = () => {
    setIsPlaying(false)
  }

  const resumeTrack = () => {
    setIsPlaying(true)
  }

  const togglePlay = () => {
    setIsPlaying((prev) => !prev)
  }

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        setCurrentTrack,
        setIsPlaying,
        setCurrentTime,
        setDuration,
        setVolume,
        playTrack,
        pauseTrack,
        resumeTrack,
        togglePlay,
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider")
  }
  return context
}

