"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePlayer } from "@/contexts/PlayerContext"
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer"
import { useSpotifyAuth } from "@/components/spotify/SpotifyLogin"
import { Button } from "@/components/ui/button"
import { AlbumArt } from "@/components/ui/album-art"
import { Play, Pause, Volume2, VolumeX, Minimize2, Maximize2, X, SkipBack, SkipForward } from "lucide-react"
import { cn } from "@/lib/utils"

export function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setVolume,
    setCurrentTrack,
    togglePlay,
  } = usePlayer()
  const { accessToken } = useSpotifyAuth()
  const spotifyPlayer = useSpotifyPlayer()
  const [isMinimized, setIsMinimized] = useState(false)
  const [isSeeking, setIsSeeking] = useState(false)
  const [seekPosition, setSeekPosition] = useState<number | null>(null)
  const seekPositionRef = useRef<number | null>(null) // Ref to track seek position for reliable updates
  const [isVolumeDragging, setIsVolumeDragging] = useState(false)
  const [isVolumeHovered, setIsVolumeHovered] = useState(false)
  const isSeekInProgressRef = useRef<boolean>(false) // Track if a seek operation is in progress
  const lastSeekTimeRef = useRef<number>(0) // Track last seek time to debounce
  const lastSeekPositionRef = useRef<number | null>(null) // Track the last seek position to prevent API from overriding it
  const seekCompleteTimeRef = useRef<number>(0) // Track when seek completed to ignore API updates for a short period
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const autoStartAttemptedRef = useRef<string | null>(null) // Track which track ID we've attempted to auto-start
  const rateLimitBackoffRef = useRef<number>(0) // Track backoff time in ms
  const lastRequestTimeRef = useRef<number>(0) // Track last request time to prevent too frequent requests
  const isPlayPauseInProgressRef = useRef<boolean>(false) // Track if play/pause action is in progress
  const lastSpacebarPressRef = useRef<number>(0) // Track last spacebar press time for debouncing
  const trackStartTimeRef = useRef<number>(0) // Track when we started playing the current track (for lenient matching)
  const externalPlaybackStartRef = useRef<number>(0) // Track when playback was started externally (by useTrackPlayer) to prevent double-start
  const lastApiUpdateTimeRef = useRef<number>(0) // Track when we last got an API update for interpolation
  const lastApiPositionRef = useRef<number>(0)
  const lastSdkPositionRef = useRef<number>(0) // Track last SDK position to detect if it's stuck
  const lastSdkUpdateTimeRef = useRef<number>(0) // Track when SDK position last changed
  const lastVolumeSyncTimeRef = useRef<number>(0) // Track when we last synced volume to prevent spam
  const lastSyncedVolumeRef = useRef<number>(volume) // Track last synced volume value to prevent redundant calls // Track the last position from API for interpolation
  const hasInitializedRef = useRef<boolean>(false) // Track if we've initialized (to prevent auto-play on page refresh)
  const justHandledMouseUpRef = useRef<boolean>(false) // Track if we just handled mouseUp to prevent onClick duplicate
  const userActionTimeRef = useRef<number>(0) // Track when user last performed play/pause action to prevent API from overriding
  const currentTimeRef = useRef<number>(currentTime) // Track currentTime in a ref so interval closure always has latest value
  const pausedPositionRef = useRef<number | null>(null) // Track the position when paused to preserve it

  // On initial mount, pause any playback that might be active from previous session
  useEffect(() => {
    if (hasInitializedRef.current) return // Only run once on mount
    hasInitializedRef.current = true

    console.log("🔄 [MiniPlayer] Initial mount - pausing any active playback from previous session")
    
    // Reset playing state on mount FIRST (even if localStorage had it as true)
    // This prevents auto-resuming playback after page refresh
    setIsPlaying(false)
    
    // Pause Spotify playback via REST API if we have access token
    const pauseSpotifyPlayback = async () => {
      if (!accessToken) return
      
      try {
        const response = await fetch("https://api.spotify.com/v1/me/player/pause", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        
        if (response.ok || response.status === 204) {
          console.log("✅ [MiniPlayer] Paused Spotify playback on page refresh")
        } else if (response.status === 404) {
          // 404 means no active playback, which is fine
          console.log("ℹ️ [MiniPlayer] No active Spotify playback to pause (404)")
        } else {
          console.log("ℹ️ [MiniPlayer] Could not pause Spotify playback:", response.status)
        }
      } catch (error) {
        console.log("ℹ️ [MiniPlayer] Could not pause Spotify playback (might not be active):", error)
      }
    }
    
    // Pause Spotify SDK if ready (might not be ready yet on mount, but try anyway)
    if (spotifyPlayer.isReady && spotifyPlayer.pause) {
      try {
        spotifyPlayer.pause()
        console.log("✅ [MiniPlayer] Paused Spotify SDK playback on page refresh")
      } catch (error) {
        console.log("ℹ️ [MiniPlayer] Could not pause Spotify SDK:", error)
      }
    }
    
    // Pause any HTML5 audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      console.log("✅ [MiniPlayer] Paused HTML5 audio on page refresh")
    }
    
    // Attempt to pause Spotify via REST API (async, don't block)
    pauseSpotifyPlayback()
    
    // Also listen for when Spotify SDK becomes ready and pause if needed
    const checkAndPauseSpotify = setInterval(() => {
      if (spotifyPlayer.isReady && spotifyPlayer.pause && !isPlaying) {
        try {
          spotifyPlayer.pause()
          console.log("✅ [MiniPlayer] Paused Spotify SDK (became ready after mount)")
          clearInterval(checkAndPauseSpotify)
        } catch (error) {
          // Ignore errors
        }
      }
    }, 1000)
    
    // Clear interval after 10 seconds (SDK should be ready by then or it's not going to be)
    setTimeout(() => {
      clearInterval(checkAndPauseSpotify)
    }, 10000)
  }, []) // Empty deps - only run on mount

  // Fix isSpotify flag if needed when currentTrack changes
  useEffect(() => {
    
    // Record when track changes for lenient matching
    if (currentTrack) {
      trackStartTimeRef.current = Date.now()
      // Reset interpolation references when track changes
      lastApiUpdateTimeRef.current = Date.now()
      lastApiPositionRef.current = 0
      // Clear paused position when track changes (new track, so no paused position to preserve)
      pausedPositionRef.current = null
    }
    
    // If track has spotifyId and accessToken but isSpotify is false, update it
    if (currentTrack && currentTrack.spotifyId && accessToken && !currentTrack.isSpotify) {
      console.log("🔄 [MiniPlayer] Updating track isSpotify flag to true")
      setCurrentTrack({
        ...currentTrack,
        isSpotify: true,
      })
    }
    
    // If track doesn't have preview_url, that's fine - we're using Spotify REST API for playback
    // Only log this once per track to reduce noise
    if (currentTrack && !currentTrack.preview_url && currentTrack.isSpotify) {
      // This is expected for Spotify tracks playing via REST API - no need to log
    }
  }, [currentTrack?.id, currentTrack?.spotifyId, currentTrack?.isSpotify, currentTrack?.preview_url, accessToken, isPlaying, currentTime, duration, setCurrentTrack])

  // Keep currentTimeRef in sync with currentTime state
  useEffect(() => {
    currentTimeRef.current = currentTime
  }, [currentTime])
  
  // Capture pause position when isPlaying changes to false (even if paused from external source)
  // Only capture once when pause happens, not continuously
  const prevIsPlayingRef = useRef<boolean>(isPlaying)
  useEffect(() => {
    // Only capture when transitioning from playing to paused
    if (prevIsPlayingRef.current && !isPlaying && currentTime > 0) {
      // Track was just paused - save the position ONCE
      pausedPositionRef.current = currentTime
      // Also update interpolation refs to preserve position
      lastApiPositionRef.current = currentTime
      lastApiUpdateTimeRef.current = Date.now()
      console.log("⏸️ [MiniPlayer] Captured pause position:", currentTime)
    } else if (!prevIsPlayingRef.current && isPlaying && pausedPositionRef.current !== null) {
      // Track just resumed - clear paused position after a short delay
      setTimeout(() => {
        pausedPositionRef.current = null
      }, 500)
    }
    // Update ref for next comparison
    prevIsPlayingRef.current = isPlaying
  }, [isPlaying]) // Only depend on isPlaying, not currentTime

  // Track when we're using REST API vs SDK for playback
  const usingRestApiRef = useRef<boolean>(false)
  
  // Update player state from Spotify when using Spotify SDK
  // IMPORTANT: Don't sync from SDK if we're using REST API for playback (to avoid conflicts)
  useEffect(() => {
    // Check if this is a Spotify track (by isSpotify flag or by having spotifyId + accessToken)
    const isSpotifyTrack = currentTrack?.isSpotify || (!!currentTrack?.spotifyId && !!accessToken)
    
    // Don't sync from SDK if we're using REST API (this prevents ping-pong effect)
    // When using REST API, the SDK might not have the track loaded, so its state is unreliable
    if (usingRestApiRef.current && isSpotifyTrack) {
      return // Skip SDK sync when using REST API
    }
    
    // IMPORTANT: Don't sync anything when paused - freeze the position
    if (!isPlaying) {
      return
    }
    
    // Don't sync from SDK if user just performed an action (within last 3 seconds to prevent overriding button clicks)
    const timeSinceUserAction = Date.now() - userActionTimeRef.current
    if (timeSinceUserAction < 3000) {
      return // Skip syncing to prevent overriding user actions
    }
    
    // Don't sync if play/pause action is in progress
    if (isPlayPauseInProgressRef.current) {
      return
    }
    
    if (isSpotifyTrack && spotifyPlayer.isReady) {
      // Only sync if state is different to avoid unnecessary updates
      // But don't trust SDK if it says false when API says true (might not have track loaded)
      if (spotifyPlayer.isPlaying !== isPlaying) {
        // If SDK says not playing but API says playing (and API was updated recently), trust API
        const timeSinceApiUpdate = Date.now() - lastApiUpdateTimeRef.current
        const apiRecentlyUpdated = timeSinceApiUpdate < 5000 // API updated within last 5 seconds
        
        if (!spotifyPlayer.isPlaying && apiRecentlyUpdated) {
          // SDK says false, but API recently said true - SDK might not have track loaded
          // Trust API over SDK in this case
          console.log("⏸️ [MiniPlayer] Ignoring SDK state (false) - API recently confirmed playing, SDK may not have track loaded")
          return
        }
        
        console.log("🔄 [MiniPlayer] Syncing isPlaying from SDK:", spotifyPlayer.isPlaying, "was:", isPlaying)
        setIsPlaying(spotifyPlayer.isPlaying)
      }
      
      // Track SDK position changes to detect if it's stuck
      if (spotifyPlayer.position !== undefined && !isNaN(spotifyPlayer.position)) {
        const newPosition = spotifyPlayer.position
        const positionChanged = Math.abs(newPosition - lastSdkPositionRef.current) > 100 // Changed by more than 100ms
        
        if (positionChanged) {
          lastSdkPositionRef.current = newPosition
          lastSdkUpdateTimeRef.current = Date.now()
        }
      }
      
      // Always update duration from SDK if available (as additional fallback)
      if (spotifyPlayer.duration > 0 && !isNaN(spotifyPlayer.duration)) {
        const durationSeconds = spotifyPlayer.duration / 1000
        // Only update if duration is still 0 or significantly different
        if (duration <= 0 || Math.abs(duration - durationSeconds) > 1) {
          setDuration(durationSeconds)
        }
      }
    }
  }, [currentTrack?.isSpotify, currentTrack?.id, currentTrack?.spotifyId, spotifyPlayer.isPlaying, spotifyPlayer.position, spotifyPlayer.duration, spotifyPlayer.isReady, accessToken, duration, isPlaying, setIsPlaying, setDuration])

  // Smooth progress updates when playing (for both Spotify and audio)
  // For Spotify tracks, we rely on API polling for updates if SDK isn't ready
  // Skip updates while user is seeking to avoid conflicts
  // Progress update interval - runs continuously to update slider and time display
  useEffect(() => {
    // Early return if no track
    if (!currentTrack) {
      return
    }
    
    const updateProgress = () => {
      // Check duration inside the function so interval can be set up even if duration is 0 initially
      if (duration <= 0 || isNaN(duration)) {
        return
      }
      
      // IMPORTANT: When paused, don't update currentTime at all - freeze it
      if (!isPlaying) {
        return // Don't update progress when paused
      }
      
      // Skip if seeking is in progress (check both state and ref for reliability)
      if (isSeekInProgressRef.current || isSeeking || seekPositionRef.current !== null) {
        return
      }
      
      // Don't update if we just completed a seek (ignore API updates for 2 seconds after seek)
      const timeSinceSeek = Date.now() - seekCompleteTimeRef.current
      if (timeSinceSeek < 2000 && lastSeekPositionRef.current !== null) {
        // Use the seek position and interpolate from there
        const timeSinceSeekComplete = (Date.now() - seekCompleteTimeRef.current) / 1000
        const interpolatedTime = lastSeekPositionRef.current + timeSinceSeekComplete
        if (interpolatedTime >= 0 && interpolatedTime <= duration) {
          setCurrentTime(interpolatedTime)
          lastApiPositionRef.current = interpolatedTime
          lastApiUpdateTimeRef.current = Date.now()
        }
        return
      }
      
      // Check if this is a Spotify track (by isSpotify flag or by having spotifyId + accessToken)
      const isSpotifyTrack = currentTrack?.isSpotify || (!!currentTrack?.spotifyId && !!accessToken)
      
      // Check if SDK position is stale (hasn't changed in 2 seconds while playing)
      const sdkStale = isSpotifyTrack && spotifyPlayer.isReady && isPlaying && 
                       (Date.now() - lastSdkUpdateTimeRef.current) > 2000
      
      // For Spotify tracks, prefer API if SDK is stale, otherwise use SDK if available
      if (isSpotifyTrack && spotifyPlayer.isReady && spotifyPlayer.position !== undefined && 
          !isNaN(spotifyPlayer.position) && spotifyPlayer.position >= 0 && !sdkStale) {
        // Skip SDK updates if actively seeking (check both state and ref)
        if (isSeeking || isSeekInProgressRef.current || seekPositionRef.current !== null) {
          return
        }
        
        // Use the SDK position directly (only if not stale)
        const newTime = spotifyPlayer.position / 1000
        // Only update if it's significantly different from last seek position (more than 1 second)
        // This prevents API from overriding recent seek
        if (newTime >= 0 && !isNaN(newTime)) {
          if (lastSeekPositionRef.current === null || Math.abs(newTime - lastSeekPositionRef.current) > 1) {
            setCurrentTime(newTime)
            lastApiUpdateTimeRef.current = Date.now()
            lastApiPositionRef.current = newTime
          }
        }
      } else if (audioRef.current && audioRef.current.readyState >= 2) {
        // Skip audio element updates if actively seeking (check both state and ref)
        if (isSeeking || isSeekInProgressRef.current || seekPositionRef.current !== null) {
          return
        }
        
        // For audio element, use its currentTime (readyState >= 2 means enough data loaded)
        const newTime = audioRef.current.currentTime
        if (newTime >= 0 && !isNaN(newTime)) {
          setCurrentTime(newTime)
          lastApiUpdateTimeRef.current = Date.now()
          lastApiPositionRef.current = newTime
        }
      } else if (isSpotifyTrack && isPlaying) {
        // Skip interpolation if actively seeking (check both state and ref)
        if (isSeeking || isSeekInProgressRef.current || seekPositionRef.current !== null) {
          return
        }
        
        // For Spotify tracks (SDK not ready or stale), interpolate between API updates
        // Use ref to get latest value since we removed currentTime from dependencies
        const latestCurrentTime = currentTimeRef.current
        
        // Use seek position as base if available, otherwise use last API position, otherwise use current time
        let baseTime = lastSeekPositionRef.current !== null ? lastSeekPositionRef.current : lastApiPositionRef.current
        
        // Calculate elapsed time since last API update
        let timeSinceLastUpdate = (Date.now() - lastApiUpdateTimeRef.current) / 1000 // seconds
        
        // If baseTime is 0, we might be just starting playback
        // Check if we have a currentTime that's already incrementing
        if (baseTime === 0) {
          if (latestCurrentTime > 0) {
            // Use currentTime as base if it's already incrementing
            baseTime = latestCurrentTime
            // Initialize the refs if they're not set
            if (lastApiPositionRef.current === 0) {
              lastApiPositionRef.current = latestCurrentTime
              lastApiUpdateTimeRef.current = Date.now()
              timeSinceLastUpdate = 0
            }
          } else {
            // Starting from 0 - ensure lastApiUpdateTimeRef is initialized
            // If it hasn't been initialized (is 0 or very old), initialize it now
            if (lastApiUpdateTimeRef.current === 0 || timeSinceLastUpdate > 5) {
              lastApiUpdateTimeRef.current = Date.now()
              timeSinceLastUpdate = 0
            }
            // baseTime stays 0, and we'll increment using timeSinceLastUpdate
            // This allows progress to start from 0 immediately
          }
        }
        
        const finalTime = baseTime + timeSinceLastUpdate
        
        // Always update if playing and finalTime is within bounds
        // Even if baseTime is 0, we still increment to show progress
        if (finalTime >= 0 && finalTime <= duration) {
          setCurrentTime(finalTime)
          // Update the last position so interpolation continues smoothly
          // Only update if finalTime is greater than lastApiPositionRef to prevent going backwards
          if (lastApiPositionRef.current < finalTime || lastApiPositionRef.current === 0) {
            lastApiPositionRef.current = finalTime
            lastApiUpdateTimeRef.current = Date.now()
          }
        } else if (latestCurrentTime > 0 && latestCurrentTime <= duration) {
          // If finalTime is out of bounds but currentTime is valid, keep using it
          // and update interpolation base to currentTime if needed
          if (lastApiPositionRef.current === 0 || lastApiPositionRef.current < latestCurrentTime) {
            lastApiPositionRef.current = latestCurrentTime
            lastApiUpdateTimeRef.current = Date.now()
          }
        }
      }
      // When paused, the updateProgress function returns early, so currentTime stays frozen
      // No need for special paused handling here since we return early in updateProgress
    }

    // Update every 100ms for smooth progress bar movement
    // This ensures the slider and time display update smoothly
    const interval = setInterval(updateProgress, 100)

    return () => {
      clearInterval(interval)
    }
    // Note: Don't include currentTime in dependencies to avoid recreating interval constantly
    // The updateProgress function will access the latest values via closure
  }, [currentTrack, isPlaying, duration, currentTrack?.isSpotify, currentTrack?.spotifyId, accessToken, spotifyPlayer.isReady, spotifyPlayer.position, isSeeking, setCurrentTime])

  // Helper function to validate Spotify track ID
  const isValidSpotifyId = (id: string | undefined): boolean => {
    if (!id) return false
    // Spotify IDs are 22 characters, base62 encoded (alphanumeric), no hyphens
    if (id.startsWith("local-") || id.startsWith("temp-")) return false
    if (id.includes("-")) return false // UUIDs have hyphens, Spotify IDs don't
    if (id.length !== 22) return false
    return /^[a-zA-Z0-9]+$/.test(id)
  }

  // Helper function to filter out Echo/Alexa devices and prefer desktop/web players
  const selectBestDevice = useCallback((devices: any[], preferredDeviceId: string | null = null) => {
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
      console.warn("⚠️ [MiniPlayer] Only Echo/smart speaker devices available, using first available device")
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
  }, [])

  // Auto-start playback when a Spotify track is set and isPlaying is true
  useEffect(() => {
    // Don't auto-start on initial mount (after page refresh) - wait for user interaction
    if (!hasInitializedRef.current) {
      return
    }
    
    const isSpotifyTrack = currentTrack?.isSpotify || (!!currentTrack?.spotifyId && !!accessToken)
    const spotifyId = currentTrack?.spotifyId && isValidSpotifyId(currentTrack.spotifyId) 
      ? currentTrack.spotifyId 
      : (currentTrack?.id && isValidSpotifyId(currentTrack.id) ? currentTrack.id : null)
    const trackId = spotifyId || currentTrack?.id || null
    
    // Reset auto-start attempt when track changes
    if (autoStartAttemptedRef.current !== trackId && trackId) {
      autoStartAttemptedRef.current = null
      externalPlaybackStartRef.current = 0 // Reset external start tracking when track changes
    }
    
    // Check if playback was just started externally (by useTrackPlayer) - prevent double-start
    const timeSinceExternalStart = Date.now() - externalPlaybackStartRef.current
    const wasStartedExternally = timeSinceExternalStart < 2000 // Within last 2 seconds
    
    // Only auto-start if:
    // 1. We've initialized (not on first mount after page refresh)
    // 2. It's a Spotify track
    // 3. We have access token
    // 4. We have a valid Spotify ID
    // 5. isPlaying is true (track should be playing)
    // 6. We haven't already attempted to start this track
    // 7. Playback wasn't just started externally (by useTrackPlayer)
    if (!isSpotifyTrack || !accessToken || !spotifyId || !isPlaying || autoStartAttemptedRef.current || wasStartedExternally) {
      if (wasStartedExternally) {
        console.log("⏸️ [MiniPlayer] Skipping auto-start - playback was started externally (useTrackPlayer)")
      }
      return
    }
    
    // SDK not ready but we have a Spotify track - try to start playback via REST API
    // Only attempt once per track
    // Add a small delay to check if useTrackPlayer already started playback
    if (spotifyId && !autoStartAttemptedRef.current) {
      autoStartAttemptedRef.current = spotifyId
      
      const startPlayback = async () => {
        try {
          // First, check if playback is already active (useTrackPlayer might have started it)
          try {
            const playbackCheck = await fetch("https://api.spotify.com/v1/me/player", {
              headers: { Authorization: `Bearer ${accessToken}` },
            })
            
            if (playbackCheck.ok) {
              const playbackState = await playbackCheck.json()
              const currentTrackUri = playbackState.item?.uri
              const expectedUri = `spotify:track:${spotifyId}`
              
              // If the same track is already playing, don't start again
              if (currentTrackUri === expectedUri && playbackState.is_playing) {
                console.log("✅ [MiniPlayer] Playback already active, skipping auto-start")
                usingRestApiRef.current = true
                trackStartTimeRef.current = Date.now()
                lastApiUpdateTimeRef.current = Date.now()
                return
              }
            }
          } catch (checkError) {
            // If check fails, continue with auto-start
            console.log("ℹ️ [MiniPlayer] Could not check playback state, proceeding with auto-start")
          }
          
          // Small delay to give useTrackPlayer time to start first
          await new Promise(resolve => setTimeout(resolve, 300))
          
          // Check again after delay
          try {
            const playbackCheck2 = await fetch("https://api.spotify.com/v1/me/player", {
              headers: { Authorization: `Bearer ${accessToken}` },
            })
            
            if (playbackCheck2.ok) {
              const playbackState = await playbackCheck2.json()
              const currentTrackUri = playbackState.item?.uri
              const expectedUri = `spotify:track:${spotifyId}`
              
              if (currentTrackUri === expectedUri && playbackState.is_playing) {
                console.log("✅ [MiniPlayer] Playback started by useTrackPlayer, skipping auto-start")
                usingRestApiRef.current = true
                trackStartTimeRef.current = Date.now()
                lastApiUpdateTimeRef.current = Date.now()
                return
              }
            }
          } catch (checkError2) {
            // Continue with auto-start
          }
          
          console.log("🚀 [MiniPlayer] Auto-starting playback via REST API for track:", spotifyId)
          usingRestApiRef.current = true // Mark that we're using REST API
          
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
              console.log("📱 [MiniPlayer] Using device for auto-play:", deviceToUse.name, deviceToUse.id)
              
              // Always transfer playback to device first (required to avoid 403)
              try {
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
                await new Promise(resolve => setTimeout(resolve, 800)) // Wait longer for transfer
              } catch (transferError) {
                console.warn("⚠️ [MiniPlayer] Failed to transfer playback, continuing anyway:", transferError)
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
                console.log("✅ [MiniPlayer] Auto-started playback via REST API")
                trackStartTimeRef.current = Date.now()
                lastApiUpdateTimeRef.current = Date.now() // Track when API started
              } else {
                const errorText = await playResponse.text().catch(() => "")
                console.error("❌ [MiniPlayer] Auto-start playback failed:", playResponse.status, errorText)
                usingRestApiRef.current = false // Clear flag on error
                // Reset so we can try again later
                autoStartAttemptedRef.current = null
              }
            } else {
              console.warn("⚠️ [MiniPlayer] No device available for auto-play")
              // Reset so we can try again later
              autoStartAttemptedRef.current = null
            }
          } else {
            console.error("❌ [MiniPlayer] Failed to get devices for auto-play:", devicesResponse.status)
            // Reset so we can try again later
            autoStartAttemptedRef.current = null
          }
        } catch (error) {
          console.error("❌ [MiniPlayer] Auto-start playback error:", error)
          // Reset so we can try again later
          autoStartAttemptedRef.current = null
        }
      }
      
      // Small delay to ensure track is fully set
      const timeoutId = setTimeout(startPlayback, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [currentTrack?.id, currentTrack?.spotifyId, currentTrack?.isSpotify, accessToken, spotifyPlayer.isReady, spotifyPlayer.deviceId, isPlaying])

  // Poll Spotify API directly to get current playback state
  // Always poll API for Spotify tracks to get accurate position updates
  useEffect(() => {
    // Check if this is a Spotify track (by isSpotify flag or by having spotifyId + accessToken)
    const isSpotifyTrack = currentTrack?.isSpotify || (!!currentTrack?.spotifyId && !!accessToken)
    
    // We can poll the API if we have accessToken and a Spotify track
    if (!isSpotifyTrack || !accessToken) {
      return
    }

    // Check if we're already rate limited BEFORE doing anything
    const now = Date.now()
    if (rateLimitBackoffRef.current > now) {
      // Already rate limited - don't start polling at all
      return
    }

    const fetchPlaybackState = async () => {
      try {
        // Check if we're in a backoff period due to rate limiting
        const now = Date.now()
        if (rateLimitBackoffRef.current > now) {
          // Don't log - just silently skip during backoff
          return
        }

        // Enforce minimum time between requests (even if not rate limited)
        const minRequestInterval = isPlaying ? 3000 : 5000 // 3s when playing, 5s when paused to reduce API calls
        if (lastRequestTimeRef.current > 0 && (now - lastRequestTimeRef.current) < minRequestInterval) {
          return
        }

        lastRequestTimeRef.current = now
        const response = await fetch("https://api.spotify.com/v1/me/player", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        // Handle rate limiting (429) - stop polling for extended period
        if (response.status === 429) {
          // Get retry-after header if available, otherwise use longer backoff
          const retryAfter = response.headers.get("retry-after")
          let backoffMs = 300000 // Default 5 minutes (much longer to avoid repeated rate limits)
          
          if (retryAfter) {
            backoffMs = Math.max(parseInt(retryAfter) * 1000, 180000) // At least 3 minutes
          } else {
            // Exponential backoff: start with 5 minutes, double each time
            const currentBackoff = rateLimitBackoffRef.current > now ? (rateLimitBackoffRef.current - now) : 300000
            backoffMs = Math.min(currentBackoff * 2, 1800000) // Cap at 30 minutes
          }
          
          rateLimitBackoffRef.current = now + backoffMs
          // Clear the interval check - we'll stop polling entirely
          // Don't log errors for rate limits - they're expected and handled
          return
        }

        // Reset backoff on successful request
        if (rateLimitBackoffRef.current > 0) {
          rateLimitBackoffRef.current = 0
        }

        // Check for 204 No Content first (player not active)
        if (response.status === 204) {
          console.log("⏸️ [MiniPlayer] Spotify player not active (204 No Content)")
          // Don't try to auto-start here - the auto-start effect above handles it
          // This prevents infinite loops and rate limiting
          return
        }

        if (response.ok) {
          // Check if response has content before parsing JSON
          const contentType = response.headers.get("content-type")
          const contentLength = response.headers.get("content-length")
          
          // If content-length is 0 or content-type doesn't indicate JSON, skip parsing
          if (contentLength === "0" || (contentType && !contentType.includes("application/json"))) {
            console.log("⏸️ [MiniPlayer] Response has no JSON content")
            return
          }

          // Try to get text first to check if it's empty
          const text = await response.text()
          if (!text || text.trim().length === 0) {
            console.log("⏸️ [MiniPlayer] Response body is empty")
            return
          }

          // Parse JSON only if we have content
          let data
          try {
            data = JSON.parse(text)
          } catch (parseError) {
            console.error("❌ [MiniPlayer] Failed to parse JSON response:", parseError)
            return
          }

          // Don't log API responses - too noisy
          
          if (data && data.item) {
            // Check if this is the current track (by ID or URI)
            const trackIdToMatch = currentTrack.spotifyId || currentTrack.id
            const trackMatches = data.item.id === trackIdToMatch || 
                                data.item.uri === `spotify:track:${trackIdToMatch}` ||
                                data.item.id === currentTrack.id
            
            // If we just started playing (within last 5 seconds), be lenient with matching
            // The API might take a moment to update, or there might be a different track playing
            const timeSinceStart = Date.now() - trackStartTimeRef.current
            const justStarted = timeSinceStart < 5000 // 5 seconds grace period
            
            // Only log detailed matching info if there's actually a mismatch (to reduce console noise)
            if (!trackMatches) {
              console.log("🔍 [MiniPlayer] Track matching:", {
                trackIdToMatch,
                currentTrackId: currentTrack.id,
                currentTrackSpotifyId: currentTrack.spotifyId,
                apiItemId: data.item.id,
                apiItemUri: data.item.uri,
                matches: trackMatches,
                justStarted,
                timeSinceStart,
              })
            }
            
            if (trackMatches) {
              // Don't update isPlaying if user just performed an action (within last 2 seconds)
              const timeSinceUserAction = Date.now() - userActionTimeRef.current
              const shouldUpdatePlayingState = timeSinceUserAction >= 2000
              
              // Don't update if play/pause action is in progress
              const actionInProgress = isPlayPauseInProgressRef.current
              
              if (shouldUpdatePlayingState && !actionInProgress) {
                // Only update isPlaying if we haven't just started playing (within last 3 seconds)
                // This prevents the API from overriding the playing state immediately after starting playback
                const timeSinceStart = Date.now() - trackStartTimeRef.current
                const justStarted = timeSinceStart < 3000 // 3 seconds grace period
                
                if (!justStarted || data.is_playing) {
                  // Only update if not just started, or if API confirms it's playing
                  // And only if state is actually different
                  if (data.is_playing !== isPlaying) {
                    // When using REST API, trust API over SDK
                    usingRestApiRef.current = true // Mark that we're using REST API
                    console.log("🔄 [MiniPlayer] Syncing isPlaying from API:", data.is_playing, "was:", isPlaying)
                    setIsPlaying(data.is_playing)
                    lastApiUpdateTimeRef.current = Date.now() // Track when API updated
                  }
                } else {
                  console.log("⏸️ [MiniPlayer] Keeping isPlaying=true (just started, API not updated yet)")
                }
              } else if (actionInProgress) {
                console.log("⏸️ [MiniPlayer] Skipping isPlaying update (play/pause action in progress)")
              } else {
                console.log("⏸️ [MiniPlayer] Skipping isPlaying update (user action within last 2 seconds)")
              }
              
              // Don't update currentTime from API if we recently sought (within last 2 seconds)
              // This prevents API from overriding the seek position
              const timeSinceSeek = Date.now() - seekCompleteTimeRef.current
              const recentlySought = timeSinceSeek < 2000 && lastSeekPositionRef.current !== null
              
              // Skip API updates if actively seeking or recently sought (check both state and ref)
              if (isSeeking || isSeekInProgressRef.current || seekPositionRef.current !== null || recentlySought) {
                return
              }
              
              // IMPORTANT: When paused, don't update currentTime from API at all
              // The position should stay frozen at the pause position
              if (!isPlaying || !data.is_playing) {
                // Track is paused - don't update currentTime, preserve the paused position
                return
              }
              
              if (!recentlySought && !isSeekInProgressRef.current) {
                
                // Update currentTime from API - this is how the slider gets updated
                const newTime = (data.progress_ms || 0) / 1000
                if (newTime >= 0 && !isNaN(newTime)) {
                  // Always update if lastSeekPositionRef is null (not seeking)
                  // Or if it's significantly different from last seek position (more than 1.5 seconds)
                  // This prevents API from overriding recent seek while allowing normal updates
                  const shouldUpdate = lastSeekPositionRef.current === null || 
                                      Math.abs(newTime - lastSeekPositionRef.current) > 1.5 ||
                                      Math.abs(newTime - currentTime) > 0.5 // Update if currentTime is more than 0.5s off
                  
                  if (shouldUpdate) {
                    // Double-check we're not seeking before updating (extra safety)
                    if (!isSeeking && !isSeekInProgressRef.current && seekPositionRef.current === null) {
                      setCurrentTime(newTime)
                      // Update interpolation references for smooth progress between API calls
                      lastApiUpdateTimeRef.current = Date.now()
                      lastApiPositionRef.current = newTime
                      // Reset SDK position tracking when API updates (in case SDK was stuck)
                      if (Math.abs(newTime - (lastSdkPositionRef.current / 1000)) > 1) {
                        // API position differs significantly from SDK, SDK might be stuck
                        lastSdkUpdateTimeRef.current = 0 // Force SDK to be considered stale
                      }
                    }
                  }
                }
              } else if (recentlySought) {
                // If we recently sought, update the interpolation base but don't override the seek position
                // This allows smooth progress from the seek position
                // But only if we're not actively seeking (check ref)
                if (seekPositionRef.current === null && !isSeeking && !isSeekInProgressRef.current) {
                  const seekTime = lastSeekPositionRef.current!
                  lastApiPositionRef.current = seekTime
                  lastApiUpdateTimeRef.current = Date.now()
                  // Still update currentTime if it's significantly different from seek position (more than 1s)
                  // This handles cases where seek completed but API hasn't caught up yet
                  if (Math.abs(currentTime - seekTime) > 1) {
                    setCurrentTime(seekTime)
                  }
                }
              }
              // Don't log updates - too noisy
              
              // Always update duration from API if available (as backup to track API call)
              if (data.item.duration_ms && data.item.duration_ms > 0 && !isNaN(data.item.duration_ms)) {
                const durationSeconds = data.item.duration_ms / 1000
                // Only update if duration is still 0 or significantly different (in case track API failed)
                if (duration <= 0 || Math.abs(duration - durationSeconds) > 1) {
                  setDuration(durationSeconds)
                  console.log("📊 [MiniPlayer] Updated duration from playback state:", durationSeconds, "seconds")
                }
              }
            } else if (justStarted) {
              // If we just started playing and there's a mismatch, it might be the API hasn't updated yet
              // Or we might have started playing a different track - update our track to match what's actually playing
              console.log("ℹ️ [MiniPlayer] Track mismatch but just started - updating track to match what's playing:", data.item.id)
              
              // If the API is playing something and we just started, update our track to match
              // Only update if user hasn't just performed an action
              const timeSinceUserAction = Date.now() - userActionTimeRef.current
              if (data.is_playing && data.item.id && timeSinceUserAction >= 2000) {
                // Extract track ID from URI if needed
                const apiTrackId = data.item.id || (data.item.uri?.replace('spotify:track:', '') || '')
                // Preserve existing title/artist if available, otherwise use API data
                const updatedTitle = currentTrack?.title || data.item.name || "Unknown Track"
                const updatedArtist = currentTrack?.artist || data.item.artists?.[0]?.name || data.item.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist"
                
                setCurrentTrack({
                  ...currentTrack,
                  title: updatedTitle,
                  artist: updatedArtist,
                  spotifyId: apiTrackId,
                  isSpotify: true,
                })
                setIsPlaying(data.is_playing)
                // Don't update currentTime if actively seeking
                if (!isSeeking && !isSeekInProgressRef.current && seekPositionRef.current === null) {
                  const newTime = (data.progress_ms || 0) / 1000
                  setCurrentTime(newTime)
                  console.log("🔄 [MiniPlayer] Updated current track to match what's actually playing")
                }
              }
            } else {
              // Only warn if it's been more than 5 seconds and tracks still don't match
              console.warn("⚠️ [MiniPlayer] Track mismatch - API track doesn't match current track", {
                expected: trackIdToMatch,
                actual: data.item.id,
              })
            }
          } else {
            console.warn("⚠️ [MiniPlayer] Playback state response missing item data")
          }
        } else if (response.status !== 429) {
          // Only log non-rate-limit errors
          const errorText = await response.text().catch(() => "")
          if (response.status !== 401 && response.status !== 403) {
            // Don't log auth errors either - they're handled elsewhere
          }
        }
      } catch (error) {
        // Only log unexpected errors, not network issues
        if (error instanceof TypeError && error.message.includes('fetch')) {
          // Network error - don't log
        }
      }
    }

    // Don't reset backoff when track changes if we're already rate limited
    // This prevents making requests immediately after getting rate limited
    if (rateLimitBackoffRef.current < now) {
      // Not rate limited, safe to reset
      rateLimitBackoffRef.current = 0
      lastRequestTimeRef.current = 0
    }
    // Note: Even if rate limited, we still set up the interval
    // The interval will check backoff before making requests

    // Poll for progress updates - increased intervals to reduce rate limiting
    // Use 5 seconds when playing, 10 seconds when paused to reduce API calls
    const pollInterval = isPlaying ? 5000 : 10000
    
    // Make immediate request when playing starts, then poll regularly
    let initialTimeout: NodeJS.Timeout | undefined = undefined
    let interval: NodeJS.Timeout | undefined = undefined
    
    if (isPlaying) {
      // Small delay to let playback start
      initialTimeout = setTimeout(() => {
        fetchPlaybackState()
      }, 500)
      
      interval = setInterval(() => {
        const currentTime = Date.now()
        // Only poll if not in backoff period AND enough time has passed since last request
        if (rateLimitBackoffRef.current < currentTime) {
          // Check minimum interval (3 seconds to reduce API calls)
          if (lastRequestTimeRef.current === 0 || (currentTime - lastRequestTimeRef.current) >= 3000) {
            fetchPlaybackState()
          }
        }
      }, pollInterval)
    } else {
      // When paused, poll less frequently
      interval = setInterval(() => {
        const currentTime = Date.now()
        if (rateLimitBackoffRef.current < currentTime) {
          // Check minimum interval (5 seconds when paused)
          if (lastRequestTimeRef.current === 0 || (currentTime - lastRequestTimeRef.current) >= 5000) {
            fetchPlaybackState()
          }
        }
      }, pollInterval)
    }
    
    return () => {
      if (initialTimeout) clearTimeout(initialTimeout)
      if (interval) clearInterval(interval)
    }
  }, [currentTrack?.id, currentTrack?.spotifyId, currentTrack?.isSpotify, accessToken, isPlaying, duration, setIsPlaying, setCurrentTime, setDuration, spotifyPlayer.isReady, spotifyPlayer.position])

  // Sync volume with Spotify SDK player (only if SDK is ready)
  useEffect(() => {
    // Check if this is a Spotify track (by isSpotify flag or by having spotifyId + accessToken)
    const isSpotifyTrack = currentTrack?.isSpotify || (!!currentTrack?.spotifyId && !!accessToken)
    
    if (isSpotifyTrack && spotifyPlayer.isReady && spotifyPlayer.setVolume) {
      // Spotify volume is 0-1, ensure it's within range
      const clampedVolume = Math.max(0, Math.min(1, volume))
      
      // Only sync if volume actually changed (more than 2% difference) and enough time has passed
      const volumeChanged = Math.abs(clampedVolume - lastSyncedVolumeRef.current) > 0.02
      const now = Date.now()
      const timeSinceLastSync = now - lastVolumeSyncTimeRef.current
      
      if (volumeChanged && timeSinceLastSync > 500) { // Only sync if changed and 500ms has passed (reduced from 1s for responsiveness)
        lastVolumeSyncTimeRef.current = now
        lastSyncedVolumeRef.current = clampedVolume
        try {
          spotifyPlayer.setVolume(clampedVolume)
        } catch (error: any) {
          // Ignore "no list was loaded" errors - expected when using REST API for playback
          if (error?.message && !error.message.includes("no list was loaded") && !error.message.includes("Cannot perform operation")) {
            console.error("❌ [MiniPlayer] Failed to set Spotify SDK volume:", error)
          }
        }
      }
    }
  }, [volume, currentTrack?.isSpotify, currentTrack?.spotifyId, accessToken, spotifyPlayer.isReady])

  // Sync volume with audio element immediately when volume state changes
  useEffect(() => {
    if (audioRef.current) {
      // Ensure volume is within valid range (0-1)
      const clampedVolume = Math.max(0, Math.min(1, volume))
      try {
        const oldVolume = audioRef.current.volume
        if (Math.abs(oldVolume - clampedVolume) > 0.01) { // Only update if changed significantly
          audioRef.current.volume = clampedVolume
        }
      } catch (error) {
        console.error("❌ [MiniPlayer] Failed to set audio element volume:", error)
      }
    }
  }, [volume])

  // Fetch track duration from Spotify API when track changes (for Spotify tracks)
  useEffect(() => {
    if (!currentTrack) return
    
    // Check if this is a Spotify track (by isSpotify flag or by having spotifyId + accessToken)
    const isSpotifyTrack = currentTrack?.isSpotify || (!!currentTrack?.spotifyId && !!accessToken)
    
    // Debug log to help diagnose track recognition issues
    if (currentTrack && accessToken) {
      console.log("🔍 [MiniPlayer] Track check:", {
        title: currentTrack.title,
        isSpotifyFlag: currentTrack?.isSpotify,
        spotifyId: currentTrack?.spotifyId,
        hasSpotifyId: !!currentTrack?.spotifyId,
        trackId: currentTrack?.id,
        detectedAsSpotify: isSpotifyTrack,
        hasAccessToken: !!accessToken,
      })
    }
    
    if (!isSpotifyTrack || !accessToken) {
      return
    }

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

    // Use spotifyId if available and valid, otherwise check if id is a valid Spotify ID
    let spotifyTrackId: string | null = null
    if (currentTrack.spotifyId && isValidSpotifyId(currentTrack.spotifyId)) {
      spotifyTrackId = currentTrack.spotifyId
    } else if (currentTrack.id && isValidSpotifyId(currentTrack.id)) {
      spotifyTrackId = currentTrack.id
    }

    // If no valid Spotify ID, use duration from track data if available
    if (!spotifyTrackId) {
      if (currentTrack.duration && currentTrack.duration > 0) {
        console.log("📊 [MiniPlayer] Using duration from track data:", currentTrack.duration, "seconds")
        setDuration(currentTrack.duration)
      } else {
        console.log("⚠️ [MiniPlayer] No valid Spotify track ID and no duration in track data", {
          currentTrackId: currentTrack.id,
          currentTrackSpotifyId: currentTrack.spotifyId,
          hasDuration: !!currentTrack.duration,
        })
      }
      return
    }

    const fetchTrackDuration = async () => {
      try {
        // Check if we're in a backoff period due to rate limiting
        const now = Date.now()
        if (rateLimitBackoffRef.current > now) {
          const remainingMs = rateLimitBackoffRef.current - now
          console.log(`⏳ [MiniPlayer] Rate limit backoff active, skipping duration fetch (${Math.ceil(remainingMs / 1000)}s remaining)`)
          // Will try again via playback state polling
          return
        }

        console.log("📡 [MiniPlayer] Fetching track duration for:", spotifyTrackId)
        const response = await fetch(`https://api.spotify.com/v1/tracks/${spotifyTrackId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        // Handle rate limiting (429)
        if (response.status === 429) {
          const retryAfter = response.headers.get("retry-after")
          let backoffMs = 60000 // Default 60 seconds
          
          if (retryAfter) {
            backoffMs = Math.max(parseInt(retryAfter) * 1000, 60000) // At least 1 minute
          } else {
            const currentBackoff = rateLimitBackoffRef.current > now ? (rateLimitBackoffRef.current - now) : 120000
            backoffMs = Math.min(currentBackoff * 2, 600000) // Cap at 10 minutes
          }
          
          rateLimitBackoffRef.current = now + backoffMs
          // Will try again via playback state polling
          return
        }

        if (response.ok) {
          const data = await response.json()
          console.log("📡 [MiniPlayer] Track API response:", {
            trackId: data.id,
            name: data.name,
            durationMs: data.duration_ms,
          })
          
          if (data.duration_ms && data.duration_ms > 0) {
            const durationSeconds = data.duration_ms / 1000
            setDuration(durationSeconds)
            console.log("✅ [MiniPlayer] Fetched track duration from API:", durationSeconds, "seconds for track", spotifyTrackId)
          } else {
            console.warn("⚠️ [MiniPlayer] Track duration not available in API response")
            // Fall back to duration from track data if available
            if (currentTrack.duration && currentTrack.duration > 0) {
              console.log("📊 [MiniPlayer] Using duration from track data:", currentTrack.duration, "seconds")
              setDuration(currentTrack.duration)
            }
          }
        } else {
          // Handle 400 Bad Request (invalid ID) - don't log as error, just use track data
          if (response.status === 400) {
            console.log("ℹ️ [MiniPlayer] Track ID is not a valid Spotify ID, using duration from track data")
            if (currentTrack.duration && currentTrack.duration > 0) {
              setDuration(currentTrack.duration)
            }
            return
          }
          
          const errorText = await response.text().catch(() => "")
          console.error("❌ [MiniPlayer] Failed to fetch track duration, status:", response.status, response.statusText)
          console.error("❌ [MiniPlayer] Error response:", errorText)
          
          // If API call fails and we have duration in track data, use it
          if (currentTrack.duration && currentTrack.duration > 0) {
            console.log("📊 [MiniPlayer] Falling back to duration from track data:", currentTrack.duration, "seconds")
            setDuration(currentTrack.duration)
          }
        }
      } catch (error) {
        console.error("❌ [MiniPlayer] Failed to fetch track duration:", error)
        // Will try again via playback state polling
      }
    }

    // Reset duration when track changes - smooth transition
    setDuration(0)
    setCurrentTime(0)
    // Fetch duration immediately
    fetchTrackDuration()
  }, [currentTrack?.id, currentTrack?.spotifyId, currentTrack?.isSpotify, accessToken, setDuration, setCurrentTime])

  // Update duration from track metadata when track changes (for non-Spotify tracks)
  useEffect(() => {
    if (currentTrack?.duration && currentTrack.duration > 0 && !isNaN(currentTrack.duration) && !currentTrack.isSpotify) {
      setDuration(currentTrack.duration)
    }
  }, [currentTrack?.id, currentTrack?.duration, currentTrack?.isSpotify, setDuration])

  // Handle HTML5 audio playback
  useEffect(() => {
    if (!currentTrack) {
      // Clean up audio if track is null
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
        audioRef.current = null
      }
      return
    }
    
    // For Spotify tracks with SDK ready and valid Spotify ID, don't use HTML5 audio - use Spotify SDK instead
    // But if we have a preview_url and no valid Spotify ID (or SDK not ready), use preview URL
    const hasValidSpotifyId = currentTrack.spotifyId && isValidSpotifyId(currentTrack.spotifyId)
    
    // Only skip HTML5 audio if we have a valid Spotify ID AND SDK is ready AND isSpotify is true
    // Otherwise, use preview URL if available
    if (currentTrack.isSpotify && hasValidSpotifyId) {
      // Spotify track with valid ID - don't use HTML5 audio (will use SDK or REST API)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
        audioRef.current = null
      }
      return
    }

    // Handle preview URLs for non-Spotify tracks or Spotify tracks without valid IDs
    if (!currentTrack.preview_url) {
      // No preview URL available - stop any existing audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
        audioRef.current = null
      }
      return
    }
    

    // Always create a new audio element when track changes
    // This ensures we're playing the correct track
    const trackKey = currentTrack.id || currentTrack.preview_url || ''
    const needsNewAudio = !audioRef.current || 
                          (audioRef.current.src && !audioRef.current.src.includes(trackKey))

    if (needsNewAudio) {
      // Clean up old audio if it exists
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.removeEventListener("timeupdate", () => {})
        audioRef.current.removeEventListener("loadedmetadata", () => {})
        audioRef.current.removeEventListener("ended", () => {})
        audioRef.current.src = ""
        audioRef.current = null
      }

      // Create new audio element
      const audio = new Audio(currentTrack.preview_url)
      // Ensure volume is within valid range (0-1) and set it
      const clampedVolume = Math.max(0, Math.min(1, volume))
      audio.volume = clampedVolume
      console.log("🔊 [MiniPlayer] Created audio element with volume:", clampedVolume, `(${Math.round(clampedVolume * 100)}%)`)

      const handleTimeUpdate = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime)
        }
      }

      const handleLoadedMetadata = () => {
        if (audioRef.current && audioRef.current.duration > 0 && !isNaN(audioRef.current.duration)) {
          setDuration(audioRef.current.duration)
          console.log("📊 Audio metadata loaded, duration:", audioRef.current.duration, "seconds")
        }
      }

      const handleEnded = () => {
        setIsPlaying(false)
        setCurrentTime(0)
        // Note: We don't clear currentTrack here to keep it visible in the mini player
        // The user can manually clear it or it will be replaced when a new track plays
      }

      audio.addEventListener("timeupdate", handleTimeUpdate)
      audio.addEventListener("loadedmetadata", handleLoadedMetadata)
      audio.addEventListener("ended", handleEnded)

      audioRef.current = audio

      // Only auto-play if isPlaying is true AND we've initialized (not on first mount after page refresh)
      // This prevents auto-playing after page refresh
      if (isPlaying && hasInitializedRef.current) {
        // The track was just set and isPlaying is true, so start playing
        console.log("▶️ [MiniPlayer] Starting audio playback for:", currentTrack.title, "preview URL:", currentTrack.preview_url)
        // Use a small delay to ensure audio element is ready
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().then(() => {
              console.log("✅ [MiniPlayer] Audio playback started successfully")
              setIsPlaying(true) // Ensure playing state is set
            }).catch((error) => {
              console.error("❌ [MiniPlayer] Failed to play audio:", error)
              setIsPlaying(false)
            })
          }
        }, 100)
      } else if (!hasInitializedRef.current) {
        // On initial mount, don't auto-play even if isPlaying is true (it might be from localStorage)
        console.log("⏸️ [MiniPlayer] Initial mount - not auto-playing audio (prevented after page refresh)")
        setIsPlaying(false) // Ensure it's paused
      } else {
        console.log("⏸️ [MiniPlayer] Not auto-playing - isPlaying is false")
      }
    } else if (audioRef.current) {
      // Update volume and playback state for existing audio
      const clampedVolume = Math.max(0, Math.min(1, volume))
      audioRef.current.volume = clampedVolume
      console.log("🔊 [MiniPlayer] Updated existing audio element volume to:", clampedVolume, `(${Math.round(clampedVolume * 100)}%)`)
      if (isPlaying) {
        console.log("▶️ [MiniPlayer] Resuming audio playback for existing audio element")
        audioRef.current.play().then(() => {
          console.log("✅ [MiniPlayer] Audio playback resumed successfully")
        }).catch((error) => {
          console.error("❌ [MiniPlayer] Failed to play audio:", error)
          setIsPlaying(false)
        })
      } else {
        console.log("⏸️ [MiniPlayer] Pausing audio playback")
        audioRef.current.pause()
      }
    }
  }, [currentTrack, isPlaying, volume, setCurrentTime, setDuration, setIsPlaying, spotifyPlayer.isReady, accessToken])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
        audioRef.current = null
      }
    }
  }, [])


  // Get active Spotify device
  const getActiveDevice = useCallback(async (): Promise<string | null> => {
    if (!accessToken) return null
    
    try {
      const response = await fetch("https://api.spotify.com/v1/me/player/devices", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      
      if (!response.ok) return null
      
      const data = await response.json()
      const devices = data.devices || []
      
      // Use helper function to select best device (excludes Echo/Alexa)
      const preferredDeviceId = spotifyPlayer.isReady && spotifyPlayer.deviceId ? spotifyPlayer.deviceId : null
      const selectedDevice = selectBestDevice(devices, preferredDeviceId)
      return selectedDevice?.id || null
    } catch (error) {
      console.error("❌ [MiniPlayer] Error getting devices:", error)
      return null
    }
  }, [accessToken, spotifyPlayer.isReady, spotifyPlayer.deviceId])

  const handlePlayPause = useCallback(async () => {
    console.log("🎵 [MiniPlayer] handlePlayPause called", { 
      hasTrack: !!currentTrack,
      isPlaying,
      isInProgress: isPlayPauseInProgressRef.current
    })
    
    // Prevent duplicate calls
    if (isPlayPauseInProgressRef.current) {
      console.log("⏸️ [MiniPlayer] Already in progress, skipping")
      return
    }
    
    if (!currentTrack) {
      console.warn("⚠️ [MiniPlayer] No track available")
      return
    }
    
    isPlayPauseInProgressRef.current = true
    const previousState = isPlaying
    const newPlayingState = !isPlaying
    
    // Safety timeout: clear the ref after 5 seconds to prevent it from getting stuck
    let timeoutId: NodeJS.Timeout | null = setTimeout(() => {
      if (isPlayPauseInProgressRef.current) {
        console.warn("⚠️ [MiniPlayer] Play/pause ref stuck, clearing it")
        isPlayPauseInProgressRef.current = false
      }
    }, 5000)
    
    // Mark that user performed an action to prevent API from overriding (increase to 2.5s for better sync)
    userActionTimeRef.current = Date.now()
    
    try {
      // Update state IMMEDIATELY for instant UI feedback - this is critical for button responsiveness
      setIsPlaying(newPlayingState)
      console.log("🔄 [MiniPlayer] Setting playback state:", newPlayingState ? "PLAYING" : "PAUSED", {
        trackId: currentTrack.id,
        trackTitle: currentTrack.title,
        previousState,
        newState: newPlayingState
      })
      
      const isSpotifyTrack = currentTrack?.isSpotify || (!!currentTrack?.spotifyId && !!accessToken)
      console.log("🎵 [MiniPlayer] Track type:", { 
        isSpotifyTrack, 
        hasSpotifyId: !!currentTrack?.spotifyId,
        hasAccessToken: !!accessToken,
        isSpotifyFlag: currentTrack?.isSpotify
      })
      
      if (isSpotifyTrack && accessToken) {
        // Spotify track - use REST API
        console.log("🎵 [MiniPlayer] Using Spotify REST API")
        usingRestApiRef.current = true // Mark that we're using REST API
        
        const deviceId = await getActiveDevice()
        console.log("📱 [MiniPlayer] Active device:", deviceId)
        
        if (!deviceId) {
          setIsPlaying(previousState)
          usingRestApiRef.current = false // Clear flag on error
          isPlayPauseInProgressRef.current = false // Clear in-progress flag
          if (timeoutId) clearTimeout(timeoutId)
          console.error("❌ [MiniPlayer] No device available")
          return
        }
        
        if (!newPlayingState) {
          // Pause
          console.log("⏸️ [MiniPlayer] Pausing playback at position:", currentTime)
          // Save current position when pausing so we can preserve it
          if (currentTime > 0) {
            pausedPositionRef.current = currentTime
            // Also update interpolation refs to current position
            lastApiPositionRef.current = currentTime
            lastApiUpdateTimeRef.current = Date.now()
          }
          
          const response = await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          
          console.log("📡 [MiniPlayer] Pause response:", response.status)
          
          if (response.ok || response.status === 204) {
            console.log("✅ [MiniPlayer] Paused successfully at position:", currentTime)
            // State already set to false above
            // Don't reset currentTime - preserve the pause position
          } else if (response.status === 404) {
            console.log("ℹ️ [MiniPlayer] No active playback to pause (404)")
            // Keep state as false (paused) since there's nothing to pause
          } else {
            setIsPlaying(previousState)
            const errorText = await response.text().catch(() => "")
            console.error("❌ [MiniPlayer] Failed to pause:", response.status, errorText)
          }
        } else {
          // Play - check if we should resume or start new
          const spotifyId = currentTrack.spotifyId && isValidSpotifyId(currentTrack.spotifyId)
            ? currentTrack.spotifyId
            : (currentTrack.id && isValidSpotifyId(currentTrack.id) ? currentTrack.id : null)
          
          console.log("▶️ [MiniPlayer] Playing track", { spotifyId, trackId: currentTrack.id })
          
          if (!spotifyId) {
            setIsPlaying(previousState)
            isPlayPauseInProgressRef.current = false // Clear in-progress flag
            if (timeoutId) clearTimeout(timeoutId)
            console.error("❌ [MiniPlayer] No valid Spotify ID", { 
              spotifyId: currentTrack.spotifyId,
              id: currentTrack.id
            })
            return
          }
          
          // Check if this track is already loaded in Spotify player (just paused)
          // If so, we can just resume without sending URIs (which would restart)
          let shouldResume = false
          try {
            const playbackStateResponse = await fetch("https://api.spotify.com/v1/me/player", {
              headers: { Authorization: `Bearer ${accessToken}` },
            })
            
            // Handle 204 No Content (no active playback)
            if (playbackStateResponse.status === 204) {
              console.log("ℹ️ [MiniPlayer] No active playback (204), will start fresh")
              shouldResume = false
            } else if (playbackStateResponse.ok) {
              const playbackState = await playbackStateResponse.json()
              const currentTrackUri = playbackState.item?.uri
              const expectedUri = `spotify:track:${spotifyId}`
              
              // If the same track is loaded (just paused), we can resume
              if (currentTrackUri === expectedUri && !playbackState.is_playing) {
                shouldResume = true
                console.log("▶️ [MiniPlayer] Track already loaded, resuming playback from position:", playbackState.progress_ms)
              } else {
                console.log("ℹ️ [MiniPlayer] Different track or already playing, will start fresh", {
                  currentUri: currentTrackUri,
                  expectedUri,
                  isPlaying: playbackState.is_playing
                })
              }
            }
          } catch (e) {
            // If we can't check playback state, assume we need to start fresh
            console.log("ℹ️ [MiniPlayer] Could not check playback state, will start fresh:", e)
          }
          
          // Only transfer device if we're starting a new track
          if (!shouldResume) {
            // Always transfer playback to our device before playing to ensure it's active
            try {
              console.log("🔄 [MiniPlayer] Ensuring device is active before playing")
              const transferResponse = await fetch(`https://api.spotify.com/v1/me/player`, {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ device_ids: [deviceId], play: false }),
              })
              
              // Wait a bit for the transfer to complete
              await new Promise(resolve => setTimeout(resolve, 500))
              
              // Verify device is now active
              const devicesResponse = await fetch("https://api.spotify.com/v1/me/player/devices", {
                headers: { Authorization: `Bearer ${accessToken}` },
              })
              
              if (devicesResponse.ok) {
                const devicesData = await devicesResponse.json()
                const device = devicesData.devices?.find((d: any) => d.id === deviceId)
                if (device && device.is_active) {
                  console.log("✅ [MiniPlayer] Device is now active:", device.name)
                } else {
                  console.warn("⚠️ [MiniPlayer] Device transfer may not have completed, but continuing anyway")
                }
              }
            } catch (transferError) {
              console.warn("⚠️ [MiniPlayer] Device transfer failed, continuing:", transferError)
            }
          }
          
          // Start playback - only send URIs if starting a new track
          console.log(shouldResume ? "▶️ [MiniPlayer] Resuming playback" : "▶️ [MiniPlayer] Starting new playback")
          const playBody = shouldResume 
            ? {} // Empty body to just resume
            : { uris: [`spotify:track:${spotifyId}`] } // Send URIs to start new track
          
          const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(playBody),
          })
          
          console.log("📡 [MiniPlayer] Play response:", response.status)
          
          if (response.status === 429) {
            setIsPlaying(previousState)
            const retryAfter = response.headers.get("retry-after")
            const backoffMs = retryAfter ? Math.max(parseInt(retryAfter) * 1000, 60000) : 60000
            rateLimitBackoffRef.current = Date.now() + backoffMs
            console.warn("⚠️ [MiniPlayer] Rate limited, backing off for", backoffMs / 1000, "seconds")
            return
          }
          
          if (response.ok || response.status === 204) {
            trackStartTimeRef.current = Date.now()
            autoStartAttemptedRef.current = null
            
            // Only reset currentTime if starting a NEW track, not when resuming the same track
            if (!shouldResume) {
              // New track - reset position
              console.log("🆕 [MiniPlayer] Starting new track - resetting currentTime to 0")
              setCurrentTime(0)
              lastApiUpdateTimeRef.current = Date.now()
              lastApiPositionRef.current = 0
              lastSeekPositionRef.current = null
              pausedPositionRef.current = null // Clear paused position for new track
            } else {
              // Resuming same track - restore from paused position or use currentTime
              const resumePosition = pausedPositionRef.current !== null ? pausedPositionRef.current : currentTime
              console.log("▶️ [MiniPlayer] Resuming track - restoring position:", resumePosition, "(paused at:", pausedPositionRef.current, ", currentTime:", currentTime, ")")
              // Restore position if we have a paused position
              if (pausedPositionRef.current !== null && pausedPositionRef.current > 0) {
                setCurrentTime(pausedPositionRef.current)
              }
              // Update interpolation refs with current position
              lastApiUpdateTimeRef.current = Date.now()
              lastApiPositionRef.current = resumePosition
              lastSeekPositionRef.current = null
              pausedPositionRef.current = null // Clear paused position after resuming
            }
            
            // Ensure state is set to playing (already set above, but ensure it's correct)
            setIsPlaying(true)
            console.log("✅ [MiniPlayer] Playback started successfully")
          } else if (response.status === 403) {
            // Handle 403 - device may not be available or user doesn't have premium
            setIsPlaying(previousState)
            const errorText = await response.text().catch(() => "")
            console.error("❌ [MiniPlayer] 403 Forbidden - device may not be available:", errorText)
            // Try to get fresh device list
            try {
              const freshDevicesResponse = await fetch("https://api.spotify.com/v1/me/player/devices", {
                headers: { Authorization: `Bearer ${accessToken}` },
              })
              if (freshDevicesResponse.ok) {
                const freshDevicesData = await freshDevicesResponse.json()
                const freshDevices = freshDevicesData.devices || []
                const activeDevice = freshDevices.find((d: any) => d.is_active)
                if (activeDevice && activeDevice.id !== deviceId) {
                  // Try with active device
                  const retryResponse = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${activeDevice.id}`, {
                    method: "PUT",
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(playBody),
                  })
                  if (retryResponse.ok || retryResponse.status === 204) {
                    setIsPlaying(true)
                    trackStartTimeRef.current = Date.now()
                    console.log("✅ [MiniPlayer] Playback started with active device")
                  } else {
                    setIsPlaying(previousState)
                  }
                } else {
                  setIsPlaying(previousState)
                }
              } else {
                setIsPlaying(previousState)
              }
            } catch (retryError) {
              console.error("❌ [MiniPlayer] Failed to retry with active device:", retryError)
              setIsPlaying(previousState)
            }
          } else {
            setIsPlaying(previousState)
            const errorText = await response.text().catch(() => "")
            console.error("❌ [MiniPlayer] Failed to play:", response.status, response.statusText, errorText)
          }
        }
      } else {
        // Local track - use togglePlay
        usingRestApiRef.current = false // Not using REST API for local tracks
        console.log("🎵 [MiniPlayer] Using local audio, calling togglePlay")
        togglePlay()
        // togglePlay already handles state updates, so we don't need to set it again
      }
    } catch (error) {
      // Revert to previous state on any error
      setIsPlaying(previousState)
      console.error("❌ [MiniPlayer] Play/pause error:", error)
    } finally {
      // Always clear the in-progress flag, even if there were early returns
      isPlayPauseInProgressRef.current = false
      if (timeoutId) {
        clearTimeout(timeoutId) // Clear the safety timeout
      }
      console.log("✅ [MiniPlayer] Play/pause completed")
    }
  }, [currentTrack, accessToken, spotifyPlayer, isPlaying, setIsPlaying, togglePlay, getActiveDevice])

  // Handle spacebar to play/pause
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle spacebar
      if (event.code !== "Space" && event.key !== " ") {
        return
      }

      // Ignore repeat events (when key is held down)
      if (event.repeat) {
        return
      }

      // Debounce: prevent rapid repeated presses (minimum 200ms between presses)
      const now = Date.now()
      if (now - lastSpacebarPressRef.current < 200) {
        return
      }
      lastSpacebarPressRef.current = now

      // Don't trigger if user is typing in a text input field
      // But allow range inputs (for scrubbing) to use spacebar
      const target = event.target as HTMLElement
      if (target.tagName === "INPUT") {
        const inputType = (target as HTMLInputElement).type
        // Allow range inputs to use spacebar for play/pause
        if (inputType !== "range") {
          return
        }
      } else if (
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return
      }

      // Only handle if there's a track to play
      if (!currentTrack) {
        return
      }

      // Prevent default scrolling behavior
      event.preventDefault()
      event.stopPropagation()

      // Mark user action IMMEDIATELY to prevent API from overriding
      userActionTimeRef.current = Date.now()
      
      // Update state IMMEDIATELY for instant UI feedback
      const newPlayingState = !isPlaying
      setIsPlaying(newPlayingState)
      console.log("⌨️ [MiniPlayer] Spacebar pressed - immediate state update:", { 
        wasPlaying: isPlaying, 
        nowPlaying: newPlayingState,
        trackId: currentTrack.id,
        trackTitle: currentTrack.title
      })

      // Then trigger the full play/pause logic (which will handle API calls)
      handlePlayPause()
    }

    window.addEventListener("keydown", handleKeyDown, true) // Use capture phase for better control

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true)
    }
  }, [currentTrack, handlePlayPause, isPlaying])

  const handleSeek = useCallback(async (newTime: number) => {
    console.log("🎯 [MiniPlayer] handleSeek called:", { 
      newTime, 
      duration, 
      hasTrack: !!currentTrack,
      isSeekInProgress: isSeekInProgressRef.current,
      timeSinceLastSeek: Date.now() - lastSeekTimeRef.current
    })
    
    if (!currentTrack || duration <= 0 || isNaN(duration)) {
      console.warn("⚠️ [MiniPlayer] Cannot seek - invalid track or duration")
      return
    }
    
    const clampedTime = Math.max(0, Math.min(duration, newTime))
    const positionMs = Math.floor(clampedTime * 1000)
    
    console.log("🎯 [MiniPlayer] Seeking to:", { clampedTime, positionMs })
    
    // Mark seek as in progress
    isSeekInProgressRef.current = true
    lastSeekTimeRef.current = Date.now()
    lastSeekPositionRef.current = clampedTime
    
    // Update UI immediately for responsive feedback
    setCurrentTime(clampedTime)
    setSeekPosition(clampedTime) // Also update seekPosition for visual consistency
    seekPositionRef.current = clampedTime // Update ref immediately for reliable tracking
    // Update interpolation references immediately so progress continues smoothly from seek position
    lastApiUpdateTimeRef.current = Date.now()
    lastApiPositionRef.current = clampedTime
    // Reset SDK tracking since we're seeking
    lastSdkPositionRef.current = positionMs
    lastSdkUpdateTimeRef.current = Date.now()
    
    const isSpotifyTrack = currentTrack?.isSpotify || (!!currentTrack?.spotifyId && !!accessToken)
    
    if (isSpotifyTrack && accessToken) {
      // Spotify track - use REST API
      try {
        const deviceId = await getActiveDevice()
        
        if (!deviceId) {
          isSeekInProgressRef.current = false
          return
        }
        
        // Don't transfer device on every seek - it's unnecessary and causes rate limiting
        // Device should already be active from the initial play call
        
        const seekUrl = `https://api.spotify.com/v1/me/player/seek?position_ms=${positionMs}&device_id=${deviceId}`
        
        const response = await fetch(seekUrl, {
          method: "PUT",
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        
        if (response.status === 429) {
          const retryAfter = response.headers.get("retry-after")
          const backoffMs = retryAfter ? Math.max(parseInt(retryAfter) * 1000, 60000) : 60000
          rateLimitBackoffRef.current = Date.now() + backoffMs
          isSeekInProgressRef.current = false
          return
        }
        
        if (response.ok || response.status === 204) {
          // Seek successful - mark completion time to ignore API updates for a bit
          seekCompleteTimeRef.current = Date.now()
          // Update currentTime immediately to the seek position for instant feedback
          setCurrentTime(clampedTime)
          // Update paused position if paused
          if (!isPlaying) {
            pausedPositionRef.current = clampedTime
          }
          console.log("✅ [MiniPlayer] Seek successful to:", clampedTime)
          // Clear seek position after seek completes
          setTimeout(() => {
            setSeekPosition(null)
            seekPositionRef.current = null
            lastSeekPositionRef.current = null
            isSeekInProgressRef.current = false
          }, 500) // Clear after 500ms
        } else if (response.status !== 404) {
          const errorText = await response.text().catch(() => "")
          console.error("❌ [MiniPlayer] Seek failed:", response.status, errorText)
          setSeekPosition(null)
          seekPositionRef.current = null
          isSeekInProgressRef.current = false
        } else {
          // 404 means no active playback - that's okay
          console.log("ℹ️ [MiniPlayer] Seek returned 404 (no active playback)")
          setSeekPosition(null)
          seekPositionRef.current = null
          isSeekInProgressRef.current = false
        }
      } catch (error) {
        console.error("❌ [MiniPlayer] Seek error:", error)
        setSeekPosition(null)
        seekPositionRef.current = null
        isSeekInProgressRef.current = false
      }
    } else if (audioRef.current && audioRef.current.readyState >= 1 && audioRef.current.duration > 0) {
      // Local audio track
      audioRef.current.currentTime = clampedTime
      seekCompleteTimeRef.current = Date.now()
      setTimeout(() => {
        setSeekPosition(null)
        seekPositionRef.current = null
        isSeekInProgressRef.current = false
        lastSeekPositionRef.current = null
      }, 100)
    } else {
      setSeekPosition(null)
      seekPositionRef.current = null
      isSeekInProgressRef.current = false
      lastSeekPositionRef.current = null
    }
  }, [currentTrack, accessToken, duration, setCurrentTime, getActiveDevice])

  // Apply volume immediately to audio element and Spotify player
  const applyVolumeImmediately = useCallback((vol: number) => {
    const clampedVolume = Math.max(0, Math.min(1, vol))
    
    // Update the context volume state (this triggers the useEffect syncs)
    setVolume(clampedVolume)
    
    // Apply to audio element immediately if it exists
    if (audioRef.current) {
      try {
        audioRef.current.volume = clampedVolume
      } catch (error) {
        console.error("❌ [MiniPlayer] Failed to apply volume to audio element:", error)
      }
    }
    
    // Apply to Spotify SDK player immediately if ready
    // Note: Volume control via SDK only works if the SDK has a track loaded
    // When using REST API for playback, the SDK might not have the track loaded
    // In that case, volume changes won't work, but we still try
    const isSpotifyTrack = currentTrack?.isSpotify || (!!currentTrack?.spotifyId && !!accessToken)
    if (isSpotifyTrack && spotifyPlayer.isReady && spotifyPlayer.setVolume) {
      // Only apply if volume actually changed significantly (more than 2%)
      const volumeChanged = Math.abs(clampedVolume - lastSyncedVolumeRef.current) > 0.02
      if (volumeChanged) {
        lastSyncedVolumeRef.current = clampedVolume
        try {
          spotifyPlayer.setVolume(clampedVolume)
          // Silent - no logging to reduce console spam
        } catch (error: any) {
          // Ignore "no list was loaded" errors - expected when using REST API for playback
          if (error?.message && !error.message.includes("no list was loaded") && !error.message.includes("Cannot perform operation")) {
            console.error("❌ [MiniPlayer] Failed to apply volume to Spotify SDK player:", error)
          }
        }
      }
    }
  }, [currentTrack?.isSpotify, currentTrack?.spotifyId, accessToken, spotifyPlayer.isReady, spotifyPlayer, setVolume])

  const handleSkip = async (seconds: number) => {
    // Only skip if duration is valid
    if (duration <= 0 || isNaN(duration)) {
      console.warn("Cannot skip: duration is not available", { duration })
      return
    }
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
    console.log("⏩ [MiniPlayer] Skip:", seconds, "seconds, new time:", newTime)
    try {
      await handleSeek(newTime)
      console.log("✅ [MiniPlayer] Skip completed")
    } catch (error) {
      console.error("❌ [MiniPlayer] Error in skip:", error)
    }
  }

  const formatTime = (seconds: number | undefined | null) => {
    // Handle undefined, null, or invalid values
    if (seconds === undefined || seconds === null || isNaN(seconds) || seconds < 0) {
      return "0:00"
    }
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const formatted = `${mins}:${secs.toString().padStart(2, "0")}`
    return formatted
  }

  // Debug: Log track state
  useEffect(() => {
    if (currentTrack) {
      console.log("✅ [MiniPlayer] Rendering with track:", {
        title: currentTrack.title,
        artist: currentTrack.artist,
        id: currentTrack.id,
        hasImage: !!(currentTrack.album_image_url || currentTrack.cover_art),
      })
    } else {
      console.log("⚠️ [MiniPlayer] No currentTrack - MiniPlayer will not render")
    }
  }, [currentTrack?.id, currentTrack?.title])

  // Debug: Log when component renders with controls
  useEffect(() => {
    if (currentTrack) {
      console.log("🎨 [MiniPlayer] Component rendered with controls", {
        hasTrack: !!currentTrack,
        isPlaying,
        duration,
        isMinimized,
        trackTitle: currentTrack?.title,
        trackId: currentTrack?.id,
        spotifyId: currentTrack?.spotifyId,
      })
    }
  }, [currentTrack?.id, isPlaying, duration, isMinimized, currentTrack?.title, currentTrack?.spotifyId])

  // Always render the container, but only show content if there's a track
  // This ensures the component is mounted and can receive state updates
  if (!currentTrack) {
    return null
  }

  const imageUrl = currentTrack.album_image_url || currentTrack.cover_art

  return (
    <div
      className={cn(
        "fixed bottom-16 left-0 right-0 z-[60] transition-all duration-300",
        "translate-y-0 opacity-100" // Always visible, never hidden
      )}
      style={{ 
        // Ensure it's above navigation (z-50) and visible
        position: 'fixed',
        bottom: '4rem', // 64px - above navigation
      }}
    >
      <div className={cn(
        "bg-black/95 backdrop-blur-lg border-t border-white/10 shadow-2xl transition-all duration-300 ease-in-out",
        isMinimized ? "py-2" : "py-3"
      )}>
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 transition-all duration-300 ease-in-out">
            {/* Album Art */}
            <div className="flex-shrink-0">
              <AlbumArt
                imageUrl={imageUrl}
                alt={`${currentTrack.title || (currentTrack as any).name || "Unknown Track"} by ${currentTrack.artist || (currentTrack as any).artists?.[0]?.name || "Unknown Artist"}`}
                size="sm"
                className={cn(
                  "transition-all duration-300 ease-in-out",
                  isMinimized ? "w-10 h-10" : "w-14 h-14"
                )}
              />
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0 transition-all duration-300 ease-in-out">
              {isMinimized ? (
                // Minimized: Everything on one line
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-white truncate transition-opacity duration-300">
                      {currentTrack.title || (currentTrack as any).name || "Unknown Track"}
                    </h4>
                  </div>

                  {/* Playback Controls */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSkip(-10)}
                      className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                      disabled={(!currentTrack?.preview_url && !currentTrack?.isSpotify) || duration <= 0 || isNaN(duration)}
                    >
                      <SkipBack className="w-3 h-3" />
                    </Button>

                    <button
                      onClick={async (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log("🔘 [MiniPlayer] Play/Pause button clicked (minimized)", { 
                          hasTrack: !!currentTrack,
                          currentPlayingState: isPlaying,
                          disabled: !currentTrack
                        })
                        if (currentTrack) {
                          // Only prevent if already in progress (debounce)
                          if (isPlayPauseInProgressRef.current) {
                            console.log("⏸️ [MiniPlayer] Action already in progress, skipping")
                            return
                          }
                          try {
                            await handlePlayPause()
                          } catch (error) {
                            console.error("❌ [MiniPlayer] Error in play/pause button:", error)
                            // Ensure ref is cleared on error
                            isPlayPauseInProgressRef.current = false
                            // handlePlayPause already handles state reversion in its catch block
                          }
                        } else {
                          console.warn("⚠️ [MiniPlayer] Button clicked but no track")
                        }
                      }}
                      disabled={!currentTrack}
                      type="button"
                      className={cn(
                        "h-7 w-7 p-0 rounded-full border flex items-center justify-center transition-all duration-200",
                        "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                        isPlaying 
                          ? "bg-cyan-500/30 hover:bg-cyan-500/40 border-cyan-500/70" 
                          : "bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/50"
                      )}
                      aria-label={isPlaying ? "Pause" : "Play"}
                      key={`play-pause-minimized-${isPlaying}`}
                      data-playing={isPlaying}
                    >
                      {isPlaying ? (
                        <Pause className="w-3 h-3 text-white" />
                      ) : (
                        <Play className="w-3 h-3 ml-0.5 text-white" />
                      )}
                    </button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSkip(10)}
                      className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                      disabled={(!currentTrack?.preview_url && !currentTrack?.isSpotify) || duration <= 0 || isNaN(duration)}
                    >
                      <SkipForward className="w-3 h-3" />
                    </Button>

                    {/* Volume Control */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setVolume(volume > 0 ? 0 : 0.8)
                        }}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                        title={volume > 0 ? "Mute" : "Unmute"}
                        type="button"
                      >
                        {volume > 0 ? (
                          <Volume2 className="w-3 h-3" />
                        ) : (
                          <VolumeX className="w-3 h-3" />
                        )}
                      </Button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onMouseDown={() => setIsVolumeDragging(true)}
                        onMouseUp={() => setIsVolumeDragging(false)}
                        onMouseLeave={() => {
                          setIsVolumeHovered(false)
                          setIsVolumeDragging(false)
                        }}
                        onTouchStart={() => setIsVolumeDragging(true)}
                        onTouchEnd={() => setIsVolumeDragging(false)}
                        onMouseEnter={() => setIsVolumeHovered(true)}
                        onChange={(e) => {
                          const newVolume = Number(e.target.value)
                          setVolume(newVolume)
                          // Apply immediately to audio element for instant response
                          if (audioRef.current) {
                            audioRef.current.volume = newVolume
                          }
                          // Apply immediately to Spotify SDK if ready
                          if (spotifyPlayer.isReady && spotifyPlayer.setVolume) {
                            try {
                              spotifyPlayer.setVolume(newVolume)
                            } catch (error) {
                              // Ignore errors
                            }
                          }
                        }}
                        className="w-16 h-1 cursor-pointer volume-slider"
                        data-dragging={isVolumeDragging}
                        style={{
                          WebkitAppearance: 'none',
                          MozAppearance: 'none',
                          appearance: 'none',
                          background: `linear-gradient(to right, 
                            rgb(6, 182, 212) 0%, 
                            rgb(168, 85, 247) ${volume * 100}%, 
                            rgba(255, 255, 255, 0.2) ${volume * 100}%, 
                            rgba(255, 255, 255, 0.2) 100%)`,
                          borderRadius: '9999px',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      />
                    </div>

                    {/* Minimize/Expand Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                // Expanded: Normal layout
                <>
                  <div className="flex items-center justify-between gap-2 transition-all duration-300 ease-in-out">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-white truncate transition-opacity duration-300">
                        {currentTrack.title || (currentTrack as any).name || "Unknown Track"}
                      </h4>
                      <p className="text-xs text-gray-400 truncate transition-opacity duration-300">
                        {currentTrack.artist || (currentTrack as any).artists?.[0]?.name || "Unknown Artist"}
                        {currentTrack.album && ` • ${currentTrack.album}`}
                      </p>
                    </div>

                    {/* Minimize/Expand Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                    >
                      <Minimize2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Progress Bar - Only show when expanded */}
                  <div className="mt-2 mb-2" style={{ minHeight: '24px' }}>
                    <div className="relative w-full h-6 py-1 group cursor-pointer" style={{ minHeight: '24px' }}>
                      {/* Visual progress indicator */}
                      <div 
                        className="absolute inset-0 top-1/2 -translate-y-1/2 h-2.5 bg-white/20 rounded-full overflow-hidden pointer-events-none"
                        style={{ 
                          minWidth: '100%',
                          minHeight: '10px',
                          width: '100%'
                        }}
                      >
                        <div
                          className={`h-full bg-gradient-to-r from-cyan-500 to-purple-500 ${
                            isSeeking ? 'transition-none' : 'transition-all duration-100 ease-linear'
                          }`}
                          style={{ 
                            width: `${(() => {
                              if (!duration || duration <= 0 || isNaN(duration)) return 0
                              const time = seekPositionRef.current ?? seekPosition ?? currentTime ?? 0
                              const clamped = Math.max(0, Math.min(duration, time))
                              const percent = (clamped / duration) * 100
                              return Math.min(100, Math.max(0, isNaN(percent) ? 0 : percent))
                            })()}%`,
                            minWidth: '0%',
                            maxWidth: '100%',
                            display: 'block',
                            height: '100%'
                          }}
                        />
                      </div>
                      {/* Interactive range input */}
                      <input
                        type="range"
                        min="0"
                        max={duration > 0 && !isNaN(duration) ? duration : 1}
                        step="0.1"
                        value={(() => {
                          if (!duration || duration <= 0 || isNaN(duration)) return 0
                          const time = seekPositionRef.current ?? seekPosition ?? currentTime ?? 0
                          return Math.max(0, Math.min(duration, time))
                        })()}
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          if (duration <= 0 || isNaN(duration)) return
                          
                          // Mark that we're starting to seek - this prevents progress updates
                          setIsSeeking(true)
                          isSeekInProgressRef.current = true
                          
                          // Get initial position from click
                          const rect = (e.currentTarget as HTMLInputElement).getBoundingClientRect()
                          const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
                          const initialTime = Math.max(0, Math.min(duration, percent * duration))
                          
                          if (!isNaN(initialTime) && isFinite(initialTime)) {
                            setSeekPosition(initialTime)
                            seekPositionRef.current = initialTime // Set ref immediately for reliable tracking
                          }
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation()
                          if (duration <= 0 || isNaN(duration)) return
                          
                          // Mark that we're starting to seek - this prevents progress updates
                          setIsSeeking(true)
                          isSeekInProgressRef.current = true
                          
                          // Get initial position from touch
                          const rect = (e.currentTarget as HTMLInputElement).getBoundingClientRect()
                          const touch = e.touches[0]
                          const percent = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width))
                          const initialTime = Math.max(0, Math.min(duration, percent * duration))
                          
                          if (!isNaN(initialTime) && isFinite(initialTime)) {
                            setSeekPosition(initialTime)
                            seekPositionRef.current = initialTime // Set ref immediately for reliable tracking
                          }
                        }}
                        onChange={(e) => {
                          // Primary handler - this fires during dragging
                          const newTime = parseFloat(e.target.value)
                          
                          if (isNaN(newTime) || !isFinite(newTime) || duration <= 0 || isNaN(duration)) {
                            return
                          }
                          
                          const clampedTime = Math.max(0, Math.min(duration, newTime))
                          
                          // Update seekPosition immediately for visual feedback
                          // Don't update currentTime here - it will be updated on mouseUp/touchEnd
                          // This prevents conflicts with progress update interval
                          setSeekPosition(clampedTime)
                          seekPositionRef.current = clampedTime // Also update ref for reliable access
                        }}
                        onMouseUp={async (e) => {
                          e.stopPropagation()
                          const target = e.target as HTMLInputElement
                          const finalTime = seekPositionRef.current !== null 
                            ? seekPositionRef.current 
                            : (seekPosition !== null ? seekPosition : parseFloat(target.value))
                          
                          // Update currentTime to final position before calling handleSeek
                          // This ensures the progress bar shows the correct position
                          if (!isNaN(finalTime) && isFinite(finalTime) && duration > 0) {
                            setCurrentTime(finalTime)
                          }
                          
                          setIsSeeking(false)
                          isSeekInProgressRef.current = false
                          
                          // Prevent onClick from firing
                          justHandledMouseUpRef.current = true
                          setTimeout(() => {
                            justHandledMouseUpRef.current = false
                          }, 200)
                          
                          if (duration > 0 && !isNaN(duration) && !isNaN(finalTime) && finalTime >= 0) {
                            await handleSeek(finalTime)
                          }
                          
                          // Clear seek position after seek completes
                          setTimeout(() => {
                            setSeekPosition(null)
                            seekPositionRef.current = null
                          }, 500)
                        }}
                        onTouchEnd={async (e) => {
                          e.stopPropagation()
                          const target = e.target as HTMLInputElement
                          const finalTime = seekPositionRef.current !== null 
                            ? seekPositionRef.current 
                            : (seekPosition !== null ? seekPosition : parseFloat(target.value))
                          
                          // Update currentTime to final position before calling handleSeek
                          // This ensures the progress bar shows the correct position
                          if (!isNaN(finalTime) && isFinite(finalTime) && duration > 0) {
                            setCurrentTime(finalTime)
                          }
                          
                          setIsSeeking(false)
                          isSeekInProgressRef.current = false
                          
                          // Prevent onClick from firing
                          justHandledMouseUpRef.current = true
                          setTimeout(() => {
                            justHandledMouseUpRef.current = false
                          }, 200)
                          
                          if (duration > 0 && !isNaN(duration) && !isNaN(finalTime) && finalTime >= 0) {
                            await handleSeek(finalTime)
                          }
                          
                          // Clear seek position after seek completes
                          setTimeout(() => {
                            setSeekPosition(null)
                            seekPositionRef.current = null
                          }, 500)
                        }}
                        onClick={async (e) => {
                          // Handle direct clicks (not drags)
                          e.stopPropagation()
                          
                          if (justHandledMouseUpRef.current) {
                            return
                          }
                          
                          const target = e.target as HTMLInputElement
                          const clickedTime = parseFloat(target.value)
                          
                          if (!isNaN(clickedTime) && clickedTime >= 0 && duration > 0 && !isNaN(duration)) {
                            setIsSeeking(true)
                            isSeekInProgressRef.current = true
                            setSeekPosition(clickedTime)
                            seekPositionRef.current = clickedTime
                            setCurrentTime(clickedTime)
                            await handleSeek(clickedTime)
                            setIsSeeking(false)
                            isSeekInProgressRef.current = false
                            setTimeout(() => {
                              setSeekPosition(null)
                              seekPositionRef.current = null
                            }, 500)
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.code === "Space" || e.key === " ") {
                            e.preventDefault()
                            e.stopPropagation()
                            // Don't trigger play/pause while seeking
                            if (!isSeeking && !isSeekInProgressRef.current && currentTrack) {
                              handlePlayPause()
                            }
                          }
                        }}
                        disabled={duration <= 0 || isNaN(duration)}
                        className="relative w-full h-full cursor-pointer"
                        style={{ 
                          WebkitAppearance: 'none',
                          MozAppearance: 'none',
                          appearance: 'none',
                          margin: 0,
                          padding: 0,
                          background: 'transparent',
                          cursor: (duration > 0 && !isNaN(duration)) ? 'pointer' : 'not-allowed',
                          opacity: 0,
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          width: '100%',
                          height: '100%',
                          zIndex: 20,
                          pointerEvents: 'auto'
                        }}
                      />
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between mt-2">
                    {/* Time Display - Elapsed time / Total duration */}
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      {(() => {
                        const displayTime = (() => {
                          if (isSeeking && (seekPositionRef.current !== null || seekPosition !== null)) {
                            return seekPositionRef.current ?? seekPosition ?? 0
                          }
                          if (!isPlaying && pausedPositionRef.current !== null) return pausedPositionRef.current
                          return currentTime ?? 0
                        })()
                        return (
                          <>
                            <span className="text-white font-medium" title={`Elapsed time: ${displayTime.toFixed(2)}s`}>
                              {formatTime(displayTime)}
                            </span>
                            <span className="text-gray-500">/</span>
                            <span title={`Total duration: ${(duration ?? 0).toFixed(2)}s`}>
                              {formatTime(duration ?? 0)}
                            </span>
                          </>
                        )
                      })()}
                    </div>

                    {/* Playback Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSkip(-10)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                        disabled={(!currentTrack?.preview_url && !currentTrack?.isSpotify) || duration <= 0 || isNaN(duration)}
                      >
                        <SkipBack className="w-4 h-4" />
                      </Button>

                      <button
                        onClick={async (e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          console.log("🔘 [MiniPlayer] Play/Pause button clicked (expanded)", { 
                            hasTrack: !!currentTrack,
                            currentPlayingState: isPlaying,
                            disabled: !currentTrack
                          })
                          if (currentTrack) {
                            // Only prevent if already in progress (debounce)
                            if (isPlayPauseInProgressRef.current) {
                              console.log("⏸️ [MiniPlayer] Action already in progress, skipping")
                              return
                            }
                            try {
                              await handlePlayPause()
                            } catch (error) {
                              console.error("❌ [MiniPlayer] Error in play/pause button:", error)
                              // Ensure ref is cleared on error
                              isPlayPauseInProgressRef.current = false
                              // handlePlayPause already handles state reversion in its catch block
                            }
                          } else {
                            console.warn("⚠️ [MiniPlayer] Button clicked but no track")
                          }
                        }}
                        disabled={!currentTrack}
                        type="button"
                        className={cn(
                          "h-9 w-9 p-0 rounded-full border-2 flex items-center justify-center transition-all duration-200 relative z-50",
                          "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                          isPlaying 
                            ? "bg-cyan-500/30 hover:bg-cyan-500/40 border-cyan-500/70" 
                            : "bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/50"
                        )}
                        style={{ 
                          pointerEvents: 'auto', 
                          zIndex: 50,
                          position: 'relative'
                        }}
                        aria-label={isPlaying ? "Pause" : "Play"}
                        key={`play-pause-expanded-${isPlaying}`}
                        data-playing={isPlaying}
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4 text-white" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5 text-white" />
                        )}
                      </button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSkip(10)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                        disabled={(!currentTrack?.preview_url && !currentTrack?.isSpotify) || duration <= 0 || isNaN(duration)}
                      >
                        <SkipForward className="w-4 h-4" />
                      </Button>

                      {/* Volume Control - Always visible inline slider */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            const newVolume = volume > 0 ? 0 : 0.8
                            setVolume(newVolume)
                          }}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-white flex-shrink-0"
                          title={volume > 0 ? "Mute" : "Unmute"}
                          type="button"
                        >
                          {volume > 0 ? (
                            <Volume2 className="w-4 h-4" />
                          ) : (
                            <VolumeX className="w-4 h-4" />
                          )}
                        </Button>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onMouseDown={() => setIsVolumeDragging(true)}
                            onMouseUp={() => setIsVolumeDragging(false)}
                            onMouseLeave={() => {
                              setIsVolumeHovered(false)
                              setIsVolumeDragging(false)
                            }}
                            onTouchStart={() => setIsVolumeDragging(true)}
                            onTouchEnd={() => setIsVolumeDragging(false)}
                            onMouseEnter={() => setIsVolumeHovered(true)}
                            onChange={(e) => {
                              const newVolume = Number(e.target.value)
                              setVolume(newVolume)
                              // Apply immediately to audio element for instant response
                              if (audioRef.current) {
                                audioRef.current.volume = newVolume
                              }
                              // Apply immediately to Spotify SDK if ready
                              if (spotifyPlayer.isReady && spotifyPlayer.setVolume) {
                                try {
                                  spotifyPlayer.setVolume(newVolume)
                                } catch (error) {
                                  // Ignore errors
                                }
                              }
                            }}
                            className="w-24 h-1.5 cursor-pointer volume-slider"
                            data-dragging={isVolumeDragging}
                            style={{
                              WebkitAppearance: 'none',
                              MozAppearance: 'none',
                              appearance: 'none',
                              background: `linear-gradient(to right, 
                                rgb(6, 182, 212) 0%, 
                                rgb(168, 85, 247) ${volume * 100}%, 
                                rgba(255, 255, 255, 0.2) ${volume * 100}%, 
                                rgba(255, 255, 255, 0.2) 100%)`,
                              borderRadius: '9999px',
                              outline: 'none',
                              cursor: 'pointer',
                              position: 'relative',
                              zIndex: 10,
                            }}
                          />
                          <span className="text-xs text-gray-400 w-10 text-left flex-shrink-0">
                            {Math.round(volume * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  </>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


