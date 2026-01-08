"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AlbumArt } from "@/components/ui/album-art"
import { formatDuration, formatBPM } from "@/lib/utils"
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer"
import { useSpotifyAuth } from "@/components/spotify/SpotifyLogin"
import type { Track } from "@/lib/api"

interface TurntableDeckProps {
  deckId: "left" | "right"
  track: Track | null
  onTrackEnd?: () => void
  masterVolume?: number
  crossfader?: number // 0 = left, 1 = right
}

export function TurntableDeck({
  deckId,
  track,
  onTrackEnd,
  masterVolume = 1,
  crossfader = 0.5,
}: TurntableDeckProps) {
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [pitch, setPitch] = useState(0) // -50% to +50%
  const [cuePoint, setCuePoint] = useState<number | null>(null)
  const [isCueing, setIsCueing] = useState(false)
  const lastLoadedTrackId = useRef<string | null>(null)
  const lastPlayerReadyState = useRef<boolean>(false)
  
  // Spotify Web Playback SDK
  const { accessToken } = useSpotifyAuth()
  const spotifyPlayer = useSpotifyPlayer()
  const [usingSpotifySDK, setUsingSpotifySDK] = useState(false)

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current) return

    // Dynamically import WaveSurfer to avoid SSR issues
    let isMounted = true

    import("wavesurfer.js").then((WaveSurferModule) => {
      if (!isMounted || !waveformRef.current) return

      const WaveSurfer = WaveSurferModule.default
      
      const       wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: deckId === "left" ? "#00ffff" : "#ff00ff",
        progressColor: deckId === "left" ? "#00ffff" : "#ff00ff",
        cursorColor: "#ffffff",
        barWidth: 2,
        barRadius: 2,
        height: 80,
        normalize: true,
        backend: "WebAudio",
      } as any)

      wavesurferRef.current = wavesurfer

      wavesurfer.on("ready", () => {
        if (isMounted) {
          setDuration(wavesurfer.getDuration())
          wavesurfer.setVolume(volume)
        }
      })

      wavesurfer.on("play", () => {
        if (isMounted) setIsPlaying(true)
      })
      wavesurfer.on("pause", () => {
        if (isMounted) setIsPlaying(false)
      })
      wavesurfer.on("finish", () => {
        if (isMounted) {
          setIsPlaying(false)
          onTrackEnd?.()
        }
      })

      wavesurfer.on("audioprocess", (time) => {
        if (isMounted) setCurrentTime(time)
      })
    }).catch((error: unknown) => {
      console.error("Failed to load WaveSurfer:", error)
    })

    return () => {
      isMounted = false
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.destroy()
        } catch (error) {
          console.error("Error destroying WaveSurfer:", error)
        }
        wavesurferRef.current = null
      }
    }
  }, [deckId, onTrackEnd, volume])

  // Load track
  useEffect(() => {
    if (!track) {
      lastLoadedTrackId.current = null
      lastPlayerReadyState.current = false
      return
    }

    const audioUrl = track.preview_url || track.file_path
    
    // Check if we should skip loading (prevent infinite loops):
    // Always allow loading if: different track OR player just became ready
    const isSameTrack = lastLoadedTrackId.current === track.id
    const wasPlayerReadyBefore = lastPlayerReadyState.current
    const playerJustBecameReady = !wasPlayerReadyBefore && spotifyPlayer.isReady
    
    // Skip only if it's the same track AND player was already ready when we last tried
    // AND we have WaveSurfer loaded (for preview tracks) - this prevents reloading preview tracks
    if (isSameTrack && !playerJustBecameReady && wasPlayerReadyBefore) {
      // Check if WaveSurfer has this track loaded (for preview tracks only)
      try {
        if (wavesurferRef.current && wavesurferRef.current.getDuration() > 0) {
          console.log(`[Deck ${deckId}] Skipping reload - preview track already loaded:`, track.title)
          return
        }
      } catch (e) {
        // WaveSurfer not ready, continue loading
      }
    }

    // Update tracking refs (record state BEFORE attempting load)
    lastLoadedTrackId.current = track.id
    lastPlayerReadyState.current = spotifyPlayer.isReady
    
    console.log(`[Deck ${deckId}] Attempting to load track:`, {
      trackTitle: track.title,
      trackId: track.id,
      isSameTrack,
      playerJustBecameReady,
      wasPlayerReadyBefore,
      isPlayerReadyNow: spotifyPlayer.isReady
    })
    
    // Check if track.id is a valid Spotify ID
    // Valid Spotify IDs are Base62 alphanumeric strings, don't start with our prefixes
    // Exclude: local-*, temp-*, fallback-* (these are IDs we generated, not real Spotify IDs)
    const isOurGeneratedId = track.id && (
      track.id.startsWith("local-") || 
      track.id.startsWith("temp-") || 
      track.id.startsWith("fallback-")
    )
    const spotifyTrackId = track.id && !track.file_path && !isOurGeneratedId ? track.id : null
    
    console.log(`[Deck ${deckId}] Loading track:`, track.title, {
      trackId: track.id,
      spotifyTrackId,
      hasPreviewUrl: !!track.preview_url,
      hasFilePath: !!track.file_path,
      hasAccessToken: !!accessToken,
      isPlayerReady: spotifyPlayer.isReady
    })
    
    // Priority 1: If user is authenticated and track has valid Spotify ID, use Web Playback SDK
    if (accessToken && spotifyTrackId && spotifyPlayer.isReady) {
      setUsingSpotifySDK(true)
      spotifyPlayer.playTrack(spotifyTrackId).catch((error: unknown) => {
        console.error(`[Deck ${deckId}] Failed to play track via Spotify SDK:`, error)
        // Fall back to preview URL if available
        setUsingSpotifySDK(false)
        if (audioUrl && wavesurferRef.current) {
          wavesurferRef.current.load(audioUrl).catch((err: unknown) => {
            console.error(`[Deck ${deckId}] Failed to load audio fallback:`, err)
          })
        }
      })
      setDuration(spotifyPlayer.duration / 1000) // Convert to seconds
    } 
    // Priority 2: Use preview URL or local file with WaveSurfer
    else if (audioUrl && wavesurferRef.current) {
      setUsingSpotifySDK(false)
      wavesurferRef.current.load(audioUrl).catch((error: unknown) => {
        console.error(`[Deck ${deckId}] Failed to load audio:`, error)
      })
    } 
    // Priority 3: Track has Spotify ID but player not ready or no auth - show embed
    else if (spotifyTrackId) {
      setUsingSpotifySDK(false)
      if (!accessToken) {
        console.log(`[Deck ${deckId}] Track available via Spotify (login required for full playback):`, track.title)
      } else if (!spotifyPlayer.isReady) {
        console.log(`[Deck ${deckId}] Spotify player initializing... Track will play once ready:`, track.title)
      }
      // Will use Spotify embed UI in the render section
    } 
    // No audio source available
    else {
      setUsingSpotifySDK(false)
      console.warn(`[Deck ${deckId}] ⚠️ No audio available for track:`, track.title, {
        hasPreviewUrl: !!track.preview_url,
        hasFilePath: !!track.file_path,
        hasSpotifyId: !!spotifyTrackId,
        hasAccessToken: !!accessToken,
        isPlayerReady: spotifyPlayer.isReady,
        trackId: track.id
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Note: We intentionally don't include spotifyPlayer.playTrack in deps to avoid infinite loops
    // playTrack is stable and only changes when the hook reinitializes, which is handled by isReady
    // We only depend on track properties and player readiness state
  }, [track?.id, track?.preview_url, track?.file_path, accessToken, spotifyPlayer.isReady, deckId])

  // Update volume based on master and crossfader
  useEffect(() => {
    if (usingSpotifySDK && spotifyPlayer.player) {
      const crossfaderValue = deckId === "left" ? 1 - crossfader : crossfader
      const finalVolume = volume * masterVolume * crossfaderValue
      spotifyPlayer.setVolume(Math.max(0, Math.min(1, finalVolume)))
    } else if (wavesurferRef.current) {
      const crossfaderValue = deckId === "left" ? 1 - crossfader : crossfader
      const finalVolume = volume * masterVolume * crossfaderValue
      wavesurferRef.current.setVolume(Math.max(0, Math.min(1, finalVolume)))
    }
  }, [volume, masterVolume, crossfader, deckId, usingSpotifySDK, spotifyPlayer])

  // Update playback rate for pitch (only for WaveSurfer, Spotify SDK doesn't support pitch)
  useEffect(() => {
    if (usingSpotifySDK) {
      // Spotify Web Playback SDK doesn't support pitch adjustment
      // Could show a message or disable pitch control
      return
    }
    if (!wavesurferRef.current) return
    const playbackRate = 1 + pitch / 100
    wavesurferRef.current.setPlaybackRate(playbackRate)
  }, [pitch, usingSpotifySDK])
  
  // Sync Spotify player state
  useEffect(() => {
    if (usingSpotifySDK && spotifyPlayer) {
      setIsPlaying(spotifyPlayer.isPlaying)
      setCurrentTime(spotifyPlayer.position / 1000) // Convert to seconds
      setDuration(spotifyPlayer.duration / 1000) // Convert to seconds
    }
  }, [usingSpotifySDK, spotifyPlayer.isPlaying, spotifyPlayer.position, spotifyPlayer.duration])

  const handlePlayPause = useCallback(() => {
    if (usingSpotifySDK && spotifyPlayer.player) {
      spotifyPlayer.togglePlay()
      setIsPlaying(spotifyPlayer.isPlaying)
    } else if (wavesurferRef.current) {
      if (isCueing && cuePoint !== null) {
        wavesurferRef.current.seekTo(cuePoint / duration)
        setIsCueing(false)
      }
      wavesurferRef.current.playPause()
    }
  }, [isCueing, cuePoint, duration, usingSpotifySDK, spotifyPlayer])

  const handleCue = useCallback(() => {
    if (!wavesurferRef.current) return

    if (isPlaying) {
      wavesurferRef.current.pause()
      setIsCueing(true)
      setCuePoint(currentTime)
    } else if (cuePoint !== null) {
      wavesurferRef.current.seekTo(cuePoint / duration)
      wavesurferRef.current.play()
    } else {
      setCuePoint(currentTime)
      wavesurferRef.current.seekTo(0)
    }
  }, [isPlaying, currentTime, cuePoint, duration])

  const handleSkip = (seconds: number) => {
    if (usingSpotifySDK && spotifyPlayer.player) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
      spotifyPlayer.seek(newTime * 1000) // Convert to milliseconds
    } else if (wavesurferRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
      wavesurferRef.current.seekTo(newTime / duration)
    }
  }

  const handlePitchChange = (value: number) => {
    setPitch(Math.max(-50, Math.min(50, value)))
  }

  if (!track) {
    return (
      <div className="bg-black/40 border border-white/10 rounded-lg p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">No Track Loaded</div>
          <div className="text-sm">Click &quot;Load Track&quot; to select a track</div>
        </div>
      </div>
    )
  }

  const hasPreview = !!(track.preview_url || track.file_path)
  
  // Calculate spotifyTrackId the same way as in the useEffect
  const isOurGeneratedId = track.id && (
    track.id.startsWith("local-") || 
    track.id.startsWith("temp-") || 
    track.id.startsWith("fallback-")
  )
  const spotifyTrackId = track.id && !track.file_path && !isOurGeneratedId ? track.id : null

  return (
    <div className="bg-gradient-to-br from-black/50 via-black/40 to-black/50 border border-white/10 rounded-xl p-6 space-y-4 shadow-2xl">
      {/* Track Info with Enhanced Graphics */}
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <AlbumArt
            imageUrl={track.album_image_url || track.cover_art}
            alt={`${track.title} by ${track.artist}`}
            size="lg"
            className="flex-shrink-0"
          />
          {/* Glowing effect */}
          <div className="absolute inset-0 rounded-xl bg-cyan-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xl font-bold text-white truncate mb-1 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {track.title}
          </div>
          <div className="text-sm text-gray-300 truncate mb-2">{track.artist}</div>
          <div className="flex flex-wrap gap-2">
            {track.bpm && (
              <span className="text-xs text-cyan-400 bg-cyan-500/20 px-2 py-1 rounded-full border border-cyan-500/30 font-mono">
                {formatBPM(track.bpm + (track.bpm * pitch / 100))} BPM
                {pitch !== 0 && (
                  <span className="ml-1 text-purple-400">
                    ({pitch > 0 ? "+" : ""}{pitch.toFixed(1)}%)
                  </span>
                )}
              </span>
            )}
            {track.key && (
              <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded-full border border-purple-500/30 font-mono">
                Key: {track.key}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Waveform or Spotify Embed */}
      {hasPreview ? (
        <div className="bg-black/60 rounded-lg p-2">
          <div ref={waveformRef} className="w-full" />
        </div>
      ) : spotifyTrackId && accessToken && usingSpotifySDK ? (
        <div className="bg-black/60 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-semibold">Spotify Full Track (Web Playback SDK)</span>
          </div>
          <div className="bg-black/40 rounded-lg p-4 text-center">
            <div className="text-sm text-gray-300 mb-2">Playing via Spotify Web Playback SDK</div>
            <div className="text-xs text-gray-500">Full track playback with DJ controls</div>
          </div>
        </div>
      ) : spotifyTrackId && accessToken && !spotifyPlayer.isReady ? (
        <div className="bg-black/60 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-yellow-400 font-semibold">Initializing Spotify Player...</span>
          </div>
          <div className="bg-black/40 rounded-lg overflow-hidden">
            <iframe
              src={`https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator&theme=0`}
              width="100%"
              height="200"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-lg"
              style={{ minHeight: '200px' }}
            />
          </div>
        </div>
      ) : spotifyTrackId ? (
        <div className="bg-black/60 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-yellow-400 font-semibold">Sign in for Full Playback</span>
          </div>
          <div className="bg-black/40 rounded-lg overflow-hidden">
            <iframe
              src={`https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator&theme=0`}
              width="100%"
              height="200"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-lg"
              style={{ minHeight: '200px' }}
            />
          </div>
        </div>
      ) : (
        <div className="bg-black/60 rounded-lg p-4 flex items-center justify-center min-h-[152px]">
          <div className="text-center text-gray-500">
            <div className="text-sm">No audio available</div>
            <div className="text-xs mt-2 text-gray-600">
              {!track.preview_url && !track.file_path && !spotifyTrackId && "Track has no preview URL or Spotify ID"}
            </div>
          </div>
        </div>
      )}

      {/* Time Display - For preview tracks and Spotify SDK */}
      {(hasPreview || usingSpotifySDK) && (
        <div className="flex justify-between text-sm text-gray-400">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      )}

      {/* Controls - Show for tracks with preview URLs or Spotify SDK */}
      {(hasPreview || usingSpotifySDK) && (
        <div className="flex items-center justify-center gap-2">
          {hasPreview && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCue}
              className="w-12 h-12 rounded-full"
              title="Cue"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSkip(-10)}
            className="w-12 h-12 rounded-full"
            title="Skip -10s"
          >
            <SkipBack className="w-5 h-5" />
          </Button>
          <Button
            variant="neon"
            size="lg"
            onClick={handlePlayPause}
            className="w-16 h-16 rounded-full"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSkip(10)}
            className="w-12 h-12 rounded-full"
            title="Skip +10s"
          >
            <SkipForward className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
            className="w-12 h-12 rounded-full"
            title={volume > 0 ? "Mute" : "Unmute"}
          >
            {volume > 0 ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </Button>
        </div>
      )}
      {!hasPreview && spotifyTrackId && !accessToken && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mt-2">
          <div className="flex items-start gap-2">
            <div className="text-yellow-400 mt-0.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-yellow-400 mb-1">Sign in for Full Playback</div>
              <div className="text-xs text-gray-400">
                Sign in to Spotify to enable full track playback with DJ controls. Requires Spotify Premium.
              </div>
            </div>
          </div>
        </div>
      )}
      {!hasPreview && spotifyTrackId && accessToken && usingSpotifySDK && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mt-2">
          <div className="flex items-start gap-2">
            <div className="text-green-400 mt-0.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-green-400 mb-1">Full Track Playback Active</div>
              <div className="text-xs text-gray-400">
                Playing via Spotify Web Playback SDK. Use DJ controls below to mix.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pitch Control - Only for preview tracks */}
      {hasPreview && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Pitch</span>
            <span className={pitch !== 0 ? "text-purple-500" : ""}>
              {pitch > 0 ? "+" : ""}{pitch.toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            value={pitch}
            onChange={(e) => handlePitchChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>
      )}

      {/* Volume Control - Show for all tracks with audio */}
      {(hasPreview || usingSpotifySDK) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Volume</span>
            <span>{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer ${deckId === "left" ? "accent-cyan-500" : "accent-purple-500"}`}
          />
        </div>
      )}
    </div>
  )
}

