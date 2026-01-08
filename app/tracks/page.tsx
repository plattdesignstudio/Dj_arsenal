"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlbumArt } from "@/components/ui/album-art"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { tracksApi, spotifyPlaylistsApi, spotifyAuthApi, localPlaylistsApi, type Track, type NormalizedSpotifyPlaylist, type LocalPlaylist, type SpotifyPlaylistItem } from "@/lib/api"
import { Music, Plus, Search, Trash2, ListMusic, Loader2, GripVertical, LogIn, Edit2, Copy, X, Play, Pause, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDuration, formatBPM } from "@/lib/utils"
import { ResizablePanel } from "@/components/ui/resizable-panel"
import { useTrackPlayer } from "@/hooks/useTrackPlayer"
import { usePlayer } from "@/contexts/PlayerContext"
import { SpotifyLogin, useSpotifyAuth } from "@/components/spotify/SpotifyLogin"

export default function TracksPage() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [trackToDelete, setTrackToDelete] = useState<Track | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [playlists, setPlaylists] = useState<NormalizedSpotifyPlaylist[]>([])
  const [localPlaylists, setLocalPlaylists] = useState<LocalPlaylist[]>([])
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [loadingLocalPlaylists, setLoadingLocalPlaylists] = useState(false)
  const [draggedTrack, setDraggedTrack] = useState<Track | null>(null)
  const [dragOverPlaylist, setDragOverPlaylist] = useState<string | null>(null)
  const [addingToPlaylist, setAddingToPlaylist] = useState<string | null>(null)
  const [playlistsCache, setPlaylistsCache] = useState<{ data: NormalizedSpotifyPlaylist[], timestamp: number } | null>(null)
  const [createPlaylistDialogOpen, setCreatePlaylistDialogOpen] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState("")
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("")
  const [creatingPlaylist, setCreatingPlaylist] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState<NormalizedSpotifyPlaylist | null>(null)
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyPlaylistItem[]>([])
  const [loadingPlaylistTracks, setLoadingPlaylistTracks] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(0) // Force re-render when playing state changes
  const isLoadingPlaylistsRef = useRef(false)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const rateLimitedUntilRef = useRef<number | null>(null)
  const { toast } = useToast()
  const { accessToken } = useSpotifyAuth()
  
  // Use shared track player hook
  const { playingTrackId, audioPlaying, handlePlayTrack } = useTrackPlayer(tracks)
  
  // Also get global track state to check if playlist tracks are playing
  const { currentTrack: globalTrack, isPlaying: globalIsPlaying } = usePlayer()

  // Reduced logging to prevent console spam - only log significant state changes
  
  // Force re-render when playing state changes to ensure UI updates
  // This ensures the paused state updates immediately when spacebar is pressed
  useEffect(() => {
    // Immediately update to ensure UI reflects state changes
    setForceUpdate(prev => prev + 1)
  }, [globalIsPlaying, globalTrack?.id, globalTrack?.spotifyId, globalTrack?.title, globalTrack?.artist, playingTrackId, audioPlaying])

  useEffect(() => {
    loadTracks()
    loadLocalPlaylists()
    // Load playlists from cache on mount - show immediately
    try {
      const cached = localStorage.getItem("spotify_playlists_cache")
      if (cached) {
        const parsed = JSON.parse(cached)
        const cacheAge = Date.now() - parsed.timestamp
        // Use cache if it's less than 7 days old
        if (cacheAge < 7 * 24 * 60 * 60 * 1000) {
          setPlaylistsCache(parsed)
          setPlaylists(parsed.data)
        }
      }
      
      // Restore rate limit state from localStorage
      const rateLimitUntil = localStorage.getItem("spotify_rate_limit_until")
      if (rateLimitUntil) {
        const until = parseInt(rateLimitUntil, 10)
        if (until > Date.now()) {
          rateLimitedUntilRef.current = until
        } else {
          localStorage.removeItem("spotify_rate_limit_until")
        }
      }
    } catch (e) {
      console.warn("Failed to load playlist cache:", e)
    }
  }, [])

  const loadTracks = async () => {
    setLoading(true)
    try {
      const data = await tracksApi.getAll()
      console.log("📦 [TracksPage] Loaded tracks:", data.length, "tracks")
      // Log tracks with preview URLs
      const tracksWithPreview = data.filter(t => t.preview_url)
      console.log("🎵 [TracksPage] Tracks with preview_url:", tracksWithPreview.length)
      if (tracksWithPreview.length > 0) {
        console.log("🎵 [TracksPage] Sample track with preview:", {
          title: tracksWithPreview[0].title,
          preview_url: tracksWithPreview[0].preview_url,
        })
      }
      setTracks(data)
    } catch (error: any) {
      console.error("Failed to load tracks:", error)
      // Check error type and show appropriate message
      if (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNREFUSED') {
        toast({
          title: "Backend Not Running",
          description: "Start the backend server: cd backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload",
          variant: "destructive",
        })
      } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        toast({
          title: "Request Timeout",
          description: "Backend is taking too long to respond. Check if it's running and try again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to load tracks",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredTracks = tracks.filter(
    (track) =>
      track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Filter playlists based on search query
  const filteredSpotifyPlaylists = playlists.filter(
    (playlist) =>
      playlist.name?.toLowerCase().includes(playlistSearchQuery.toLowerCase())
  )

  const filteredLocalPlaylists = localPlaylists.filter(
    (playlist) =>
      playlist.name?.toLowerCase().includes(playlistSearchQuery.toLowerCase())
  )

  const handleDeleteClick = (track: Track) => {
    setTrackToDelete(track)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!trackToDelete) return

    setDeleting(true)
    try {
      await tracksApi.delete(trackToDelete.id)
      setTracks(tracks.filter((t) => t.id !== trackToDelete.id))
      setDeleteDialogOpen(false)
      setTrackToDelete(null)
      toast({
        title: "Track Removed",
        description: `${trackToDelete.title} has been removed from your library`,
        variant: "default",
      })
    } catch (error: any) {
      console.error("Failed to delete track:", error)
      toast({
        title: "Error",
        description: "Failed to remove track. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setTrackToDelete(null)
  }

  const loadPlaylistTracks = async (playlist: NormalizedSpotifyPlaylist) => {
    setLoadingPlaylistTracks(true)
    setSelectedPlaylist(playlist)
    try {
      const stored = localStorage.getItem("spotify_auth")
      if (!stored) {
        throw new Error("Not authenticated with Spotify")
      }

      const authState = JSON.parse(stored)
      if (!authState.accessToken) {
        throw new Error("No access token")
      }

      const response = await spotifyPlaylistsApi.getPlaylistTracks(
        playlist.id,
        authState.accessToken,
        100 // Load up to 100 tracks
      )
      
      setPlaylistTracks(response.tracks || [])
    } catch (error: any) {
      console.error("Failed to load playlist tracks:", error)
      toast({
        title: "Error",
        description: error?.response?.data?.detail || error?.message || "Failed to load playlist tracks",
        variant: "destructive",
      })
      setSelectedPlaylist(null)
      setPlaylistTracks([])
    } finally {
      setLoadingPlaylistTracks(false)
    }
  }

  const handlePlaylistClick = (playlist: NormalizedSpotifyPlaylist) => {
    loadPlaylistTracks(playlist)
  }

  const handleBackToLibrary = () => {
    setSelectedPlaylist(null)
    setPlaylistTracks([])
  }

  const loadLocalPlaylists = async () => {
    setLoadingLocalPlaylists(true)
    try {
      const data = await localPlaylistsApi.getAll()
      setLocalPlaylists(data)
    } catch (error: any) {
      console.error("Failed to load local playlists:", error)
      // Don't show error toast - local playlists are optional
    } finally {
      setLoadingLocalPlaylists(false)
    }
  }

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      toast({
        title: "Error",
        description: "Playlist name is required",
        variant: "destructive",
      })
      return
    }

    setCreatingPlaylist(true)
    try {
      const playlist = await localPlaylistsApi.create({
        name: newPlaylistName.trim(),
        description: newPlaylistDescription.trim() || undefined,
      })
      setLocalPlaylists([...localPlaylists, playlist])
      setCreatePlaylistDialogOpen(false)
      setNewPlaylistName("")
      setNewPlaylistDescription("")
      toast({
        title: "Playlist Created",
        description: `${playlist.name} has been created`,
        variant: "default",
      })
    } catch (error: any) {
      console.error("Failed to create playlist:", error)
      toast({
        title: "Error",
        description: error?.response?.data?.detail || error?.message || "Failed to create playlist",
        variant: "destructive",
      })
    } finally {
      setCreatingPlaylist(false)
    }
  }

  const loadPlaylists = useCallback(async (retryCount = 0) => {
    // Prevent multiple simultaneous requests
    if (isLoadingPlaylistsRef.current && retryCount === 0) {
      return
    }
    
    // Check if we're rate limited - don't make API calls for 2 minutes after a 429
    if (rateLimitedUntilRef.current && Date.now() < rateLimitedUntilRef.current) {
      // Use cache if available
      if (playlistsCache) {
        setPlaylists(playlistsCache.data)
      }
      setLoadingPlaylists(false)
      isLoadingPlaylistsRef.current = false
      
      // Schedule automatic retry when rate limit expires
      const waitTime = rateLimitedUntilRef.current - Date.now()
      if (retryCount === 0) {
        setTimeout(() => {
          // Auto-retry after rate limit expires
          loadPlaylists(0).catch(() => {
            // Silently handle errors
          })
        }, waitTime + 1000) // Add 1 second buffer
      }
      return
    }
    
    // Clear rate limit if it's expired
    if (rateLimitedUntilRef.current && Date.now() >= rateLimitedUntilRef.current) {
      rateLimitedUntilRef.current = null
    }
    
    // Clear any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    
    isLoadingPlaylistsRef.current = true
    setLoadingPlaylists(true)
    try {
      const stored = localStorage.getItem("spotify_auth")
      if (!stored) {
        // Try to use cached playlists if available (30 minute cache)
        if (playlistsCache && Date.now() - playlistsCache.timestamp < 30 * 60 * 1000) {
          setPlaylists(playlistsCache.data)
        } else {
          setPlaylists([])
        }
        setLoadingPlaylists(false)
        isLoadingPlaylistsRef.current = false
        return
      }

      const authState = JSON.parse(stored)
      if (!authState.accessToken) {
        // Try to use cached playlists if available (30 minute cache)
        if (playlistsCache && Date.now() - playlistsCache.timestamp < 30 * 60 * 1000) {
          setPlaylists(playlistsCache.data)
        } else {
          setPlaylists([])
        }
        setLoadingPlaylists(false)
        isLoadingPlaylistsRef.current = false
        return
      }

      // Check cache first - use it if available (up to 7 days old)
      const cacheAge = playlistsCache ? Date.now() - playlistsCache.timestamp : Infinity
      if (playlistsCache && cacheAge < 7 * 24 * 60 * 60 * 1000) {
        // Show cached data immediately (already shown from mount)
        // Continue to refresh in background if cache is older than 15 minutes
        if (cacheAge < 15 * 60 * 1000) {
          // Cache is very fresh, no need to refresh
          setLoadingPlaylists(false)
          isLoadingPlaylistsRef.current = false
          return
        }
        // Cache is older than 15 minutes, refresh in background
        // Don't return - continue to fetch fresh data
      }

      // Use Promise.race to add a timeout wrapper
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Playlist loading timeout')), 60000) // 60 second timeout
      })

      const playlistsPromise = spotifyPlaylistsApi.getUserPlaylistsNormalized(
        authState.accessToken,
        authState.refreshToken
      )

      const playlistsData = await Promise.race([playlistsPromise, timeoutPromise]) as NormalizedSpotifyPlaylist[]
      
      // Deduplicate playlists by ID to prevent duplicate key errors
      const uniquePlaylists = playlistsData.filter((playlist, index, self) =>
        index === self.findIndex((p) => p.id === playlist.id)
      )
      
      // Cache the playlists in state and localStorage
      const cacheData = { data: uniquePlaylists, timestamp: Date.now() }
      setPlaylistsCache(cacheData)
      setPlaylists(uniquePlaylists)
      try {
        localStorage.setItem("spotify_playlists_cache", JSON.stringify(cacheData))
      } catch (e) {
        // Ignore localStorage errors
      }
    } catch (error: any) {
      // Handle 429 (Too Many Requests) - use cache and schedule auto-retry
      if (error?.response?.status === 429) {
        // Don't log 429 errors - they're expected when rate limited
        // Get retry-after from header if available, otherwise use 2 minutes
        const retryAfterHeader = error?.response?.headers?.['retry-after'] || 
                                 error?.response?.headers?.['Retry-After'] ||
                                 error?.response?.data?.retry_after
        const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 120
        const rateLimitUntil = Date.now() + (retryAfterSeconds * 1000)
        rateLimitedUntilRef.current = rateLimitUntil
        
        // Store rate limit info in localStorage for persistence across page reloads
        try {
          localStorage.setItem("spotify_rate_limit_until", rateLimitUntil.toString())
        } catch (e) {
          // Ignore localStorage errors
        }
        
        // Use cached playlists if available (even if old, up to 7 days)
        if (playlistsCache && Date.now() - playlistsCache.timestamp < 7 * 24 * 60 * 60 * 1000) {
          setPlaylists(playlistsCache.data)
        } else {
          // If no cache, keep existing playlists
          setPlaylists(prev => prev.length > 0 ? prev : [])
        }
        
        // Don't log 429 errors - they're expected when rate limited
        console.warn(`Spotify rate limited. Retry after ${retryAfterSeconds} seconds.`)
        
        // Schedule automatic retry when rate limit expires (only once)
        if (retryCount === 0) {
          setTimeout(() => {
            rateLimitedUntilRef.current = null
            try {
              localStorage.removeItem("spotify_rate_limit_until")
            } catch (e) {
              // Ignore
            }
            loadPlaylists(0).catch(() => {
              // Silently handle errors
            })
          }, (retryAfterSeconds * 1000) + 1000) // Add 1 second buffer
        }
      } else {
        // Try to use cached playlists on other errors (up to 1 hour old)
        if (playlistsCache && Date.now() - playlistsCache.timestamp < 60 * 60 * 1000) {
          setPlaylists(playlistsCache.data)
        } else {
          setPlaylists([])
        }
        
        // Don't show error toast for timeout - just silently fail
        // Playlists are optional, tracks should still load
        if (error?.response?.status === 401) {
          toast({
            title: "Spotify Authentication Required",
            description: "Please log in to Spotify to view your playlists",
            variant: "destructive",
          })
        } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
          // Timeout - silently fail, playlists are optional
          console.warn("Playlist loading timed out - continuing without playlists")
        } else if (error?.message !== 'Playlist loading timeout') {
          // Only show other errors, not our timeout or 429
          console.warn("Could not load playlists:", error?.message || "Unknown error")
        } else {
          // Log other non-429 errors
          console.error("Failed to load playlists:", error)
        }
      }
    } finally {
      setLoadingPlaylists(false)
      isLoadingPlaylistsRef.current = false
    }
  }, [playlistsCache, toast])
  
  // Auto-load playlists when authenticated and cache is old
  useEffect(() => {
    const stored = localStorage.getItem("spotify_auth")
    if (!stored) return
    
    try {
      const parsed = JSON.parse(stored)
      if (!parsed.accessToken) return
    } catch {
      return
    }
    
    // Check cache age
    const cached = localStorage.getItem("spotify_playlists_cache")
    let shouldLoad = true
    
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        const cacheAge = Date.now() - parsed.timestamp
        // Only load if cache is older than 15 minutes (more frequent updates)
        if (cacheAge < 15 * 60 * 1000) {
          shouldLoad = false
        }
      } catch {
        // If cache parse fails, load fresh
      }
    }
    
    // Load immediately if needed (no delay) - but check rate limit first
    if (shouldLoad) {
      // Check if we're currently rate limited
      if (rateLimitedUntilRef.current && Date.now() < rateLimitedUntilRef.current) {
        // Rate limited - don't make request, use cache if available
        if (playlistsCache) {
          setPlaylists(playlistsCache.data)
        }
        return
      }
      
      // Also check localStorage for rate limit (in case ref wasn't set)
      try {
        const rateLimitUntil = localStorage.getItem("spotify_rate_limit_until")
        if (rateLimitUntil) {
          const until = parseInt(rateLimitUntil, 10)
          if (until > Date.now()) {
            rateLimitedUntilRef.current = until
            if (playlistsCache) {
              setPlaylists(playlistsCache.data)
            }
            return
          } else {
            localStorage.removeItem("spotify_rate_limit_until")
          }
        }
      } catch (e) {
        // Ignore localStorage errors
      }
      
      loadPlaylists().catch(() => {
        // Silently handle errors - cache already shown
      })
    }
  }, [loadPlaylists, playlistsCache])
  
  
  // Listen for Spotify auth changes and reload playlists immediately
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "spotify_auth" && e.newValue) {
        // Check rate limit before reloading
        if (rateLimitedUntilRef.current && Date.now() < rateLimitedUntilRef.current) {
          return // Rate limited, don't reload
        }
        // Spotify auth was added/updated, reload playlists immediately
        loadPlaylists().catch(() => {
          // Silently handle errors
        })
      }
    }
    
    window.addEventListener("storage", handleStorageChange)
    
    // Also check for auth in current window (for same-tab redirects) - check frequently
    const checkAuth = setInterval(() => {
      // Check rate limit first
      if (rateLimitedUntilRef.current && Date.now() < rateLimitedUntilRef.current) {
        return // Rate limited, skip check
      }
      
      const stored = localStorage.getItem("spotify_auth")
      if (stored && playlists.length === 0 && !loadingPlaylists) {
        try {
          const parsed = JSON.parse(stored)
          if (parsed.accessToken) {
            loadPlaylists().catch(() => {
              // Silently handle errors
            })
            clearInterval(checkAuth)
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }, 300) // Check every 300ms for faster response
    
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(checkAuth)
    }
  }, [playlists.length, loadingPlaylists, loadPlaylists])
  

  const isSpotifyTrack = (track: Track): boolean => {
    // Check if track has Spotify indicators
    // Spotify track IDs are typically 22 characters, Base62 encoded (alphanumeric)
    // Also check for preview_url, album_image_url, or cover_art from Spotify CDN
    // Exclude local/temp IDs that start with "local-" or "temp-"
    if (track.id && (track.id.startsWith("local-") || track.id.startsWith("temp-"))) {
      return false
    }
    
    // Check for Spotify CDN URLs in cover art or album image
    const hasSpotifyImage = !!(
      track.album_image_url?.includes("i.scdn.co") ||
      track.album_image_url?.includes("spotify") ||
      track.cover_art?.includes("i.scdn.co") ||
      track.cover_art?.includes("spotify")
    )
    
    return !!(
      track.preview_url ||
      hasSpotifyImage ||
      track.album_image_url ||
      (track.id && track.id.length === 22 && /^[a-zA-Z0-9]+$/.test(track.id))
    )
  }

  const getSpotifyTrackUri = (track: Track): string | null => {
    if (!isSpotifyTrack(track)) {
      return null
    }
    // If track ID looks like a Spotify ID, use it
    if (track.id && track.id.length === 22 && /^[a-zA-Z0-9]+$/.test(track.id)) {
      return `spotify:track:${track.id}`
    }
    return null
  }

  const handleDragStart = (e: React.DragEvent, track: Track) => {
    // Allow dragging any track (not just Spotify tracks) for local playlists
    setDraggedTrack(track)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", track.id)
    e.dataTransfer.setData("application/json", JSON.stringify({ trackId: track.id, title: track.title }))
    
    // Set drag image to a custom element for better visual feedback
    const dragImage = document.createElement("div")
    dragImage.innerHTML = `
      <div style="background: rgba(0,0,0,0.8); color: white; padding: 8px 12px; border-radius: 8px; border: 2px solid #00ffff; font-size: 12px; max-width: 200px;">
        ${track.title}
      </div>
    `
    dragImage.style.position = "absolute"
    dragImage.style.top = "-1000px"
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 0, 0)
    setTimeout(() => document.body.removeChild(dragImage), 0)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedTrack(null)
    setDragOverPlaylist(null)
    // Reset any visual states
    const target = e.currentTarget as HTMLElement
    if (target) {
      target.style.opacity = "1"
    }
  }

  const handleDragOver = (e: React.DragEvent, playlistId: string) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = "move"
    setDragOverPlaylist(playlistId)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're actually leaving the playlist element
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverPlaylist(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, playlistId: string, isLocal: boolean = false) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverPlaylist(null)

    // Try to get track from draggedTrack state first, then from dataTransfer
    let trackToAdd = draggedTrack
    if (!trackToAdd) {
      try {
        const data = e.dataTransfer.getData("application/json")
        if (data) {
          const parsed = JSON.parse(data)
          trackToAdd = tracks.find(t => t.id === parsed.trackId) || null
        }
      } catch (err) {
        console.warn("Could not parse drag data:", err)
      }
    }

    if (!trackToAdd) {
      toast({
        title: "Error",
        description: "Could not identify track to add",
        variant: "destructive",
      })
      return
    }

    // Handle local playlists
    if (isLocal) {
      try {
        setAddingToPlaylist(playlistId)
        await localPlaylistsApi.addTracks(playlistId, {
          trackIds: [trackToAdd.id]
        })

        // Reload local playlists to update track count
        await loadLocalPlaylists()

        const playlist = localPlaylists.find((p) => p.id === playlistId)
        toast({
          title: "Track Added",
          description: `${trackToAdd.title} has been added to ${playlist?.name || "playlist"}`,
          variant: "default",
        })
      } catch (error: any) {
        console.error("Failed to add track to local playlist:", error)
        toast({
          title: "Error",
          description: error?.response?.data?.detail || error?.message || "Failed to add track to playlist. Please try again.",
          variant: "destructive",
        })
      } finally {
        setAddingToPlaylist(null)
        setDraggedTrack(null)
      }
      return
    }

    // Handle Spotify playlists (existing logic)
    const spotifyUri = getSpotifyTrackUri(trackToAdd)
    if (!spotifyUri) {
      toast({
        title: "Cannot Add Track",
        description: "This track is not a Spotify track and cannot be added to Spotify playlists",
        variant: "destructive",
      })
      return
    }

    try {
      setAddingToPlaylist(playlistId)
      const stored = localStorage.getItem("spotify_auth")
      if (!stored) {
        throw new Error("Not authenticated with Spotify")
      }

      const authState = JSON.parse(stored)
      if (!authState.accessToken) {
        throw new Error("No access token")
      }

      await spotifyPlaylistsApi.addTracks(playlistId, authState.accessToken, [spotifyUri])

      const playlist = playlists.find((p) => p.id === playlistId)
      toast({
        title: "Track Added",
        description: `${trackToAdd.title} has been added to ${playlist?.name || "playlist"}`,
        variant: "default",
      })
    } catch (error: any) {
      console.error("Failed to add track to playlist:", error)
      toast({
        title: "Error",
        description: error?.response?.data?.detail || error?.message || "Failed to add track to playlist. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAddingToPlaylist(null)
      setDraggedTrack(null)
    }
  }

  // All track player logic is now in useTrackPlayer hook

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl neon-cyan">Loading tracks...</div>
      </div>
    )
  }

  return (
    <>
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-black">
      {/* Left Sidebar - Resizable Playlists Panel */}
      <ResizablePanel defaultWidth={320} minWidth={250} maxWidth={500} className="h-full flex-shrink-0">
          <div className="h-full bg-black/40 border-r border-white/10 flex flex-col">
            <div className="p-4 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                  <ListMusic className="w-5 h-5 text-cyan-400" />
                  Your Playlists
                </h2>
                <div className="flex items-center gap-2">
                  {(loadingPlaylists || loadingLocalPlaylists) && (
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  )}
                  <Button
                    onClick={() => setCreatePlaylistDialogOpen(true)}
                    size="sm"
                    className="bg-cyan-500 hover:bg-cyan-600 text-white h-7 px-2"
                    title="Create new playlist"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    New
                  </Button>
                </div>
              </div>
              
              {/* Playlist Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search playlists..."
                  value={playlistSearchQuery}
                  onChange={(e) => setPlaylistSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
                {playlistSearchQuery && (
                  <button
                    onClick={() => setPlaylistSearchQuery("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <p className="text-sm text-gray-400">
                Drag tracks here to add them
              </p>
              {playlistsCache && (
                <p className="text-xs text-gray-500 mt-1">
                  {(() => {
                    const age = Date.now() - playlistsCache.timestamp
                    const minutes = Math.floor(age / 60000)
                    if (minutes < 1) return "Just updated"
                    if (minutes < 60) return `Updated ${minutes}m ago`
                    const hours = Math.floor(minutes / 60)
                    return `Updated ${hours}h ago`
                  })()}
                </p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {(loadingPlaylists || loadingLocalPlaylists) && playlists.length === 0 && localPlaylists.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                  <span className="ml-2 text-gray-400">Loading...</span>
                </div>
              ) : filteredSpotifyPlaylists.length === 0 && filteredLocalPlaylists.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  {loadingPlaylists ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-3" />
                      <p className="text-sm text-gray-400 text-center">Loading playlists...</p>
                    </>
                  ) : (() => {
                    const stored = localStorage.getItem("spotify_auth")
                    const hasAuth = stored && (() => {
                      try {
                        const parsed = JSON.parse(stored)
                        return !!parsed.accessToken
                      } catch {
                        return false
                      }
                    })()
                    
                    if (!hasAuth) {
                      return (
                        <>
                          <Music className="w-12 h-12 text-gray-500 mb-4" />
                          <p className="text-sm text-gray-400 text-center mb-2">
                            Connect with Spotify to view your playlists
                          </p>
                          <p className="text-xs text-gray-500 text-center mb-4">
                            Drag and drop tracks to add them to your playlists
                          </p>
                          <Button
                            onClick={() => {
                              window.location.href = spotifyAuthApi.getAuthUrl()
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            <LogIn className="w-4 h-4 mr-2" />
                            Connect with Spotify
                          </Button>
                        </>
                      )
                    } else if (rateLimitedUntilRef.current && Date.now() < rateLimitedUntilRef.current) {
                      return (
                        <>
                          <p className="text-sm text-gray-400 text-center mb-3">
                            No playlists found
                          </p>
                          <p className="text-xs text-yellow-400 text-center">
                            Rate limited. Playlists will load automatically when available.
                          </p>
                        </>
                      )
                    } else {
                      return (
                        <>
                          <p className="text-sm text-gray-400 text-center mb-3">
                            No playlists found
                          </p>
                          <p className="text-xs text-gray-500 text-center">
                            Your playlists will appear here once loaded
                          </p>
                        </>
                      )
                    }
                  })()}
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {/* Local Playlists Section */}
                  {filteredLocalPlaylists.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Local Playlists
                      </div>
                      {filteredLocalPlaylists.map((playlist) => (
                        <div
                          key={`local-${playlist.id}`}
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDragOver(e, playlist.id)
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDragLeave(e)
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDrop(e, playlist.id, true)
                          }}
                          className={`
                            relative flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer
                            ${
                              dragOverPlaylist === playlist.id
                                ? "border-cyan-500 bg-cyan-500/20"
                                : "border-white/10 bg-black/40 hover:border-cyan-500/50 hover:bg-black/60"
                            }
                            ${addingToPlaylist === playlist.id ? "opacity-50" : ""}
                          `}
                        >
                          {addingToPlaylist === playlist.id && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
                              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                            </div>
                          )}
                          {playlist.coverArt ? (
                            <img
                              src={playlist.coverArt}
                              alt={playlist.name}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-900/40 to-pink-900/40 flex items-center justify-center flex-shrink-0">
                              <ListMusic className="w-6 h-6 text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-white truncate">
                              {playlist.name}
                            </h4>
                            <p className="text-xs text-gray-400">{playlist.track_count} tracks</p>
                          </div>
                          {dragOverPlaylist === playlist.id && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-cyan-500/10 rounded-lg">
                              <div className="bg-cyan-500/20 rounded px-2 py-1 border border-cyan-500">
                                <span className="text-xs text-cyan-400 font-medium">Drop here</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}

                  {/* Spotify Playlists Section */}
                  {filteredSpotifyPlaylists.length > 0 && (
                    <>
                      {filteredLocalPlaylists.length > 0 && (
                        <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2">
                          Spotify Playlists
                        </div>
                      )}
                      {filteredSpotifyPlaylists.map((playlist, index) => (
                        <div
                          key={`spotify-${playlist.id}-${index}`}
                          onClick={(e) => {
                            // Only handle click if not dragging
                            if (!draggedTrack) {
                              handlePlaylistClick(playlist)
                            }
                          }}
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDragOver(e, playlist.id)
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDragLeave(e)
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDrop(e, playlist.id, false)
                          }}
                          className={`
                            relative flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer
                            ${
                              dragOverPlaylist === playlist.id
                                ? "border-cyan-500 bg-cyan-500/20"
                                : selectedPlaylist?.id === playlist.id
                                ? "border-cyan-500 bg-cyan-500/30"
                                : "border-white/10 bg-black/40 hover:border-cyan-500/50 hover:bg-black/60"
                            }
                            ${addingToPlaylist === playlist.id ? "opacity-50" : ""}
                          `}
                        >
                          {addingToPlaylist === playlist.id && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
                              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                            </div>
                          )}
                          {playlist.imageUrl ? (
                            <img
                              src={playlist.imageUrl}
                              alt={playlist.name}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-900/40 to-emerald-900/40 flex items-center justify-center flex-shrink-0">
                              <ListMusic className="w-6 h-6 text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-white truncate">
                              {playlist.name}
                            </h4>
                            <p className="text-xs text-gray-400">{playlist.tracksTotal} tracks</p>
                          </div>
                          {dragOverPlaylist === playlist.id && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-cyan-500/10 rounded-lg">
                              <div className="bg-cyan-500/20 rounded px-2 py-1 border border-cyan-500">
                                <span className="text-xs text-cyan-400 font-medium">Drop here</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                  
                  {/* No results message when searching */}
                  {playlistSearchQuery && filteredSpotifyPlaylists.length === 0 && filteredLocalPlaylists.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                      <Search className="w-12 h-12 text-gray-500 mb-4" />
                      <p className="text-sm text-gray-400 text-center mb-2">
                        No playlists found
                      </p>
                      <p className="text-xs text-gray-500 text-center">
                        Try adjusting your search query
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>

      {/* Right Side - Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 pb-32">
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                {selectedPlaylist ? (
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackToLibrary}
                      className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Library
                    </Button>
                    <div>
                      <h1 className="text-4xl font-bold mb-2 neon-cyan">{selectedPlaylist.name}</h1>
                      <p className="text-gray-400">{selectedPlaylist.tracksTotal} tracks</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-4xl font-bold mb-2 neon-cyan">Your Library</h1>
                    <p className="text-gray-400">Manage your track collection</p>
                  </>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <SpotifyLogin />
                {!accessToken && (
                  <p className="text-xs text-gray-500 text-right max-w-[200px]">
                    Sign in to Spotify Premium for full track playback
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Search */}
          {!selectedPlaylist && (
            <Card className="mb-6 bg-black/40 border-white/10">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search tracks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </CardContent>
            </Card>
          )}

      {/* Playlist Tracks List View */}
      {selectedPlaylist ? (
        loadingPlaylistTracks ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <span className="ml-3 text-gray-400">Loading playlist tracks...</span>
          </div>
        ) : playlistTracks.length === 0 ? (
          <Card className="bg-black/40 border-white/10">
            <CardContent className="p-12 text-center">
              <Music className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No tracks found</h3>
              <p className="text-gray-400">This playlist appears to be empty</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2" key={`playlist-tracks-${forceUpdate}`}>
            {playlistTracks.map((item, index) => {
              const track = item.track
              if (!track || item.is_local) return null
              
              // Convert Spotify track to Track format for playback
              // Check if this is a valid Spotify track ID (22 chars, base62)
              const isValidSpotifyId = track.id && track.id.length === 22 && /^[a-zA-Z0-9]+$/.test(track.id) && !track.id.startsWith("local-") && !track.id.startsWith("temp-")
              
              const trackForPlayback: Track & { isSpotify?: boolean; spotifyId?: string } = {
                id: track.id, // Use Spotify ID as the main ID
                title: track.name,
                artist: track.artist || track.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist",
                duration: Math.floor(track.duration_ms / 1000),
                preview_url: track.preview_url,
                album_image_url: track.album_image_url,
                album: track.album,
                created_at: new Date().toISOString(),
                // Add Spotify-specific fields for proper playback
                ...(isValidSpotifyId && {
                  isSpotify: true,
                  spotifyId: track.id,
                }),
              }
              
              // Simplified and more reliable track state detection
              const trackSpotifyId = track.id && track.id.length === 22 && /^[a-zA-Z0-9]+$/.test(track.id) ? track.id : null
              
              // Helper function to check if two IDs match (handles all variations)
              const idsMatch = (id1: string | null | undefined, id2: string | null | undefined): boolean => {
                if (!id1 || !id2) return false
                return id1 === id2
              }
              
              // Check if this track matches the global track by ID
              const matchesGlobalById = globalTrack && (
                idsMatch(globalTrack.id, track.id) ||
                idsMatch(globalTrack.spotifyId, track.id) ||
                idsMatch(globalTrack.id, trackSpotifyId) ||
                idsMatch(globalTrack.spotifyId, trackSpotifyId) ||
                idsMatch(globalTrack.id, trackForPlayback.id) ||
                idsMatch(globalTrack.spotifyId, trackForPlayback.spotifyId)
              )
              
              // Check if this track matches the global track by title/artist
              const matchesGlobalByTitle = globalTrack && trackForPlayback.title && trackForPlayback.artist
                ? globalTrack.title?.toLowerCase().trim() === trackForPlayback.title?.toLowerCase().trim() &&
                  globalTrack.artist?.toLowerCase().trim() === trackForPlayback.artist?.toLowerCase().trim()
                : false
              
              // This is the current track if it matches globally
              const isCurrentTrack = matchesGlobalById || matchesGlobalByTitle
              
              // Check if it matches local playing track
              const matchesLocal = playingTrackId && (
                playingTrackId === track.id ||
                playingTrackId === trackForPlayback.id ||
                playingTrackId === trackForPlayback.spotifyId ||
                playingTrackId === trackSpotifyId
              )
              
              // Track is the current one if it matches globally OR locally
              const isCurrent = isCurrentTrack || matchesLocal
              
              // Use ONLY globalIsPlaying as the single source of truth for play/pause state
              // This ensures perfect sync between tracks page and mini player
              // Track is playing ONLY if it's the global track AND globalIsPlaying is true
              const isPlaying = isCurrentTrack && globalIsPlaying
              
              // Track is paused if it's the current track but NOT playing
              const isPaused = isCurrentTrack && !globalIsPlaying
              
              // For display: use isCurrent for highlighting, isPlaying for button state
              const shouldHighlight = isCurrent
              const isCurrentlyPlaying = isPlaying
              
              // Debug logging only when state changes significantly
              // Removed excessive logging to reduce console noise

              // Use stable key - React will handle updates via props/state changes
              const trackKey = `${track.id}-${index}`
              
              return (
                <div
                  key={trackKey}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    handlePlayTrack(trackForPlayback, e)
                  }}
                  className={`group flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                    shouldHighlight
                      ? isPaused
                        ? "bg-gradient-to-r from-cyan-500/10 via-cyan-500/8 to-cyan-500/10 border-cyan-500/30 shadow-md shadow-cyan-500/10 opacity-75"
                        : "bg-gradient-to-r from-cyan-500/20 via-cyan-500/15 to-cyan-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/20"
                      : "bg-gradient-to-r from-black/40 via-black/30 to-black/40 border-transparent hover:from-black/60 hover:via-black/50 hover:to-black/60 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10"
                  }`}
                >
                  <AlbumArt
                    imageUrl={track.album_image_url}
                    alt={`${track.name} by ${track.artist}`}
                    size="sm"
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`font-semibold truncate transition-colors ${
                        shouldHighlight
                          ? isPaused
                            ? "text-cyan-300"
                            : "text-cyan-400"
                          : "text-white group-hover:text-cyan-400"
                      }`}>
                        {track.name}
                      </div>
                      {isPaused && (
                        <span className="text-xs text-cyan-400/60 font-medium">(Paused)</span>
                      )}
                      {track.album && (
                        <span className="text-xs text-gray-500 hidden group-hover:inline">• {track.album}</span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${
                      shouldHighlight 
                        ? isPaused 
                          ? "text-cyan-200/80" 
                          : "text-cyan-300" 
                        : "text-gray-400"
                    }`}>
                      {track.artist || track.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {track.duration_ms && (
                      <span className="text-sm text-gray-400">
                        {formatDuration(Math.floor(track.duration_ms / 1000))}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 transition-all duration-200 rounded-full ${
                        shouldHighlight
                          ? isCurrentlyPlaying
                            ? "text-cyan-400 hover:text-cyan-300 bg-cyan-500/20 border border-cyan-500/50 breathing"
                            : "text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 border border-cyan-500/30"
                          : "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        console.log("🎵 [TracksPage] Play/pause clicked for track:", {
                          trackId: track.id,
                          trackTitle: trackForPlayback.title,
                          isCurrentlyPlaying,
                          isCurrentTrack: shouldHighlight,
                          globalTrackId: globalTrack?.id,
                          globalSpotifyId: globalTrack?.spotifyId,
                          globalIsPlaying,
                          playingTrackId,
                          audioPlaying,
                        })
                        handlePlayTrack(trackForPlayback, e)
                      }}
                      title={isCurrentlyPlaying ? "Pause" : shouldHighlight ? "Resume" : "Play"}
                      key={`play-pause-${track.id}-${globalIsPlaying}`}
                    >
                      {isCurrentlyPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        <>
      {/* Tracks Grid */}
      {filteredTracks.length === 0 ? (
        <Card className="bg-black/40 border-white/10">
          <CardContent className="p-12 text-center">
            <Music className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No tracks found</h3>
            <p className="text-gray-400">
              {searchQuery
                ? "Try adjusting your search query"
                : "Add tracks from the Trending page to build your library"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTracks.map((track) => {
            // All tracks are draggable now (for local playlists)
            const isSpotify = isSpotifyTrack(track)
            return (
            <Card
              key={track.id}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, track)}
              onDragEnd={(e) => handleDragEnd(e)}
              onDrag={(e) => {
                // Keep track being dragged visible but semi-transparent
                if (draggedTrack?.id === track.id) {
                  e.currentTarget.style.opacity = "0.5"
                }
              }}
              onDoubleClick={(e) => {
                e.stopPropagation()
                // Only play if not dragging
                if (!draggedTrack || draggedTrack.id !== track.id) {
                  handlePlayTrack(track, e)
                }
              }}
              className={`
                group bg-gradient-to-br from-black/60 via-black/40 to-black/60 border-white/10 
                hover:border-cyan-500/50 transition-all duration-300 overflow-hidden shadow-xl 
                hover:shadow-2xl hover:shadow-cyan-500/20 hover:-translate-y-1
                cursor-move
                ${draggedTrack?.id === track.id ? "opacity-50 scale-95" : ""}
              `}
            >
              <CardContent className="p-0">
                {/* Album Art - Large Display with Enhanced Graphics */}
                <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-cyan-900/20 to-purple-900/20">
                  <AlbumArt
                    imageUrl={track.album_image_url || track.cover_art}
                    alt={`${track.title} by ${track.artist}`}
                    size="xl"
                    className="w-full h-full"
                  />
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Play button overlay on hover */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-black/80 backdrop-blur-sm rounded-full p-4 border-2 border-cyan-500/50 hover:bg-cyan-500/20 hover:border-cyan-500 h-auto w-auto pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePlayTrack(track, e)
                      }}
                    >
                      {playingTrackId === (track.id || `${track.title}-${track.artist}`) && audioPlaying ? (
                        <Pause className="w-8 h-8 text-cyan-400" />
                      ) : (
                        <Play className="w-8 h-8 text-cyan-400" />
                      )}
                    </Button>
                  </div>

                  {/* Delete Button - Top Right */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 bg-black/70 backdrop-blur-sm text-gray-300 hover:text-red-400 hover:bg-red-500/20 border border-white/20 hover:border-red-500/50 rounded-full shadow-lg z-10"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteClick(track)
                    }}
                    title="Remove track"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>


                  {/* Spotify Icon - Bottom Right */}
                  {isSpotifyTrack(track) && (
                    <div className="absolute bottom-3 right-3 rounded-full shadow-xl z-30 pointer-events-none">
                      <img
                        src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Icon_RGB_Green.png"
                        alt="Spotify"
                        className="w-6 h-6 rounded-full"
                        onError={(e) => {
                          // Fallback to alternative CDN
                          const target = e.target as HTMLImageElement
                          target.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/1024px-Spotify_logo_without_text.svg.png"
                        }}
                      />
                    </div>
                  )}

                  {/* Track metadata overlay on hover */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 pb-12 bg-gradient-to-t from-black/90 via-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <div className="flex flex-wrap gap-2 justify-start text-xs">
                      {track.bpm && (
                        <span className="text-cyan-400 bg-cyan-500/20 px-2 py-1 rounded-full border border-cyan-500/30">
                          {formatBPM(track.bpm)} BPM
                        </span>
                      )}
                      {track.key && (
                        <span className="text-purple-400 bg-purple-500/20 px-2 py-1 rounded-full border border-purple-500/30">
                          {track.key}
                        </span>
                      )}
                      {track.genre && (
                        <span className="text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded-full border border-yellow-500/30">
                          {track.genre}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Track Info with Enhanced Styling */}
                <div className="p-4 bg-gradient-to-b from-black/40 to-black/60">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-white truncate text-lg group-hover:text-cyan-400 transition-colors">
                          {track.title}
                        </h3>
                        <GripVertical className="w-4 h-4 text-cyan-400/60 flex-shrink-0" aria-label="Drag to add to playlist" />
                      </div>
                      <p className="text-sm text-gray-300 truncate mb-3">{track.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {track.duration && (
                        <span className="text-gray-400 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                          </svg>
                          {formatDuration(track.duration)}
                        </span>
                      )}
                    </div>
                    {track.preview_url && (
                      <span className="text-green-400 bg-green-500/20 px-2 py-1 rounded-full border border-green-500/30 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                        Preview
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            )
          })}
        </div>
      )}
        </>
      )}

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove Track from Library?</DialogTitle>
                <DialogDescription>
                  Are you sure you want to remove <strong>{trackToDelete?.title}</strong> by{" "}
                  <strong>{trackToDelete?.artist}</strong> from your library? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleDeleteCancel}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                >
                  {deleting ? "Removing..." : "Remove Track"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Create Playlist Dialog */}
          <Dialog open={createPlaylistDialogOpen} onOpenChange={setCreatePlaylistDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Playlist</DialogTitle>
                <DialogDescription>
                  Create a new local playlist to organize your tracks
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Playlist Name *
                  </label>
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="My Awesome Playlist"
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Description (optional)
                  </label>
                  <textarea
                    value={newPlaylistDescription}
                    onChange={(e) => setNewPlaylistDescription(e.target.value)}
                    placeholder="Add a description for your playlist..."
                    rows={3}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreatePlaylistDialogOpen(false)
                    setNewPlaylistName("")
                    setNewPlaylistDescription("")
                  }}
                  disabled={creatingPlaylist}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePlaylist}
                  disabled={creatingPlaylist || !newPlaylistName.trim()}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  {creatingPlaylist ? "Creating..." : "Create Playlist"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
    </>
  )
}
