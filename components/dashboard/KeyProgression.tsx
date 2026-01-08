"use client"

import { useMemo } from "react"
import type { SetWithTracks } from "@/lib/api"
import { getCompatibleKeys } from "@/lib/harmonic-utils"

interface KeyProgressionProps {
  set: SetWithTracks | null
}

export function KeyProgression({ set }: KeyProgressionProps) {
  const progression = useMemo(() => {
    if (!set?.set_tracks || set.set_tracks.length === 0) {
      return []
    }

    return set.set_tracks.map((st, idx) => {
      const key = st.track.key || "-"
      const prevKey = idx > 0 ? set.set_tracks[idx - 1].track.key : null
      
      let transitionType = "unknown"
      if (prevKey && key !== "-") {
        const compat = getCompatibleKeys(prevKey)
        if (compat.perfect.includes(key)) transitionType = "perfect"
        else if (compat.safe.includes(key)) transitionType = "smooth"
        else if (compat.risky.includes(key)) transitionType = "risky"
        else transitionType = "clash"
      }

      return {
        position: idx + 1,
        key,
        prevKey,
        transitionType,
        track: `${st.track.artist} - ${st.track.title}`,
      }
    })
  }, [set])

  if (progression.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-500">
        No key data available
      </div>
    )
  }

  const getTransitionColor = (type: string) => {
    switch (type) {
      case "perfect": return "text-green-400"
      case "smooth": return "text-cyan-400"
      case "risky": return "text-yellow-400"
      case "clash": return "text-red-400"
      default: return "text-gray-400"
    }
  }

  return (
    <div className="space-y-3">
      {progression.map((item) => (
        <div key={item.position} className="flex items-center space-x-4 p-3 glass-panel rounded-lg">
          <div className="w-12 text-center font-bold text-cyan-500">{item.position}</div>
          <div className="flex-1">
            <div className="text-sm text-gray-400 truncate">{item.track}</div>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-lg font-mono font-bold neon-purple">{item.key}</span>
              {item.prevKey && (
                <>
                  <span className="text-gray-500">←</span>
                  <span className="text-sm text-gray-500">{item.prevKey}</span>
                  <span className={`text-xs ${getTransitionColor(item.transitionType)}`}>
                    ({item.transitionType})
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}



