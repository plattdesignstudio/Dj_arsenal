"use client"

import { useState, useEffect, useRef } from "react"
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer"
import { useSpotifyAuth } from "@/components/spotify/SpotifyLogin"
import { usePlayer } from "@/contexts/PlayerContext"
import { useToast } from "@/hooks/use-toast"

interface BaseTrack {
  id?: string
  title: string
  artist: string
  album?: string
  album_image_url?: string
  cover_art?: string
  preview_url?: string
}

export function useTrackPlayer<T extends BaseTrack>(tracks: T[]) {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [pendingSpotifyTrack, setPendingSpotifyTrack] = useState<T | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { toast } = useToast()
  const spotifyPlayer = useSpotifyPlayer()
  const { accessToken } = useSpotifyAuth()
  const { playTrack: playTrackGlobal, setCurrentTrack, setIsPlaying, currentTrack: globalTrack, isPlaying: globalIsPlaying } = usePlayer()

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      setPlayingTrackId(null)
      setAudioPlaying(false)
    }
  }, [])

  // Helper function to validate Spotify track ID
  const isValidSpotifyId = (id: string | undefined): boolean => {
    if (!id) return false
    // Spotify IDs are 22 characters, base62 encoded (alphanumeric), no hyphens
    // They don't start with "local-" or "temp-"
    if (id.startsWith("local-") || id.startsWith("temp-")) return false
    if (id.includes("-")) return false // UUIDs have hyphens, Spotify IDs don't
    if (id.length !== 22) return false
    // Check if it's base62 (alphanumeric)
    return /^[a-zA-Z0-9]+$/.test(id)
  }

  // Helper function to filter out Echo/Alexa devices and prefer desktop/web players
  const selectBestDevice = (devices: any[], preferredDeviceId: string | null = null) => {
    if (!devices || devices.length === 0) return null

    // Filter out Echo/Alexa devices and other smart speakers
    const excludePatterns = [
      /echo/i,
      /alexa/i,
      /dot/i,
      /spotify/i, // Spotify branded devices (speakers)
      /speaker/i,
      /google home/i,
      /nest audio/i,
      /homepod/i,
    ]

    const isExcludedDevice = (device: any) => {
      const name = device.name?.toLowerCase() || ""
      const type = device.type?.toLowerCase() || ""
      return excludePatterns.some(pattern => pattern.test(name) || pattern.test(type))
    }

    const validDevices = devices.filter((d: any) => !isExcludedDevice(d))

    // If no valid devices after filtering, fall back to all devices (but log warning)
    const devicesToSearch = validDevices.length > 0 ? validDevices : devices
    if (validDevices.length === 0 && devices.length > 0) {
      console.warn("⚠️ [useTrackPlayer] Only Echo/smart speaker devices available, using first available device")
    }

    // Priority 1: Preferred device (e.g., SDK device)
    if (preferredDeviceId) {
      const preferred = devicesToSearch.find((d: any) => d.id === preferredDeviceId)
      if (preferred) return preferred
    }

    // Priority 2: Active device (if it's not excluded)
    const activeDevice = devicesToSearch.find((d: any) => d.is_active)
    if (activeDevice) return activeDevice

    // Priority 3: "DJ Arsenal" device or Computer type
    const djArsenalOrComputer = devicesToSearch.find(
      (d: any) => d.name?.toLowerCase().includes("dj arsenal") || d.type === "Computer"
    )
    if (djArsenalOrComputer) return djArsenalOrComputer

    // Priority 4: Web Player or any Computer-type device
    const webPlayer = devicesToSearch.find((d: any) => d.type === "Computer")
    if (webPlayer) return webPlayer

    // Priority 5: First available valid device
    return devicesToSearch[0] || null
  }

  // Auto-play pending Spotify track when player becomes ready
  useEffect(() => {
    if (!pendingSpotifyTrack || !spotifyPlayer.isReady || !spotifyPlayer.deviceId || !accessToken) {
      return
    }
    
    // Validate that the pending track has a valid Spotify ID
    const spotifyId = pendingSpotifyTrack.id && isValidSpotifyId(pendingSpotifyTrack.id) 
      ? pendingSpotifyTrack.id 
      : null
    
    if (!spotifyId) {
      // Not a valid Spotify ID, clear pending track and try preview URL if available
      console.warn("⚠️ [useTrackPlayer] Pending track does not have valid Spotify ID:", pendingSpotifyTrack.id)
      if (pendingSpotifyTrack.preview_url) {
        // Try to play preview URL instead
        setAudioPlaying(true)
        setIsPlaying(true)
      }
      setPendingSpotifyTrack(null)
      return
    }
    
    const playPendingTrack = async () => {
      try {
        console.log("🎵 [useTrackPlayer] Playing pending track via REST API:", spotifyId)
        
        // Get available devices
        const devicesResponse = await fetch("https://api.spotify.com/v1/me/player/devices", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        
        if (devicesResponse.ok) {
          const devicesData = await devicesResponse.json()
          const devices = devicesData.devices || []
          
          // Prefer SDK device if available
          let deviceToUse = null
          if (spotifyPlayer.deviceId) {
            const sdkDevice = devices.find((d: any) => d.id === spotifyPlayer.deviceId)
            if (sdkDevice) {
              deviceToUse = sdkDevice
            }
          }
          
          // Fallback to active device
          if (!deviceToUse) {
            deviceToUse = devices.find((d: any) => d.is_active) || devices[0]
          }
          
          if (deviceToUse) {
            // Transfer playback if needed
            if (!deviceToUse.is_active) {
              await fetch(`https://api.spotify.com/v1/me/player`, {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  device_ids: [deviceToUse.id],
                  play: false,
                }),
              })
              await new Promise(resolve => setTimeout(resolve, 500))
            }
            
            // Start playback
            const playResponse = await fetch(
              `https://api.spotify.com/v1/me/player/play?device_id=${deviceToUse.id}`,
              {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  uris: [`spotify:track:${spotifyId}`],
                }),
              }
            )
            
            if (playResponse.ok || playResponse.status === 204) {
              const trackId = spotifyId || `${pendingSpotifyTrack.title}-${pendingSpotifyTrack.artist}`
              setPlayingTrackId(trackId)
              setAudioPlaying(true)
              setIsPlaying(true)
              
              // Update global player context
              const playerTrack = {
                id: spotifyId || trackId,
                title: pendingSpotifyTrack.title,
                artist: pendingSpotifyTrack.artist,
                album: pendingSpotifyTrack.album,
                album_image_url: pendingSpotifyTrack.album_image_url || pendingSpotifyTrack.cover_art,
                duration: 'duration' in pendingSpotifyTrack ? (pendingSpotifyTrack as any).duration : undefined,
                isSpotify: true,
                spotifyId: spotifyId,
              }
              console.log("🎵 [useTrackPlayer] Setting pending track in player context:", playerTrack)
              playTrackGlobal(playerTrack)
              
              setPendingSpotifyTrack(null) // Clear pending track
            } else {
              throw new Error(`Failed to start playback: ${playResponse.status}`)
            }
          } else {
            throw new Error("No device available")
          }
        } else {
          throw new Error("Failed to get devices")
        }
      } catch (error: any) {
        console.error("❌ [useTrackPlayer] Failed to play pending track:", error)
        toast({
          title: "Playback Error",
          description: error?.message || "Failed to play track. Please try again.",
          variant: "destructive",
        })
        setPendingSpotifyTrack(null)
      }
    }
    playPendingTrack()
  }, [spotifyPlayer.isReady, spotifyPlayer.deviceId, pendingSpotifyTrack, accessToken, spotifyPlayer, playTrackGlobal, setIsPlaying, toast])

  // Sync with Spotify player state
  useEffect(() => {
    if (accessToken && spotifyPlayer.isPlaying && spotifyPlayer.currentTrack) {
      // Find the track that's currently playing
      const playingTrack = tracks.find(t => t.id === spotifyPlayer.currentTrack)
      if (playingTrack) {
        const trackId = playingTrack.id || `${playingTrack.title}-${playingTrack.artist}`
        setPlayingTrackId(trackId)
        setAudioPlaying(true)
      }
    } else if (!spotifyPlayer.isPlaying && !audioRef.current) {
      // If Spotify player stopped and no audio is playing, clear playing state
      setPlayingTrackId(null)
      setAudioPlaying(false)
    }
  }, [spotifyPlayer.isPlaying, spotifyPlayer.currentTrack, accessToken, tracks])

  const handlePlayTrack = async (track: T, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    
    // Get Spotify ID if track has one (check if ID is valid Spotify ID format)
    const spotifyId = track.id && isValidSpotifyId(track.id) ? track.id : null
    const trackId = spotifyId || track.id || `${track.title}-${track.artist}`
    
    // Check if this track is currently playing in global state
    // Normalize track title for comparison
    const normalizedTitle = track.title || (track as any).name || ""
    const normalizedArtist = track.artist || (track as any).artists?.[0]?.name || ""
    
    const isCurrentTrack = globalTrack && (
      globalTrack.id === trackId ||
      globalTrack.id === track.id ||
      globalTrack.spotifyId === track.id ||
      globalTrack.spotifyId === spotifyId ||
      (globalTrack.title === normalizedTitle && globalTrack.artist === normalizedArtist) ||
      (globalTrack.spotifyId === track.id && track.id && track.id.length === 22) // Match by Spotify ID if valid
    )
    
    // Check if this is the current track and its playing state
    const isPlaying = (playingTrackId === trackId && audioPlaying) || (isCurrentTrack && globalIsPlaying)
    const isPaused = isCurrentTrack && !globalIsPlaying // Same track but paused
    
    if (isPlaying) {
      // Pause HTML5 audio if playing
      if (audioRef.current) {
        audioRef.current.pause()
        setAudioPlaying(false)
      }
      
      // Pause via REST API for Spotify tracks
      if (accessToken) {
        try {
          await fetch("https://api.spotify.com/v1/me/player/pause", {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }).catch(() => {
            // Ignore errors - track might not be playing via Spotify
          })
        } catch (e) {
          // Ignore errors
        }
      }
      
      // Update global state
      setPlayingTrackId(null)
      setIsPlaying(false)
      return
    }
    
    // If this is the current track but paused, resume it instead of restarting
    if (isPaused && isCurrentTrack) {
      console.log("▶️ [useTrackPlayer] Resuming paused track")
      
      // Resume HTML5 audio if available
      if (audioRef.current) {
        audioRef.current.play().catch((error) => {
          console.error("❌ [useTrackPlayer] Failed to resume audio:", error)
        })
        setAudioPlaying(true)
      }
      
      // Resume via REST API for Spotify tracks
      if (accessToken && spotifyId) {
        try {
          // Get active device
          const devicesResponse = await fetch("https://api.spotify.com/v1/me/player/devices", {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          
          if (devicesResponse.ok) {
            const devicesData = await devicesResponse.json()
            const devices = devicesData.devices || []
            
            // Use helper function to select best device (excludes Echo/Alexa)
            const preferredDeviceId = spotifyPlayer.isReady && spotifyPlayer.deviceId ? spotifyPlayer.deviceId : null
            const selectedDevice = selectBestDevice(devices, preferredDeviceId)
            
            if (!selectedDevice) {
              console.warn("⚠️ [useTrackPlayer] No device available for resume")
              return
            }
            
            const deviceToUse = selectedDevice
            
            // Always transfer playback to device first (required to avoid 403)
            // Even if it's marked as active, it might not be the active device
            try {
              console.log("🔄 [useTrackPlayer] Transferring playback to device:", deviceToUse.id, deviceToUse.name)
              const transferResponse = await fetch(`https://api.spotify.com/v1/me/player`, {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  device_ids: [deviceToUse.id],
                  play: false, // Don't start playing yet, just transfer
                }),
              })
              
              // Wait for transfer to complete (longer wait to ensure it's active)
              await new Promise(resolve => setTimeout(resolve, 800))
              
              // Verify device is now active
              const verifyResponse = await fetch("https://api.spotify.com/v1/me/player/devices", {
                headers: { Authorization: `Bearer ${accessToken}` },
              })
              
              if (verifyResponse.ok) {
                const verifyData = await verifyResponse.json()
                const devices = verifyData.devices || []
                const device = devices.find((d: any) => d.id === deviceToUse.id)
                if (device && device.is_active) {
                  console.log("✅ [useTrackPlayer] Device is now active:", device.name)
                } else {
                  console.warn("⚠️ [useTrackPlayer] Device transfer may not have completed, but continuing anyway")
                }
              }
            } catch (transferError) {
              console.warn("⚠️ [useTrackPlayer] Failed to transfer playback:", transferError)
            }
            
            // Resume playback without sending URIs (to avoid restarting)
            const playResponse = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceToUse.id}`, {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({}), // Empty body to just resume
            })
            
            if (playResponse.status === 403) {
              console.warn("⚠️ [useTrackPlayer] 403 Forbidden - device may not be available or user doesn't have premium")
              // Try to get a fresh device list and try again with active device
              try {
                const freshDevicesResponse = await fetch("https://api.spotify.com/v1/me/player/devices", {
                  headers: { Authorization: `Bearer ${accessToken}` },
                })
                if (freshDevicesResponse.ok) {
                  const freshDevicesData = await freshDevicesResponse.json()
                  const freshDevices = freshDevicesData.devices || []
                  const activeDevice = freshDevices.find((d: any) => d.is_active)
                  if (activeDevice && activeDevice.id !== deviceToUse.id) {
                    // Try with active device instead
                    console.log("🔄 [useTrackPlayer] Retrying with active device:", activeDevice.id, activeDevice.name)
                    const retryResponse = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${activeDevice.id}`, {
                      method: "PUT",
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({}),
                    })
                    if (retryResponse.ok || retryResponse.status === 204) {
                      console.log("✅ [useTrackPlayer] Resumed playback with active device")
                    } else {
                      const errorText = await retryResponse.text().catch(() => "")
                      console.error("❌ [useTrackPlayer] Retry with active device failed:", retryResponse.status, errorText)
                    }
                  } else {
                    console.warn("⚠️ [useTrackPlayer] No active device found for retry")
                  }
                }
              } catch (retryError) {
                console.error("❌ [useTrackPlayer] Error retrying with active device:", retryError)
              }
            } else if (playResponse.ok || playResponse.status === 204) {
              console.log("✅ [useTrackPlayer] Resumed playback successfully")
            } else if (!playResponse.ok) {
              const errorText = await playResponse.text().catch(() => "")
              console.warn("⚠️ [useTrackPlayer] Failed to resume playback:", playResponse.status, errorText)
            }
          }
        } catch (e) {
          console.warn("⚠️ [useTrackPlayer] Error resuming playback:", e)
        }
      }
      
      // Update global state to playing
      setPlayingTrackId(trackId)
      setIsPlaying(true)
      return
    }

    // Stop any currently playing track
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    // Pause via REST API instead of SDK to avoid "no list was loaded" error
    if (accessToken) {
      try {
        await fetch("https://api.spotify.com/v1/me/player/pause", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }).catch(() => {
          // Ignore errors - track might not be playing via Spotify
        })
      } catch (e) {
        // Ignore errors
      }
    }

    // Play new track
    setPlayingTrackId(trackId)
    
    // Update global player context
    const trackDuration = 'duration' in track ? (track as any).duration : undefined
    // Handle both title and name fields (Spotify API uses 'name', our tracks use 'title')
    const trackTitle = track.title || (track as any).name || "Unknown Track"
    const trackArtist = track.artist || (track as any).artists?.[0]?.name || (track as any).artists?.map((a: any) => a.name).join(", ") || "Unknown Artist"
    
    // Only set isSpotify to true if we have a valid Spotify ID - otherwise use preview URL
    const playerTrack = {
      id: spotifyId || track.id || trackId,
      title: trackTitle,
      artist: trackArtist,
      album: track.album || (track as any).album?.name,
      album_image_url: track.album_image_url || track.cover_art || (track as any).album?.images?.[0]?.url,
      cover_art: track.cover_art || (track as any).album?.images?.[0]?.url,
      preview_url: track.preview_url || (track as any).preview_url,
      duration: trackDuration ? (typeof trackDuration === 'number' ? trackDuration : parseFloat(trackDuration)) : undefined,
      // Only set isSpotify to true if we have a valid Spotify ID - this prevents trying to play via Spotify when we should use preview URL
      isSpotify: !!(accessToken && spotifyId),
      spotifyId: spotifyId || undefined,
    }
    console.log("🎵 [useTrackPlayer] Setting track in player context:", {
      originalTrack: {
        title: track.title,
        name: (track as any).name,
        artist: track.artist,
        id: track.id,
      },
      normalizedTrack: {
        title: trackTitle,
        artist: trackArtist,
        id: playerTrack.id,
      },
      playerTrack: {
        ...playerTrack,
        hasPreviewUrl: !!track.preview_url,
        previewUrl: track.preview_url,
        hasSpotifyId: !!spotifyId,
        willUsePreviewUrl: !spotifyId && !!track.preview_url,
      },
    })
    
    // Set track in context FIRST before doing anything else
    // This ensures the track is visible in MiniPlayer even if we need to fetch preview_url
    console.log("🎵 [useTrackPlayer] About to set track in context:", playerTrack.title)
    playTrackGlobal(playerTrack)
    
    // Also ensure isPlaying is set to true since we're about to play
    setIsPlaying(true)
    
    // Verify track was set (for debugging)
    console.log("🎵 [useTrackPlayer] Track set in context, should be visible in MiniPlayer")
    
    // If user is authenticated and track has valid Spotify ID, use REST API to start playback
    // Always use REST API to start playback - SDK is only for control after playback starts
    if (accessToken && spotifyId) {
      try {
        console.log("🎵 [useTrackPlayer] Starting playback via REST API for track:", spotifyId)
        
        // First, get available devices to find an active device or our Web Playback SDK device
        const devicesResponse = await fetch("https://api.spotify.com/v1/me/player/devices", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        
        if (devicesResponse.ok) {
          const devicesData = await devicesResponse.json()
          const devices = devicesData.devices || []
          
          // Use helper function to select best device (excludes Echo/Alexa)
          const preferredDeviceId = spotifyPlayer.isReady && spotifyPlayer.deviceId ? spotifyPlayer.deviceId : null
          const deviceToUse = selectBestDevice(devices, preferredDeviceId)
          
          if (deviceToUse) {
            console.log("📱 [useTrackPlayer] Using device:", deviceToUse.name, deviceToUse.id, deviceToUse.type)
          } else {
            console.warn("⚠️ [useTrackPlayer] No suitable device found (all may be Echo/smart speakers)")
          }
          
          if (deviceToUse) {
            // Transfer playback to this device first (if not already active)
            if (!deviceToUse.is_active) {
              try {
                await fetch(`https://api.spotify.com/v1/me/player`, {
                  method: "PUT",
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    device_ids: [deviceToUse.id],
                    play: false, // Don't start playing yet, just transfer
                  }),
                })
                console.log("🔄 [useTrackPlayer] Transferred playback to device")
                // Small delay to ensure transfer completes
                await new Promise(resolve => setTimeout(resolve, 500))
              } catch (transferError) {
                console.warn("⚠️ [useTrackPlayer] Failed to transfer playback, continuing anyway:", transferError)
              }
            }
            
            // Now start playing the track
            const playResponse = await fetch(
              `https://api.spotify.com/v1/me/player/play?device_id=${deviceToUse.id}`,
              {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  uris: [`spotify:track:${spotifyId}`],
                }),
              }
            )
            
            if (playResponse.ok || playResponse.status === 204) {
              setAudioPlaying(true)
              setIsPlaying(true)
              console.log("✅ [useTrackPlayer] Track playing via REST API")
            } else {
              const errorText = await playResponse.text().catch(() => "")
              console.error("❌ [useTrackPlayer] REST API play failed:", playResponse.status, errorText)
              
              // Still set playing state - MiniPlayer will try to start playback
              setAudioPlaying(true)
              setIsPlaying(true)
              
              // Only show toast if it's a real error, not just "no device"
              if (playResponse.status !== 404) {
                toast({
                  title: "Playback Error",
                  description: errorText || "Failed to start playback. The mini player will try to start it automatically.",
                  variant: "destructive",
                })
              }
            }
          } else {
            console.warn("⚠️ [useTrackPlayer] No device found, storing as pending")
            setPendingSpotifyTrack(track)
            setAudioPlaying(true)
            setIsPlaying(true)
            toast({
              title: "Player Initializing",
              description: "Player is initializing. Track will play automatically when ready.",
              variant: "default",
            })
          }
        } else {
          console.warn("⚠️ [useTrackPlayer] Failed to get devices")
          // Set playing state anyway - MiniPlayer will try to start playback
          setAudioPlaying(true)
          setIsPlaying(true)
        }
      } catch (error: any) {
        console.error("❌ [useTrackPlayer] REST API play error:", error)
        // Set playing state anyway - MiniPlayer will try to start playback
        setAudioPlaying(true)
        setIsPlaying(true)
      }
    } 
    // If track has preview URL, play it via global player context
    // The MiniPlayer will handle the actual HTML5 audio playback
    else if (track.preview_url) {
      // The playTrackGlobal call above already set the track in context and isPlaying=true
      // The MiniPlayer component will handle the actual audio playback
      // Just update local state for UI sync
      console.log("🎵 [useTrackPlayer] Track has preview URL, will play via HTML5 audio:", track.preview_url)
      setAudioPlaying(true)
      // Don't clear the track - it should stay in context for MiniPlayer
      // The track is already set in context via playTrackGlobal above
    }
    // No preview available and can't play via Spotify
    else {
      console.warn("⚠️ [useTrackPlayer] Track has no preview URL and no valid Spotify ID:", {
        title: track.title,
        hasPreviewUrl: !!track.preview_url,
        hasSpotifyId: !!spotifyId,
        trackId: track.id,
        album_image_url: track.album_image_url,
      })
      
      // Try to fetch preview_url from Spotify if track has Spotify indicators
      const hasSpotifyIndicators = !!(track.album_image_url?.includes("i.scdn.co") || track.album_image_url?.includes("spotify"))
      
      // IMPORTANT: Track is already set in context via playTrackGlobal above
      // Don't clear it - keep it visible in MiniPlayer even if we can't play it yet
      
      if (accessToken && hasSpotifyIndicators && !track.preview_url) {
        // Try to search for the track on Spotify to get preview_url or Spotify ID
        // Do this asynchronously without blocking - track is already in context
        console.log("🔍 [useTrackPlayer] Attempting to fetch preview URL/Spotify ID from Spotify for:", track.title, "by", track.artist)
        
        // Fetch preview URL in background - don't await, let it update when found
        fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(`${track.title} ${track.artist}`)}&type=track&limit=1`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )
        .then(async (searchResponse) => {
          if (searchResponse.ok) {
            const searchData = await searchResponse.json()
            const tracks = searchData.tracks?.items || []
            if (tracks.length > 0) {
              const spotifyTrack = tracks[0]
              const foundSpotifyId = spotifyTrack.id
              
              if (spotifyTrack.preview_url) {
                const foundPreviewUrl = spotifyTrack.preview_url
                console.log("✅ [useTrackPlayer] Found preview URL from Spotify:", foundPreviewUrl)
                
                // Get the current track from context to ensure we have all fields
                const currentContextTrack = globalTrack || playerTrack
                
                // Normalize title and artist to ensure they're always present
                // Prefer original track data (playerTrack) over current context track to preserve original title
                const baseTrack = playerTrack || currentContextTrack
                const normalizedTitle = baseTrack?.title || (baseTrack as any)?.name || spotifyTrack.name || playerTrack?.title || "Unknown Track"
                const normalizedArtist = baseTrack?.artist || (baseTrack as any)?.artists?.[0]?.name || spotifyTrack.artists?.[0]?.name || playerTrack?.artist || "Unknown Artist"
                
                // Update the track in context with the preview URL - preserve all existing fields
                const updatedPlayerTrack = {
                  ...baseTrack,
                  title: normalizedTitle,
                  artist: normalizedArtist,
                  preview_url: foundPreviewUrl,
                  spotifyId: foundSpotifyId,
                  isSpotify: true,
                  // Ensure id is set to the Spotify ID for proper playback
                  id: foundSpotifyId,
                }
                console.log("🔄 [useTrackPlayer] Updating track in context with preview URL:", {
                  originalTitle: playerTrack?.title,
                  contextTitle: currentContextTrack?.title,
                  normalizedTitle: updatedPlayerTrack.title,
                  spotifyId: updatedPlayerTrack.spotifyId,
                  isSpotify: updatedPlayerTrack.isSpotify,
                  hasPreviewUrl: !!updatedPlayerTrack.preview_url,
                })
                playTrackGlobal(updatedPlayerTrack)
                setAudioPlaying(true)
                setIsPlaying(true)
                // MiniPlayer will pick up the preview_url and start playing
              } else if (foundSpotifyId && accessToken) {
                // No preview URL, but we have a Spotify ID - try to play via REST API
                console.log("🎵 [useTrackPlayer] Track found on Spotify but no preview URL. Using Spotify ID to play via REST API:", foundSpotifyId)
                
                // Get the current track from context to ensure we have all fields
                const currentContextTrack = globalTrack || playerTrack
                
                // Normalize title and artist to ensure they're always present
                // Prefer original track data (playerTrack) over current context track to preserve original title
                const baseTrack = playerTrack || currentContextTrack
                const normalizedTitle = baseTrack?.title || (baseTrack as any)?.name || spotifyTrack.name || "Unknown Track"
                const normalizedArtist = baseTrack?.artist || (baseTrack as any)?.artists?.[0]?.name || spotifyTrack.artists?.[0]?.name || "Unknown Artist"
                
                // Update the track in context with the Spotify ID - preserve all existing fields
                const updatedPlayerTrack = {
                  ...baseTrack,
                  title: normalizedTitle,
                  artist: normalizedArtist,
                  spotifyId: foundSpotifyId,
                  isSpotify: true,
                  // Ensure id is set to the Spotify ID for proper playback
                  id: foundSpotifyId,
                }
                console.log("🔄 [useTrackPlayer] Updating track with Spotify ID:", {
                  originalTitle: playerTrack?.title,
                  contextTitle: currentContextTrack?.title,
                  normalizedTitle: updatedPlayerTrack.title,
                  spotifyId: updatedPlayerTrack.spotifyId,
                  isSpotify: updatedPlayerTrack.isSpotify,
                  id: updatedPlayerTrack.id,
                })
                playTrackGlobal(updatedPlayerTrack)
                
                // Ensure playing state is set
                setIsPlaying(true)
                setAudioPlaying(true)
                
                // Try to play via REST API immediately
                try {
                  // Get available devices
                  const devicesResponse = await fetch("https://api.spotify.com/v1/me/player/devices", {
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                    },
                  })
                  
                  if (devicesResponse.ok) {
                    const devicesData = await devicesResponse.json()
                    const devices = devicesData.devices || []
                    
                    // Use helper function to select best device (excludes Echo/Alexa)
                    const preferredDeviceId = spotifyPlayer.isReady && spotifyPlayer.deviceId ? spotifyPlayer.deviceId : null
                    const deviceToUse = selectBestDevice(devices, preferredDeviceId)
                    
                    if (deviceToUse) {
                      // Transfer playback to this device first
                      if (!deviceToUse.is_active) {
                        await fetch(`https://api.spotify.com/v1/me/player`, {
                          method: "PUT",
                          headers: {
                            Authorization: `Bearer ${accessToken}`,
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            device_ids: [deviceToUse.id],
                            play: false,
                          }),
                        }).catch(() => {})
                        await new Promise(resolve => setTimeout(resolve, 500))
                      }
                      
                      // Start playing the track
                      const playResponse = await fetch(
                        `https://api.spotify.com/v1/me/player/play?device_id=${deviceToUse.id}`,
                        {
                          method: "PUT",
                          headers: {
                            Authorization: `Bearer ${accessToken}`,
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            uris: [`spotify:track:${foundSpotifyId}`],
                          }),
                        }
                      )
                      
                      if (playResponse.ok || playResponse.status === 204) {
                        setAudioPlaying(true)
                        setIsPlaying(true)
                        console.log("✅ [useTrackPlayer] Track playing via REST API (no preview URL)")
                      } else {
                        console.warn("⚠️ [useTrackPlayer] Failed to play via REST API:", playResponse.status)
                        setAudioPlaying(true)
                        setIsPlaying(true)
                      }
                    } else {
                      console.warn("⚠️ [useTrackPlayer] No device found for playback")
                      setAudioPlaying(true)
                      setIsPlaying(true)
                    }
                  }
                } catch (error) {
                  console.error("❌ [useTrackPlayer] Error playing via REST API:", error)
                  setAudioPlaying(true)
                  setIsPlaying(true)
                }
              } else {
                console.log("⚠️ [useTrackPlayer] Track found on Spotify but no preview URL and no access token")
              }
            } else {
              console.log("⚠️ [useTrackPlayer] Track not found on Spotify")
            }
          } else {
            const errorText = await searchResponse.text().catch(() => "")
            console.warn("⚠️ [useTrackPlayer] Spotify search failed:", searchResponse.status, errorText)
          }
        })
        .catch((error) => {
          console.warn("⚠️ [useTrackPlayer] Failed to fetch preview URL from Spotify:", error)
        })
        
        // Don't clear track - keep it in context while we search
        // Search happens in background - track will be updated when found
        // Set playing state so MiniPlayer can try to auto-start
        setIsPlaying(true)
        setAudioPlaying(true)
        return // Exit early - track is in context, will be updated when preview_url/Spotify ID is found
      }
      
      // If we couldn't get a preview URL and no Spotify indicators, keep track in context
      // Set playing state so user knows we're trying
      if (accessToken && !spotifyId && !track.preview_url) {
        setIsPlaying(true)
        setAudioPlaying(true)
        // Track is in context, will try to play via REST API if found on Spotify
      }
      // User is not logged in and no preview URL
      else if (!accessToken) {
        // Only show toast if user is not logged in and track can't play
        toast({
          title: "Sign in to Play",
          description: "Sign in to Spotify to play this track.",
          variant: "default",
        })
      }
      setPendingSpotifyTrack(null)
    }
  }

  return {
    playingTrackId,
    audioPlaying,
    handlePlayTrack,
    audioRef,
  }
}

