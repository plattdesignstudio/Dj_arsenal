"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { TrackBrowser } from "./TrackBrowser"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2 } from "lucide-react"
import { SpotifyLogin } from "@/components/spotify/SpotifyLogin"
import type { Track } from "@/lib/api"

// Dynamically import TurntableDeck to avoid SSR issues with WaveSurfer
const TurntableDeck = dynamic(
  () => import("./TurntableDeck").then((mod) => ({ default: mod.TurntableDeck })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-black/40 border border-white/10 rounded-lg p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">Loading Deck...</div>
        </div>
      </div>
    ),
  }
)

export function DJTurntable() {
  const [leftTrack, setLeftTrack] = useState<Track | null>(null)
  const [rightTrack, setRightTrack] = useState<Track | null>(null)
  const [masterVolume, setMasterVolume] = useState(1)
  const [crossfader, setCrossfader] = useState(0.5)
  const [selectedDeck, setSelectedDeck] = useState<"left" | "right" | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleTrackSelect = (track: Track, deck: "left" | "right") => {
    if (deck === "left") {
      setLeftTrack(track)
      setSelectedDeck(null)
    } else {
      setRightTrack(track)
      setSelectedDeck(null)
    }
  }

  const handleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 h-screen flex flex-col bg-black text-white overflow-hidden pb-20"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      data-nextjs-scroll-focus-boundary="true"
      suppressHydrationWarning
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold neon-cyan">DJ TURNTABLE</h1>
          <p className="text-sm text-gray-400">Professional DJ mixing interface</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500">
            Connect to Spotify for full track playback & album art
          </div>
          <SpotifyLogin />
          <Button variant="outline" size="sm" onClick={handleFullscreen}>
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
        {/* Top Half: Decks and Controls */}
        <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
          {/* Left Deck */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-cyan-500">DECK A</h2>
              <Button
                variant={selectedDeck === "left" ? "neon" : "outline"}
                size="sm"
                onClick={() => setSelectedDeck(selectedDeck === "left" ? null : "left")}
              >
                Load Track
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <TurntableDeck
                deckId="left"
                track={leftTrack}
                masterVolume={masterVolume}
                crossfader={crossfader}
              />
            </div>
          </div>

          {/* Center Controls */}
          <div className="w-80 flex flex-col gap-4 flex-shrink-0">
            {/* Crossfader */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-cyan-500">DECK A</span>
                    <span className="text-purple-500">DECK B</span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={crossfader}
                      onChange={(e) => setCrossfader(Number(e.target.value))}
                      className="w-full h-3 bg-gradient-to-r from-cyan-500 via-gray-500 to-purple-500 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, 
                          rgba(0, 255, 255, ${1 - crossfader}) 0%, 
                          rgba(128, 128, 128, 0.5) ${crossfader * 100}%, 
                          rgba(255, 0, 255, ${crossfader}) 100%)`,
                      }}
                    />
                    <div
                      className="absolute top-0 h-3 w-1 bg-white rounded"
                      style={{ left: `calc(${crossfader * 100}% - 2px)` }}
                    />
                  </div>
                  <div className="text-xs text-center text-gray-400">
                    Crossfader: {Math.round((1 - crossfader) * 100)}% / {Math.round(crossfader * 100)}%
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Master Volume */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Master Volume</div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={masterVolume}
                    onChange={(e) => setMasterVolume(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="text-xs text-center text-gray-400">
                    {Math.round(masterVolume * 100)}%
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Deck */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-purple-500">DECK B</h2>
              <Button
                variant={selectedDeck === "right" ? "neon" : "outline"}
                size="sm"
                onClick={() => setSelectedDeck(selectedDeck === "right" ? null : "right")}
              >
                Load Track
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <TurntableDeck
                deckId="right"
                track={rightTrack}
                masterVolume={masterVolume}
                crossfader={crossfader}
              />
            </div>
          </div>
        </div>

        {/* Bottom Half: Track Browser */}
        <div className="flex-1 min-h-0">
          <TrackBrowser
            onTrackSelect={handleTrackSelect}
            selectedDeck={selectedDeck || undefined}
          />
        </div>
      </div>
    </div>
  )
}

