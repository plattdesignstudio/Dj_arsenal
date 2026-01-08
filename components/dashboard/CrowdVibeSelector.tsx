"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Moon, Zap, Flame } from "lucide-react"

type VibeType = "chill" | "building" | "hype" | "peak"

const vibes: { type: VibeType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: "chill", label: "Chill", icon: <Moon className="w-5 h-5" />, color: "text-blue-400" },
  { type: "building", label: "Building", icon: <Sparkles className="w-5 h-5" />, color: "text-purple-400" },
  { type: "hype", label: "Hype", icon: <Zap className="w-5 h-5" />, color: "text-yellow-400" },
  { type: "peak", label: "Peak", icon: <Flame className="w-5 h-5" />, color: "text-red-400" },
]

export function CrowdVibeSelector() {
  const [selectedVibe, setSelectedVibe] = useState<VibeType>("building")

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {vibes.map((vibe) => (
          <Button
            key={vibe.type}
            variant={selectedVibe === vibe.type ? "neon" : "outline"}
            className={`flex flex-col h-auto py-4 ${
              selectedVibe === vibe.type ? "border-2 border-cyan-500" : ""
            }`}
            onClick={() => setSelectedVibe(vibe.type)}
          >
            <span className={vibe.color}>{vibe.icon}</span>
            <span className="mt-2 text-sm">{vibe.label}</span>
          </Button>
        ))}
      </div>
      <div className="text-xs text-gray-500 text-center">
        Current: <span className="text-cyan-500 capitalize">{selectedVibe}</span>
      </div>
    </div>
  )
}






