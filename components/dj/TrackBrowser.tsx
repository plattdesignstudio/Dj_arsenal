"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlbumArt } from "@/components/ui/album-art"
import { Search, Music, Loader2, ArrowLeft, ListMusic } from "lucide-react"
import { tracksApi, trendingApi, spotifyPlaylistsApi, type Track, type NormalizedSpotifyPlaylist } from "@/lib/api"
import { formatDuration, formatBPM } from "@/lib/utils"

interface TrackBrowserProps {
  onTrackSelect: (track: Track, deck: "left" | "right") => void
  selectedDeck?: "left" | "right"
}

export function TrackBrowser({ onTrackSelect, selectedDeck }: TrackBrowserProps) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [trendingTracks, setTrendingTracks] = useState<any[]>([])
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"library" | "trending" | "search" | "featured" | "playlists">("trending")
  const [featuredTracks, setFeaturedTracks] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [playlists, setPlaylists] = useState<NormalizedSpotifyPlaylist[]>([])
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)
  const [playlistTracks, setPlaylistTracks] = useState<any[]>([])
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)

  useEffect(() => {
    if (activeTab === "library") {
      loadLibraryTracks()
    } else if (activeTab === "trending") {
      loadTrendingTracks()
    } else if (activeTab === "featured") {
      loadFeaturedTracks()
    } else if (activeTab === "playlists") {
      loadPlaylists()
    }
    // Search tab doesn't auto-load
  }, [activeTab])

  // Auto-load trending tracks on mount (default tab)
  useEffect(() => {
    loadTrendingTracks()
  }, [])

  const handleSearch = async (query: string) => {
    if (!query.trim()) return
    
    setSearching(true)
    try {
      const data = await trendingApi.searchSpotify(query, 30)
      // Show all tracks - they can be played via Spotify SDK if no preview URL
      const tracks = Array.isArray(data?.tracks) ? data.tracks : []
      setSearchResults(tracks)
    } catch (error: any) {
      console.error("Failed to search tracks:", error)
      setSearchResults([])
      // Check if it's a network error
      if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network')) {
        console.error("Network error - make sure backend is running on http://localhost:8000")
      }
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    if (activeTab === "search" && searchQuery.trim().length > 2) {
      const timeoutId = setTimeout(() => {
        handleSearch(searchQuery)
      }, 500)
      return () => clearTimeout(timeoutId)
    } else if (activeTab === "search" && searchQuery.trim().length === 0) {
      setSearchResults([])
    }
  }, [searchQuery, activeTab])

  const loadLibraryTracks = async () => {
    setLoading(true)
    try {
      const data = await tracksApi.getAll()
      // Show all tracks - they can be played via Spotify SDK if no preview URL
      setTracks(Array.isArray(data) ? data : [])
    } catch (error: any) {
      console.error("Failed to load tracks:", error)
      setTracks([])
      // Check error type
      if (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNREFUSED') {
        console.error("Network error - make sure backend is running on http://localhost:8000")
      } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        console.error("Timeout error - backend is taking too long to respond. Check if it's running.")
      }
    } finally {
      setLoading(false)
    }
  }

  const loadTrendingTracks = async () => {
    setLoading(true)
    try {
      const data = await trendingApi.getSpotify()
      // Show all tracks - they can be played via Spotify SDK if no preview URL
      const tracks = Array.isArray(data?.tracks) ? data.tracks : []
      console.log(`Loaded ${tracks.length} Spotify trending tracks`)
      setTrendingTracks(tracks)
    } catch (error: any) {
      console.error("Failed to load trending tracks:", error)
      setTrendingTracks([])
      // Check error type
      if (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNREFUSED') {
        console.error("Network error - make sure backend is running on http://localhost:8000")
      } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        console.error("Timeout error - backend is taking too long to respond. Check if it's running.")
      }
    } finally {
      setLoading(false)
    }
  }

  const loadFeaturedTracks = async () => {
    setLoading(true)
    try {
      const data = await trendingApi.getFeaturedTracks(30)
      // Show all tracks - they can be played via Spotify SDK if no preview URL
      const tracks = Array.isArray(data?.tracks) ? data.tracks : []
      console.log(`Loaded ${tracks.length} Spotify featured tracks`)
      setFeaturedTracks(tracks)
    } catch (error: any) {
      console.error("Failed to load featured tracks:", error)
      setFeaturedTracks([])
      // Check error type
      if (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNREFUSED') {
        console.error("Network error - make sure backend is running on http://localhost:8000")
      } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        console.error("Timeout error - backend is taking too long to respond. Check if it's running.")
      }
    } finally {
      setLoading(false)
    }
  }

  const loadPlaylists = async () => {
    setLoadingPlaylists(true)
    try {
      // Get Spotify auth from localStorage
      const stored = localStorage.getItem("spotify_auth")
      if (!stored) {
        console.error("No Spotify authentication found. Please log in to Spotify first.")
        setPlaylists([])
        return
      }

      const authState = JSON.parse(stored)
      if (!authState.accessToken) {
        console.error("No access token found. Please log in to Spotify first.")
        setPlaylists([])
        return
      }

      const playlistsData = await spotifyPlaylistsApi.getUserPlaylistsNormalized(
        authState.accessToken,
        authState.refreshToken
      )
      setPlaylists(playlistsData)
      console.log(`Loaded ${playlistsData.length} playlists`)
    } catch (error: any) {
      console.error("Failed to load playlists:", error)
      setPlaylists([])
      if (error?.response?.status === 401) {
        console.error("Spotify token expired. Please log in again.")
      }
    } finally {
      setLoadingPlaylists(false)
    }
  }

  const loadPlaylistTracks = async (playlistId: string) => {
    setLoading(true)
    try {
      const stored = localStorage.getItem("spotify_auth")
      if (!stored) {
        console.error("No Spotify authentication found")
        return
      }

      const authState = JSON.parse(stored)
      if (!authState.accessToken) {
        console.error("No access token found")
        return
      }

      const data = await spotifyPlaylistsApi.getPlaylistTracks(playlistId, authState.accessToken)
      console.log("Playlist tracks API response:", data)
      
      // Extract tracks from items - backend returns items with structure { track: {...} }
      const tracks = Array.isArray(data?.tracks) 
        ? data.tracks
            .map((item: any, index: number) => {
              // The API returns items with structure { track: {...} }
              // Handle null tracks (deleted tracks or episodes)
              if (!item) {
                console.warn(`Skipping null item at index ${index}`)
                return null
              }
              
              // Backend wraps track in item.track
              const track = item.track
              
              // Skip if track is null or doesn't have required fields (e.g., episodes, deleted tracks)
              if (!track || !track.id) {
                console.warn(`Skipping track without ID at index ${index}:`, track)
                return null
              }
              
              // Backend already processes:
              // - track.artist as a joined string
              // - track.album as album name string (or None)
              // - track.album_image_url as URL string
              // - track.artists as array of {name, id}
              
              const processedTrack = {
                id: track.id,
                title: track.name || "Unknown Track",
                name: track.name || "Unknown Track",
                artist: track.artist || (track.artists && Array.isArray(track.artists) 
                  ? track.artists.map((a: any) => a.name || a).join(", ")
                  : "Unknown Artist") || "Unknown Artist",
                album: track.album || undefined, // Backend returns album name as string or None
                album_image_url: track.album_image_url || null,
                duration_ms: track.duration_ms || 0,
                preview_url: track.preview_url || null,
                uri: track.uri || null,
                popularity: track.popularity || null,
              }
              
              return processedTrack
            })
            .filter((t: any) => t !== null && t && t.id) // Filter out null tracks
        : []
      
      console.log(`Processed ${tracks.length} tracks from playlist ${playlistId}`)
      setPlaylistTracks(tracks)
      setSelectedPlaylistId(playlistId)
      console.log(`✅ Loaded ${tracks.length} tracks from playlist ${playlistId}`)
      if (tracks.length === 0 && data?.tracks && data.tracks.length > 0) {
        console.warn("⚠️ API returned items but no tracks were processed. First item:", data.tracks[0])
      }
    } catch (error: any) {
      console.error("❌ Failed to load playlist tracks:", error)
      if (error?.response) {
        console.error("Response status:", error.response.status)
        console.error("Response data:", error.response.data)
      }
      setPlaylistTracks([])
    } finally {
      setLoading(false)
    }
  }

  const filteredLibraryTracks = tracks.filter(
    (track) =>
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredTrendingTracks = trendingTracks.filter(
    (track) =>
      track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleTrackClick = (track: any, preferredDeck?: "left" | "right") => {
    // If no deck is selected, auto-select left deck
    const deck = selectedDeck || preferredDeck || "left"

    // Convert track to Track format - handle both title and name fields
    const trackTitle = track.title || track.name || "Unknown Track"
    const trackArtist = track.artist || "Unknown Artist"
    
    // Determine track ID - only use original ID if it's not a fallback/local ID we created
    // Spotify IDs are Base62 encoded (alphanumeric), typically 22 chars, don't have our prefixes
    let trackId = track.id
    if (!trackId && track.file_path) {
      // Local tracks need an ID but shouldn't be treated as Spotify tracks
      trackId = `local-${Date.now()}`
    } else if (!trackId) {
      // Tracks without IDs need one for the Track interface, but mark as temporary
      trackId = `temp-${Date.now()}`
    }

    const trackData: Track = {
      id: trackId,
      title: trackTitle,
      artist: trackArtist,
      duration: track.duration_ms ? Math.floor(track.duration_ms / 1000) : track.duration || 240,
      bpm: track.bpm,
      key: track.key,
      energy: track.energy,
      genre: track.genre,
      album: track.album,
      album_image_url: track.album_image_url || track.cover_art,
      cover_art: track.album_image_url || track.cover_art,
      preview_url: track.preview_url, // CRITICAL: Preserve preview_url for audio playback
      file_path: track.file_path,
      created_at: new Date().toISOString(),
    }
    onTrackSelect(trackData, deck)
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Track Browser</CardTitle>
          {selectedDeck ? (
            <div className="text-xs text-cyan-500 font-semibold">
              <span className="text-green-500">●</span> Loading to <span className="text-cyan-400">{selectedDeck}</span> deck
            </div>
          ) : (
            <div className="text-xs text-gray-400">
              Click any track to load (defaults to Deck A)
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-gray-500">
            All tracks include album art from Spotify
          </div>
          {activeTab === "trending" && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={loadTrendingTracks}
              disabled={loading}
              className="text-xs"
              title="Refresh Spotify Top Charts"
            >
              {loading ? "Loading..." : "🔄 Refresh"}
            </Button>
          )}
          {activeTab === "featured" && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={loadFeaturedTracks}
              disabled={loading}
              className="text-xs"
            >
              {loading ? "Loading..." : "Refresh"}
            </Button>
          )}
        </div>
        <div className="flex gap-2 mb-4 flex-wrap">
          <Button
            variant={activeTab === "trending" ? "neon" : "outline"}
            size="sm"
            onClick={() => {
              setActiveTab("trending")
              setSelectedPlaylistId(null)
            }}
            className={activeTab === "trending" ? "bg-cyan-500/20 border-cyan-500/50" : ""}
          >
            🔥 Trending
          </Button>
          <Button
            variant={activeTab === "featured" ? "neon" : "outline"}
            size="sm"
            onClick={() => {
              setActiveTab("featured")
              setSelectedPlaylistId(null)
            }}
          >
            Featured
          </Button>
          <Button
            variant={activeTab === "search" ? "neon" : "outline"}
            size="sm"
            onClick={() => {
              setActiveTab("search")
              setSelectedPlaylistId(null)
            }}
          >
            Search
          </Button>
          <Button
            variant={activeTab === "playlists" ? "neon" : "outline"}
            size="sm"
            onClick={() => {
              setActiveTab("playlists")
              setSelectedPlaylistId(null)
            }}
          >
            <ListMusic className="w-4 h-4 mr-1" />
            Playlists
          </Button>
          <Button
            variant={activeTab === "library" ? "neon" : "outline"}
            size="sm"
            onClick={() => {
              setActiveTab("library")
              setSelectedPlaylistId(null)
            }}
          >
            Library
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={activeTab === "search" ? "Search Spotify for playable tracks..." : "Filter tracks..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && activeTab === "search") {
                handleSearch(searchQuery)
              }
            }}
            className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {(loading || searching || loadingPlaylists) ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mb-2" />
            <div className="text-sm text-gray-400">
              {activeTab === "featured" && "Loading featured Spotify tracks..."}
              {activeTab === "trending" && "Loading Spotify Top Charts..."}
              {activeTab === "search" && "Searching Spotify..."}
              {activeTab === "library" && "Loading your tracks..."}
              {activeTab === "playlists" && (selectedPlaylistId ? "Loading playlist tracks..." : "Loading your playlists...")}
            </div>
          </div>
        ) : activeTab === "playlists" && selectedPlaylistId ? (
          // Show playlist tracks
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedPlaylistId(null)
                setPlaylistTracks([])
              }}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Playlists
            </Button>
            {playlistTracks
              .filter((track) =>
                !searchQuery ||
                (track.title || track.name)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                track.artist?.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((track, index) => {
                const hasPreview = !!track.preview_url
                const isSpotifyTrack = !!track.id
                return (
                  <div
                    key={`playlist-track-${selectedPlaylistId}-${track.id || index}-${track.name || track.title}`}
                    onClick={() => {
                      handleTrackClick(track, selectedDeck)
                    }}
                    className="group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border bg-gradient-to-r from-black/40 via-black/30 to-black/40 hover:from-black/60 hover:via-black/50 hover:to-black/60 cursor-pointer border-transparent hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10"
                  >
                    <AlbumArt
                      imageUrl={track.album_image_url}
                      alt={`${track.title || track.name} by ${track.artist}`}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">
                          {track.title || track.name}
                        </div>
                        {hasPreview && (
                          <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full border border-green-500/30 flex items-center gap-1">
                            <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                            Preview
                          </span>
                        )}
                        {isSpotifyTrack && !hasPreview && (
                          <span className="text-xs text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/30">
                            Full Track
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-300 truncate mb-1">{track.artist}</div>
                      <div className="flex items-center gap-3 text-xs">
                        {track.duration_ms && (
                          <span className="text-gray-500">{formatDuration(Math.floor(track.duration_ms / 1000))}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                )
              })}
            {playlistTracks.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-500">
                No tracks in this playlist
              </div>
            )}
          </div>
        ) : activeTab === "playlists" ? (
          // Show playlists list
          <div className="space-y-2">
            {playlists
              .filter((playlist) =>
                !searchQuery ||
                playlist.name?.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((playlist, index) => (
                <div
                  key={`playlist-${playlist.id || index}`}
                  onClick={() => loadPlaylistTracks(playlist.id)}
                  className="group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border bg-gradient-to-r from-black/40 via-black/30 to-black/40 hover:from-black/60 hover:via-black/50 hover:to-black/60 cursor-pointer border-transparent hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <AlbumArt
                    imageUrl={playlist.imageUrl || undefined}
                    alt={playlist.name}
                    size="sm"
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate group-hover:text-cyan-400 transition-colors mb-1">
                      {playlist.name}
                    </div>
                    <div className="text-sm text-gray-400">
                      {playlist.tracksTotal} tracks
                    </div>
                  </div>
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            {playlists.length === 0 && !loadingPlaylists && (
              <div className="text-center py-12 text-gray-500">
                <div className="space-y-3">
                  <div className="text-base font-medium">No playlists found</div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>• Make sure you're logged in to Spotify</div>
                    <div>• Check that you have playlists in your Spotify account</div>
                    <div>• Verify backend is running: <code className="bg-black/40 px-1 rounded">http://localhost:8000</code></div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadPlaylists}
                    className="mt-4"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {(activeTab === "library" 
              ? filteredLibraryTracks
              : activeTab === "trending"
              ? filteredTrendingTracks
              : activeTab === "featured"
              ? featuredTracks.filter((track) =>
                  !searchQuery || 
                  track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  track.artist?.toLowerCase().includes(searchQuery.toLowerCase())
                )
              : searchResults).map((track, index) => {
              const hasPreview = !!(track.preview_url || track.file_path)
              const isSpotifyTrack = !!track.id && !track.file_path
              return (
                <div
                  key={`${activeTab}-track-${track.id || index}-${track.title || track.name || 'unknown'}`}
                  onClick={() => {
                    // All tracks are playable - preview URL or via Spotify SDK
                    handleTrackClick(track, selectedDeck)
                  }}
                  className="group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border bg-gradient-to-r from-black/40 via-black/30 to-black/40 hover:from-black/60 hover:via-black/50 hover:to-black/60 cursor-pointer border-transparent hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <AlbumArt
                    imageUrl={track.album_image_url || track.cover_art}
                    alt={`${track.title} by ${track.artist}`}
                    size="sm"
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">
                        {track.title}
                      </div>
                      {track.album && (
                        <span className="text-xs text-gray-500 hidden group-hover:inline">• {track.album}</span>
                      )}
                      {hasPreview && (
                        <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full border border-green-500/30 flex items-center gap-1">
                          <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                          Preview
                        </span>
                      )}
                      {isSpotifyTrack && !hasPreview && (
                        <span className="text-xs text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/30">
                          Full Track
                        </span>
                      )}
                      {track.file_path && (
                        <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30">
                          Local
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-300 truncate mb-1">{track.artist}</div>
                    {track.album && (
                      <div className="text-xs text-gray-500 truncate mb-1">Album: {track.album}</div>
                    )}
                    <div className="flex items-center gap-3 text-xs">
                      {track.bpm && (
                        <span className="text-cyan-400 font-mono">{formatBPM(track.bpm)} BPM</span>
                      )}
                      {track.key && (
                        <span className="text-purple-400 font-mono">{track.key}</span>
                      )}
                      <span className="text-gray-500">{formatDuration(track.duration_ms ? Math.floor(track.duration_ms / 1000) : track.duration || 240)}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {!loading && !searching && !loadingPlaylists &&
          (activeTab === "library" 
            ? filteredLibraryTracks.length === 0
            : activeTab === "trending"
            ? filteredTrendingTracks.length === 0
            : activeTab === "featured"
            ? featuredTracks.length === 0
            : activeTab === "playlists"
            ? playlists.length === 0
            : searchResults.length === 0) && (
            <div className="text-center py-12 text-gray-500">
              {activeTab === "search" && searchQuery.trim().length === 0
                ? "Enter a search query (3+ characters) to find playable tracks"
                : activeTab === "playlists" && playlists.length === 0
                ? (
                    <div className="space-y-3">
                      <div className="text-base font-medium">No playlists found</div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>• Make sure you're logged in to Spotify</div>
                        <div>• Check that you have playlists in your Spotify account</div>
                        <div>• Verify backend is running: <code className="bg-black/40 px-1 rounded">http://localhost:8000</code></div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadPlaylists}
                        className="mt-4"
                      >
                        Retry
                      </Button>
                    </div>
                  )
                : activeTab === "trending" && trendingTracks.length === 0
                ? (
                    <div className="space-y-3">
                      <div className="text-base font-medium">No Spotify trending tracks found</div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>• Make sure backend is running: <code className="bg-black/40 px-1 rounded">http://localhost:8000</code></div>
                        <div>• Check Spotify API credentials in <code className="bg-black/40 px-1 rounded">backend/.env</code></div>
                        <div>• Verify backend logs for errors</div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={loadTrendingTracks}
                        className="mt-4"
                      >
                        Retry
                      </Button>
                    </div>
                  )
                : activeTab === "featured" && featuredTracks.length === 0
                ? (
                    <div className="space-y-3">
                      <div className="text-base font-medium">No featured tracks found</div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>• Make sure backend is running: <code className="bg-black/40 px-1 rounded">http://localhost:8000</code></div>
                        <div>• Check Spotify API credentials in <code className="bg-black/40 px-1 rounded">backend/.env</code></div>
                        <div>• Verify backend logs for errors</div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={loadFeaturedTracks}
                        className="mt-4"
                      >
                        Retry
                      </Button>
                    </div>
                  )
                : activeTab === "library" && tracks.length === 0
                ? (
                    <div className="space-y-2">
                      <div>No tracks in library</div>
                      <div className="text-xs text-gray-600">Add tracks from the Trending page or upload your own</div>
                    </div>
                  )
                : "No tracks found"}
            </div>
          )}
      </CardContent>
    </Card>
  )
}


