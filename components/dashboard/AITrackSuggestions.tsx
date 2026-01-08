"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlbumArt } from "@/components/ui/album-art"
import { aiApi, type Track } from "@/lib/api"
import { Sparkles, Music } from "lucide-react"
import { formatBPM, getEnergyColor } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface AITrackSuggestionsProps {
  currentTrackId: string | null
  eventType?: string
  energyLevel?: string
}

export function AITrackSuggestions({ currentTrackId, eventType, energyLevel }: AITrackSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (currentTrackId) {
      loadSuggestions()
    }
  }, [currentTrackId, eventType, energyLevel])

  const loadSuggestions = async () => {
    if (!currentTrackId) return

    setLoading(true)
    try {
      const result = await aiApi.suggestTracks(
        currentTrackId,
        eventType,
        energyLevel,
        "building"
      )
      setSuggestions(result.suggestions || [])
    } catch (error) {
      console.error("Failed to load AI suggestions:", error)
      toast({
        title: "Error",
        description: "Failed to load AI track suggestions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!currentTrackId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span>AI Track Suggestions</span>
          </CardTitle>
          <CardDescription>Select a track to get AI-powered suggestions</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span>AI Track Suggestions</span>
            </CardTitle>
            <CardDescription>AI-powered next track recommendations</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadSuggestions}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <Sparkles className="w-8 h-8 mx-auto mb-2 animate-pulse" />
            <div>AI is analyzing your tracks...</div>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No suggestions available
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((track, idx) => (
              <div
                key={track.id}
                className="p-3 glass-panel rounded-lg hover:border-cyan-500/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <AlbumArt
                    imageUrl={track.album_image_url || track.cover_art}
                    alt={`${track.title} by ${track.artist}`}
                    size="sm"
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-bold text-purple-500">#{idx + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-white truncate">{track.title}</div>
                        <div className="text-sm text-gray-400 truncate">{track.artist}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-xs">
                      {track.bpm && (
                        <span className="text-cyan-500 font-mono">{formatBPM(track.bpm)} BPM</span>
                      )}
                      {track.key && (
                        <span className="text-purple-500 font-mono">{track.key}</span>
                      )}
                      {track.energy !== null && track.energy !== undefined && (
                        <span className={getEnergyColor(track.energy)}>
                          {Math.round(track.energy * 100)}% Energy
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}



