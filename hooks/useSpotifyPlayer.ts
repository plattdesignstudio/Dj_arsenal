"use client"

import { useEffect, useRef, useState } from "react"
import { useSpotifyAuth } from "@/components/spotify/SpotifyLogin"

declare global {
  interface Window {
    Spotify: any
    onSpotifyWebPlaybackSDKReady: () => void
  }
}

interface SpotifyPlayerState {
  isReady: boolean
  deviceId: string | null
  isPlaying: boolean
  currentTrack: string | null
  position: number
  duration: number
}

export function useSpotifyPlayer() {
  const { accessToken } = useSpotifyAuth()
  const [playerState, setPlayerState] = useState<SpotifyPlayerState>({
    isReady: false,
    deviceId: null,
    isPlaying: false,
    currentTrack: null,
    position: 0,
    duration: 0,
  })
  const playerRef = useRef<any>(null)
  const lastVolumeRef = useRef<number>(0.5) // Track last volume to prevent redundant calls

  useEffect(() => {
    if (!accessToken) {
      // Clean up player if logged out
      if (playerRef.current && typeof playerRef.current.disconnect === "function") {
        try {
          playerRef.current.disconnect()
        } catch (error) {
          console.warn("Error disconnecting Spotify player:", error)
        }
      }
      playerRef.current = null
      setPlayerState({
        isReady: false,
        deviceId: null,
        isPlaying: false,
        currentTrack: null,
        position: 0,
        duration: 0,
      })
      return
    }

    // Load Spotify Web Playback SDK
    // Note: You may see a console warning about "robustness level" - this is from Spotify SDK's
    // internal code (MediaKeySystemAccess) and is harmless. The SDK will use a default robustness level.
    let script: HTMLScriptElement | null = null
    let isMounted = true
    let connectionTimeout: NodeJS.Timeout | null = null
    let connectionRetryCount = 0
    const maxRetries = 3
    let readyReceived = false
    
    const initializePlayer = (token: string, retryCount = 0) => {
      if (!isMounted) return
      
      // Clean up existing player if any
      if (playerRef.current) {
        try {
          if (typeof playerRef.current.disconnect === "function") {
            playerRef.current.disconnect()
          }
        } catch (error) {
          // Ignore disconnect errors - player might already be disconnected
        }
        playerRef.current = null
      }
      
      if (!window.Spotify || !window.Spotify.Player) {
        console.warn("⚠️ [Spotify SDK] Spotify SDK not available")
        return
      }
      
      try {
        console.log(`🎵 [Spotify SDK] Initializing player... (attempt ${retryCount + 1})`)
        const player = new window.Spotify.Player({
          name: "DJ Arsenal",
          getOAuthToken: (cb: (token: string) => void) => {
            cb(token)
          },
          volume: 0.5,
        })
        console.log("🎵 [Spotify SDK] Player instance created, connecting...")
        
        // Set up a timeout for the ready event (30 seconds)
        readyReceived = false
        connectionTimeout = setTimeout(() => {
          if (!readyReceived && isMounted) {
            // This is not a critical error - playback works via REST API even without SDK
            console.log("ℹ️ [Spotify SDK] Connection timeout - ready event not received within 30s. Playback will use REST API (this is normal).")
            if (retryCount < maxRetries) {
              console.log(`🔄 [Spotify SDK] Retrying connection (${retryCount + 1}/${maxRetries})...`)
              setTimeout(() => {
                if (isMounted) {
                  initializePlayer(token, retryCount + 1)
                }
              }, 2000) // Wait 2 seconds before retry
            } else {
              console.log("ℹ️ [Spotify SDK] Max retries reached. Playback will use REST API (this is normal and works fine).")
            }
          }
        }, 30000)

        player.addListener("ready", ({ device_id }: { device_id: string }) => {
          if (!isMounted) return
          readyReceived = true
          if (connectionTimeout) {
            clearTimeout(connectionTimeout)
            connectionTimeout = null
          }
          console.log("✅ [Spotify SDK] Player ready with device ID:", device_id)
          setPlayerState((prev) => ({
            ...prev,
            isReady: true,
            deviceId: device_id,
          }))
          playerRef.current = player
          connectionRetryCount = 0 // Reset retry count on success

          // Don't try to transfer playback here - it's not needed and causes 404s
          // The device is ready and can accept playback commands via the REST API
          // Transfer is only needed if you want to move existing playback to this device
        })

        player.addListener("not_ready", ({ device_id }: { device_id: string }) => {
          if (!isMounted) return
          console.log("⚠️ [Spotify SDK] Device ID has gone offline:", device_id)
          setPlayerState((prev) => ({
            ...prev,
            isReady: false,
          }))
        })

        player.addListener("player_state_changed", (state: any) => {
          if (!isMounted || !state) return

          setPlayerState((prev) => ({
            ...prev,
            isPlaying: !state.paused,
            currentTrack: state.track_window?.current_track?.id || null,
            position: state.position || 0,
            duration: state.duration || 0,
          }))
        })

        // Add error listeners for better debugging
        player.addListener("authentication_error", ({ message }: { message: string }) => {
          console.error("❌ [Spotify SDK] Authentication error:", message)
        })

        player.addListener("account_error", ({ message }: { message: string }) => {
          console.error("❌ [Spotify SDK] Account error:", message)
        })

        player.addListener("playback_error", ({ message }: { message: string }) => {
          // Ignore "no list was loaded" errors - we use REST API for playback, not SDK
          if (message && message.includes("no list was loaded")) {
            // This is expected when using REST API for playback control
            // The SDK doesn't have tracks loaded because we use REST API instead
            return
          }
          // Only log other playback errors
          if (message && !message.includes("Cannot perform operation")) {
            console.error("❌ [Spotify SDK] Playback error:", message)
          }
        })

        player.connect().then(() => {
          console.log("🔌 [Spotify SDK] Connection initiated, waiting for 'ready' event...")
        }).catch((error: any) => {
          console.error("❌ [Spotify SDK] Failed to connect Spotify player:", error)
          if (connectionTimeout) {
            clearTimeout(connectionTimeout)
            connectionTimeout = null
          }
          // Retry connection if we haven't exceeded max retries
          if (retryCount < maxRetries && isMounted) {
            console.log(`🔄 [Spotify SDK] Retrying connection after error (${retryCount + 1}/${maxRetries})...`)
            setTimeout(() => {
              if (isMounted) {
                initializePlayer(token, retryCount + 1)
              }
            }, 2000)
          } else {
            console.log("ℹ️ [Spotify SDK] Note: Playback will still work via REST API even if SDK isn't ready")
          }
        })
      } catch (error) {
        console.error("❌ [Spotify SDK] Error initializing Spotify player:", error)
        if (connectionTimeout) {
          clearTimeout(connectionTimeout)
          connectionTimeout = null
        }
        // Retry on initialization error
        if (retryCount < maxRetries && isMounted) {
          console.log(`🔄 [Spotify SDK] Retrying initialization after error (${retryCount + 1}/${maxRetries})...`)
          setTimeout(() => {
            if (isMounted) {
              initializePlayer(token, retryCount + 1)
            }
          }, 2000)
        }
      }
    }
    
    // Check if SDK is already loaded
    if (window.Spotify && window.Spotify.Player) {
      // SDK already loaded, initialize immediately
      console.log("✅ [Spotify SDK] SDK already loaded, initializing player immediately...")
      initializePlayer(accessToken)
    } else {
      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]')
      if (existingScript) {
        // Script already exists, wait for SDK to be ready (check more frequently)
        console.log("⏳ [Spotify SDK] Script already loading, waiting for SDK...")
        const checkSDK = setInterval(() => {
          if (window.Spotify && window.Spotify.Player) {
            clearInterval(checkSDK)
            if (isMounted) {
              console.log("✅ [Spotify SDK] SDK loaded, initializing player...")
              initializePlayer(accessToken)
            }
          }
        }, 50) // Check every 50ms for faster detection
        
        // Clear interval after 15 seconds if SDK still not loaded (increased from 10s)
        setTimeout(() => {
          clearInterval(checkSDK)
          if (!window.Spotify || !window.Spotify.Player) {
            console.warn("⚠️ [Spotify SDK] SDK failed to load within 15 seconds")
          }
        }, 15000)
      } else {
        // Load SDK script
        console.log("📥 [Spotify SDK] Loading SDK script...")
        script = document.createElement("script")
        script.src = "https://sdk.scdn.co/spotify-player.js"
        script.async = true
        
        // Add error handling for script load failure
        script.onerror = () => {
          console.error("❌ [Spotify SDK] Failed to load SDK script")
        }
        
        const originalCallback = window.onSpotifyWebPlaybackSDKReady
        
        window.onSpotifyWebPlaybackSDKReady = () => {
          console.log("✅ [Spotify SDK] SDK ready callback fired")
          // Call original callback if it existed
          if (originalCallback && typeof originalCallback === "function") {
            originalCallback()
          }
          // Initialize our player
          if (isMounted) {
            initializePlayer(accessToken)
          }
        }
        
        document.body.appendChild(script)
      }
    }

    return () => {
      isMounted = false
      if (connectionTimeout) {
        clearTimeout(connectionTimeout)
        connectionTimeout = null
      }
      if (playerRef.current) {
        try {
          if (typeof playerRef.current.disconnect === "function") {
            playerRef.current.disconnect()
          }
        } catch (error) {
          // Ignore disconnect errors during cleanup
        }
        playerRef.current = null
      }
      // Don't remove the script as it might be used by other components
      // The script will be cleaned up when the page unloads
    }
  }, [accessToken])

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
      console.warn("⚠️ [useSpotifyPlayer] Only Echo/smart speaker devices available, using first available device")
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

  // Helper function to check if device is available and active
  const verifyDeviceAvailability = async (deviceId: string): Promise<boolean> => {
    try {
      const response = await fetch("https://api.spotify.com/v1/me/player/devices", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        const devices = data.devices || []
        
        // Log all available devices for debugging
        const deviceList = devices.map((d: any) => ({
          id: d.id,
          name: d.name,
          type: d.type,
          is_active: d.is_active,
          is_restricted: d.is_restricted,
          volume_percent: d.volume_percent,
        }))
        console.log("📱 Available Spotify Devices:", deviceList)
        console.log(`🔍 Looking for Web Playback SDK device: ${deviceId}`)
        
        const device = devices.find((d: any) => d.id === deviceId)
        
        if (device) {
          console.log(`✅ Device found: ${device.name} (${device.id}) - Active: ${device.is_active}`)
          return device.is_active
        } else {
          console.log(`❌ Web Playback SDK device (${deviceId}) not found in available devices list`)
          console.log(`💡 Available device IDs:`, deviceList.map((d: any) => d.id))
          // Check if there's a "Web Player" or similar device that might be ours
          const webPlayer = devices.find((d: any) => 
            d.type === "Computer" || 
            d.name?.toLowerCase().includes("web") ||
            d.name?.toLowerCase().includes("dj arsenal")
          )
          if (webPlayer) {
            console.log(`⚠️ Found potential Web Player device: ${webPlayer.name} (${webPlayer.id}) - but ID doesn't match SDK device ID`)
          }
          return false
        }
      } else {
        console.warn("⚠️ Failed to fetch devices:", response.status, response.statusText)
        return false
      }
    } catch (error) {
      console.warn("⚠️ Error checking device availability:", error)
      return false
    }
  }

  const playTrack = async (trackId: string) => {
    if (!playerRef.current || !playerState.deviceId || !accessToken) {
      throw new Error("Player not ready - ensure Spotify player is connected")
    }

    // Clean track ID - remove spotify:track: prefix if present
    let cleanTrackId = trackId.trim()
    if (cleanTrackId.startsWith("spotify:track:")) {
      cleanTrackId = cleanTrackId.replace("spotify:track:", "")
    }

    // Find the actual device ID - SDK device ID might not match devices list immediately
    console.log(`🎵 Attempting to play track ${cleanTrackId} on device ${playerState.deviceId}`)
    
    let deviceIdToUse = playerState.deviceId
    
    // Try to find the device in the devices list - look for "DJ Arsenal" device
    try {
      const devicesResponse = await fetch("https://api.spotify.com/v1/me/player/devices", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      
      if (devicesResponse.ok) {
        const data = await devicesResponse.json()
        const devices = data.devices || []
        
        // Use helper function to select best device (excludes Echo/Alexa)
        const selectedDevice = selectBestDevice(devices, playerState.deviceId)
        
        if (selectedDevice) {
          console.log(`✅ Using device: ${selectedDevice.name} (${selectedDevice.id})`)
          deviceIdToUse = selectedDevice.id
        } else {
          // Fallback: use SDK device ID anyway - it might still work
          console.log(`⚠️ No suitable device found, using SDK device ID: ${playerState.deviceId}`)
          console.log(`📱 Available devices:`, devices.map((d: any) => ({ id: d.id, name: d.name, type: d.type })))
          deviceIdToUse = playerState.deviceId
        }
      }
    } catch (error) {
      console.warn("⚠️ Could not fetch devices list, using SDK device ID:", error)
      deviceIdToUse = playerState.deviceId
    }
    
    // Now try to play the track using the device ID
    try {
      console.log(`▶️ Sending play request to Spotify API for track ${cleanTrackId} on device ${deviceIdToUse}...`)
      
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceIdToUse}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: [`spotify:track:${cleanTrackId}`],
          }),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "Failed to play track"
        let errorData: any = null
        
        try {
          errorData = JSON.parse(errorText)
          errorMessage = errorData.error?.message || errorMessage
        } catch {
          // Use default message if JSON parse fails
        }

        console.error(`❌ Playback failed (${response.status}):`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          deviceId: deviceIdToUse,
          sdkDeviceId: playerState.deviceId,
          trackId: cleanTrackId,
        })

        if (response.status === 404) {
          // Device not found - provide clear guidance
          throw new Error(
            "Spotify device not ready. Please ensure you have Spotify Premium and try again."
          )
        } else if (response.status === 403) {
          throw new Error("Premium account required for full track playback")
        } else if (response.status === 401) {
          throw new Error("Please sign in to Spotify again")
        } else {
          throw new Error(errorMessage || `Unable to play track (${response.status})`)
        }
      } else {
        console.log(`✅ Playback request successful! Track should now be playing.`)
      }
    } catch (error: any) {
      // Only re-throw - let the caller handle logging
      throw error
    }
  }

  const pause = () => {
    if (playerRef.current && typeof playerRef.current.pause === "function") {
      try {
        // SDK pause may fail if no track is loaded (we use REST API for playback)
        // This is expected and can be ignored
        playerRef.current.pause().catch((error: any) => {
          // Ignore "no list was loaded" errors - expected when using REST API
          if (error?.message && !error.message.includes("no list was loaded") && !error.message.includes("Cannot perform operation")) {
            console.warn("⚠️ [Spotify SDK] Pause error:", error)
          }
        })
      } catch (error: any) {
        // Ignore "no list was loaded" errors
        if (error?.message && !error.message.includes("no list was loaded") && !error.message.includes("Cannot perform operation")) {
          console.warn("⚠️ [Spotify SDK] Pause error:", error)
        }
      }
    }
  }

  const resume = () => {
    if (playerRef.current && typeof playerRef.current.resume === "function") {
      try {
        // SDK resume may fail if no track is loaded (we use REST API for playback)
        // This is expected and can be ignored
        playerRef.current.resume().catch((error: any) => {
          // Ignore "no list was loaded" errors - expected when using REST API
          if (error?.message && !error.message.includes("no list was loaded") && !error.message.includes("Cannot perform operation")) {
            console.warn("⚠️ [Spotify SDK] Resume error:", error)
          }
        })
      } catch (error: any) {
        // Ignore "no list was loaded" errors
        if (error?.message && !error.message.includes("no list was loaded") && !error.message.includes("Cannot perform operation")) {
          console.warn("⚠️ [Spotify SDK] Resume error:", error)
        }
      }
    }
  }

  const togglePlay = () => {
    if (playerRef.current && typeof playerRef.current.togglePlay === "function") {
      try {
        // SDK togglePlay may fail if no track is loaded (we use REST API for playback)
        // This is expected and can be ignored
        playerRef.current.togglePlay().catch((error: any) => {
          // Ignore "no list was loaded" errors - expected when using REST API
          if (error?.message && !error.message.includes("no list was loaded") && !error.message.includes("Cannot perform operation")) {
            console.warn("⚠️ [Spotify SDK] TogglePlay error:", error)
          }
        })
      } catch (error: any) {
        // Ignore "no list was loaded" errors
        if (error?.message && !error.message.includes("no list was loaded") && !error.message.includes("Cannot perform operation")) {
          console.warn("⚠️ [Spotify SDK] TogglePlay error:", error)
        }
      }
    }
  }

  const seek = async (positionMs: number) => {
    if (playerRef.current && typeof playerRef.current.seek === "function") {
      try {
        console.log(`🎯 Seeking Spotify player to ${positionMs}ms (${positionMs / 1000}s)`)
        await playerRef.current.seek(positionMs).catch((error: any) => {
          // Ignore "no list was loaded" errors - expected when using REST API
          if (error?.message && !error.message.includes("no list was loaded") && !error.message.includes("Cannot perform operation")) {
            console.error("❌ Error seeking Spotify player:", error)
          }
        })
        console.log(`✅ Seek successful`)
      } catch (error: any) {
        // Ignore "no list was loaded" errors
        if (error?.message && !error.message.includes("no list was loaded") && !error.message.includes("Cannot perform operation")) {
          console.error("❌ Error seeking Spotify player:", error)
        }
      }
    } else {
      console.warn("⚠️ Cannot seek: player not available or seek method not found")
    }
  }

  const setVolume = (volume: number) => {
    // Ensure volume is within valid range (0-1)
    const clampedVolume = Math.max(0, Math.min(1, volume))
    
    if (!playerRef.current) {
      return
    }
    
    if (typeof playerRef.current.setVolume !== "function") {
      return
    }
    
    // Only set volume if it actually changed significantly (more than 2% to reduce spam)
    // Also check if enough time has passed since last volume change (debounce)
    const volumeChanged = Math.abs(clampedVolume - lastVolumeRef.current) > 0.02
    
    if (!volumeChanged) {
      return // Skip if volume hasn't changed significantly
    }
    
    // Update the last volume reference BEFORE making the call to prevent rapid repeated calls
    lastVolumeRef.current = clampedVolume
    
    try {
      // Call setVolume without any logging to reduce console spam
      playerRef.current.setVolume(clampedVolume).catch((error: any) => {
        // Only log actual errors, not expected "no list was loaded" errors
        if (error?.message && !error.message.includes("no list was loaded") && !error.message.includes("Cannot perform operation")) {
          console.error("❌ [Spotify SDK] Error setting volume:", error)
        }
      })
    } catch (error: any) {
      // Only log actual errors
      if (error?.message && !error.message.includes("no list was loaded") && !error.message.includes("Cannot perform operation")) {
        console.error("❌ [Spotify SDK] Error calling setVolume:", error)
      }
    }
  }

  return {
    ...playerState,
    playTrack,
    pause,
    resume,
    togglePlay,
    seek,
    setVolume,
    player: playerRef.current,
  }
}

