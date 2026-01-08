"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlbumArt } from "@/components/ui/album-art"
import { trendingApi } from "@/lib/api"
import { TrendingUp, Music, ExternalLink, Plus, BarChart3, Sparkles, RefreshCw, Play, Pause } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { tracksApi } from "@/lib/api"
import { SpotifyLogin, useSpotifyAuth } from "@/components/spotify/SpotifyLogin"
import { useTrackPlayer } from "@/hooks/useTrackPlayer"
import { usePlayer } from "@/contexts/PlayerContext"

interface TrendingTrack {
  title: string
  artist: string
  source?: string
  url?: string
  position?: number
  snippet?: string
  album_image_url?: string
  album?: string
  preview_url?: string
  id?: string
}

export default function TrendingPage() {
  const [trendingTracks, setTrendingTracks] = useState<TrendingTrack[]>([])
  const [billboardTracks, setBillboardTracks] = useState<TrendingTrack[]>([])
  const [spotifyTracks, setSpotifyTracks] = useState<TrendingTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"trending" | "billboard" | "spotify">("trending")
  const { toast } = useToast()
  const { accessToken } = useSpotifyAuth()
  
  // Use shared track player hook
  const allTracks = [...trendingTracks, ...billboardTracks, ...spotifyTracks]
  const { playingTrackId, audioPlaying, handlePlayTrack } = useTrackPlayer(allTracks)
  
  // Also check PlayerContext to see if track is playing
  const { currentTrack, isPlaying } = usePlayer()

  useEffect(() => {
    loadTrendingTracks()
  }, [])

  const loadTrendingTracks = async () => {
    setLoading(true)
    try {
      const [trending, billboard, spotify] = await Promise.all([
        trendingApi.getTrending(),
        trendingApi.getBillboard(),
        trendingApi.getSpotify(),
      ])

      setTrendingTracks(trending.tracks || [])
      setBillboardTracks(billboard.tracks || [])
      setSpotifyTracks(spotify.tracks || [])
    } catch (error) {
      console.error("Failed to load trending tracks:", error)
      toast({
        title: "Error",
        description: "Failed to load trending tracks",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddTrack = async (track: TrendingTrack) => {
    try {
      // Create track in database with album art and Spotify metadata
      await tracksApi.create({
        title: track.title,
        artist: track.artist,
        duration: 240, // Default 4 minutes
        genre: "Trending",
        cover_art: track.album_image_url,
        album_image_url: track.album_image_url,
        preview_url: track.preview_url,
        // Store Spotify ID if available - we'll use it for detection
        // Note: The backend will generate a new UUID, but we preserve the Spotify image URL
      })

      toast({
        title: "Success",
        description: `${track.title} added to library`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add track",
        variant: "destructive",
      })
    }
  }

  // handlePlayTrack is now provided by useTrackPlayer hook

  const getCurrentTracks = () => {
    switch (activeTab) {
      case "billboard":
        return billboardTracks
      case "spotify":
        return spotifyTracks
      default:
        return trendingTracks
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <TrendingUp className="w-16 h-16 text-cyan-500 mb-4 animate-pulse" />
        <div className="text-2xl neon-cyan">Loading trending tracks...</div>
      </div>
    )
  }

  return (
    <>
    <div className="min-h-screen bg-black p-6 pb-32">
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold neon-cyan mb-2 flex items-center space-x-3">
              <TrendingUp className="w-10 h-10" />
              <span>Trending Tracks</span>
            </h1>
            <p className="text-gray-400">Discover the latest hottest tracks from charts and streaming</p>
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

      {/* Tabs */}
      <div className="mb-6 flex space-x-4 flex-wrap gap-2">
        <Button
          variant={activeTab === "trending" ? "neon" : "outline"}
          onClick={() => setActiveTab("trending")}
          className="flex items-center gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          <span>Trending</span>
        </Button>
        <Button
          variant={activeTab === "billboard" ? "neon" : "outline"}
          onClick={() => setActiveTab("billboard")}
          className="flex items-center gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          <span>Billboard Hot 100</span>
        </Button>
        <Button
          variant={activeTab === "spotify" ? "neon" : "outline"}
          onClick={() => setActiveTab("spotify")}
          className="flex items-center gap-2"
        >
          <Music className="w-4 h-4" />
          <span>Spotify Top Charts</span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={loadTrendingTracks}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Tracks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {getCurrentTracks().map((track, idx) => (
          <Card key={idx} className="hover:border-cyan-500/50 transition-colors">
            <CardHeader>
              <div className="flex items-start gap-4">
                <AlbumArt
                  imageUrl={track.album_image_url}
                  alt={`${track.title} by ${track.artist}`}
                  size="md"
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  {track.position && (
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      <span className="text-2xl font-bold text-purple-500">
                        #{track.position}
                      </span>
                    </div>
                  )}
                  <CardTitle className="text-lg truncate">{track.title}</CardTitle>
                  <CardDescription className="truncate">{track.artist}</CardDescription>
                  {track.album && (
                    <div className="text-xs text-gray-400 mt-1 truncate">{track.album}</div>
                  )}
                  {track.source && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Music className="w-3 h-3" />
                      <span>{track.source}</span>
                    </div>
                  )}
                  {(track.preview_url || (track.id && accessToken)) && (
                    <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                      <Play className="w-3 h-3" />
                      <span>{track.preview_url ? "Preview Available" : "Full Track (Premium)"}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {track.snippet && (
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{track.snippet}</p>
              )}
              <div className="flex space-x-2">
                <Button
                  variant="neon"
                  size="sm"
                  onClick={(e) => handlePlayTrack(track, e)}
                  disabled={false}
                  className="flex items-center gap-2 bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/50"
                >
                  {(() => {
                    // Check if this track is currently playing
                    const trackId = track.id || `${track.title}-${track.artist}`
                    const isThisTrackPlaying = 
                      // Check useTrackPlayer state
                      (playingTrackId === trackId && audioPlaying) ||
                      // Check PlayerContext state (more reliable for mini player sync)
                      (currentTrack && (
                        currentTrack.id === trackId ||
                        currentTrack.spotifyId === track.id ||
                        (currentTrack.title === track.title && currentTrack.artist === track.artist)
                      ) && isPlaying)
                    
                    return isThisTrackPlaying ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Play</span>
                      </>
                    )
                  })()}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddTrack(track)
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Library
                </Button>
                {track.url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <a href={track.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {getCurrentTracks().length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No trending tracks found</p>
          <Button variant="outline" onClick={loadTrendingTracks} className="flex items-center gap-2 mx-auto">
            <RefreshCw className="w-4 h-4" />
            <span>Try Refreshing</span>
          </Button>
        </div>
      )}
    </div>
    </>
  )
}


