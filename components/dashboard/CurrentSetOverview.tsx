"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDuration, formatBPM } from "@/lib/utils"
import type { SetWithTracks } from "@/lib/api"
import { Music, Clock, Disc } from "lucide-react"

interface CurrentSetOverviewProps {
  set: SetWithTracks | null
}

export function CurrentSetOverview({ set }: CurrentSetOverviewProps) {
  if (!set) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Set</CardTitle>
          <CardDescription>Create or select a set to begin</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const totalTracks = set.set_tracks?.length || 0
  const avgBPM = set.set_tracks?.reduce((acc, st) => {
    return acc + (st.track.bpm || 0)
  }, 0) / totalTracks || 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{set.name}</CardTitle>
        {set.description && <CardDescription>{set.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Music className="w-5 h-5 text-cyan-500" />
            <div>
              <div className="text-sm text-gray-400">Tracks</div>
              <div className="text-xl font-bold">{totalTracks}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-purple-500" />
            <div>
              <div className="text-sm text-gray-400">Duration</div>
              <div className="text-xl font-bold">{formatDuration(set.duration)}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Disc className="w-5 h-5 text-pink-500" />
            <div>
              <div className="text-sm text-gray-400">Avg BPM</div>
              <div className="text-xl font-bold">{formatBPM(avgBPM)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}






