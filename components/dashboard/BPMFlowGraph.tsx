"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { SetWithTracks } from "@/lib/api"

interface BPMFlowGraphProps {
  set: SetWithTracks | null
  energyCurve: any
}

export function BPMFlowGraph({ set, energyCurve }: BPMFlowGraphProps) {
  const data = useMemo(() => {
    if (!set?.set_tracks || set.set_tracks.length === 0) {
      return []
    }

    return set.set_tracks.map((st, idx) => ({
      name: `${idx + 1}`,
      bpm: st.track.bpm || 0,
      energy: st.track.energy || 0,
      track: `${st.track.artist} - ${st.track.title}`,
    }))
  }, [set])

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No track data available
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis 
            dataKey="name" 
            stroke="#888"
            tick={{ fill: "#888" }}
          />
          <YAxis 
            stroke="#888"
            tick={{ fill: "#888" }}
            label={{ value: "BPM", angle: -90, position: "insideLeft", fill: "#888" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: "8px",
            }}
            formatter={(value: number, name: string) => {
              if (name === "bpm") return [Math.round(value), "BPM"]
              if (name === "energy") return [(value * 100).toFixed(0) + "%", "Energy"]
              return [value, name]
            }}
          />
          <Line
            type="monotone"
            dataKey="bpm"
            stroke="#00ffff"
            strokeWidth={3}
            dot={{ fill: "#00ffff", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}






