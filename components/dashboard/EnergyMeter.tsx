"use client"

import { useMemo } from "react"
import type { SetWithTracks } from "@/lib/api"
import { getEnergyColor, getEnergyLabel } from "@/lib/utils"

interface EnergyMeterProps {
  set: SetWithTracks | null
  energyCurve: any
}

export function EnergyMeter({ set, energyCurve }: EnergyMeterProps) {
  const currentEnergy = useMemo(() => {
    if (!set?.set_tracks || set.set_tracks.length === 0) {
      return 0.5
    }

    // Get average energy of current set
    const energies = set.set_tracks
      .map(st => st.track.energy)
      .filter(e => e !== null && e !== undefined) as number[]
    
    if (energies.length === 0) return 0.5
    
    return energies.reduce((a, b) => a + b, 0) / energies.length
  }, [set])

  const energyPercent = Math.round(currentEnergy * 100)

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className={`text-4xl font-bold ${getEnergyColor(currentEnergy)}`}>
          {energyPercent}%
        </div>
        <div className="text-sm text-gray-400 mt-1">{getEnergyLabel(currentEnergy)}</div>
      </div>

      <div className="relative h-8 bg-gray-900 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            currentEnergy >= 0.8 ? "bg-red-500" :
            currentEnergy >= 0.6 ? "bg-orange-500" :
            currentEnergy >= 0.4 ? "bg-yellow-500" : "bg-green-500"
          }`}
          style={{ width: `${energyPercent}%` }}
        >
          <div className="h-full w-full bg-gradient-to-r from-transparent to-white/20"></div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-xs text-gray-500">
        <div>Low</div>
        <div className="text-center">Med</div>
        <div className="text-right">High</div>
        <div className="text-right">Peak</div>
      </div>
    </div>
  )
}






