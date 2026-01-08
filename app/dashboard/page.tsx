"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BPMFlowGraph } from "@/components/dashboard/BPMFlowGraph"
import { KeyProgression } from "@/components/dashboard/KeyProgression"
import { EnergyMeter } from "@/components/dashboard/EnergyMeter"
import { CrowdVibeSelector } from "@/components/dashboard/CrowdVibeSelector"
import { CurrentSetOverview } from "@/components/dashboard/CurrentSetOverview"
import { AITrackSuggestions } from "@/components/dashboard/AITrackSuggestions"
import { DJAIControls } from "@/components/dashboard/DJAIControls"
import { PersonaSelector } from "@/components/dashboard/PersonaSelector"
import { setsApi, flowApi } from "@/lib/api"
import type { SetWithTracks } from "@/lib/api"

export default function DashboardPage() {
  const [currentSet, setCurrentSet] = useState<SetWithTracks | null>(null)
  const [energyCurve, setEnergyCurve] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPersona, setSelectedPersona] = useState<string>("")

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const sets = await setsApi.getAll()
      if (sets.length > 0) {
        const set = await setsApi.getById(sets[0].id)
        setCurrentSet(set)
        
        // Load energy curve
        const curve = await flowApi.getEnergyCurve(set.id)
        setEnergyCurve(curve)
      }
    } catch (error: any) {
      console.error("Failed to load dashboard:", error)
      // Check if it's a network/connection error
      if (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNREFUSED') {
        console.error("Backend server is not running. Start it with: cd backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload")
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl neon-cyan">Loading DJ Arsenal...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-6 pb-24 space-y-6">
      <div className="mb-8">
        <h1 className="text-5xl font-bold neon-cyan mb-2">DJ ARSENAL</h1>
        <p className="text-gray-400 text-lg">AI-Augmented DJ Dashboard & Generative Artist Studio</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Control Panel */}
        <div className="lg:col-span-2 space-y-6">
          <CurrentSetOverview set={currentSet} />
          
          <Card>
            <CardHeader>
              <CardTitle className="neon-purple">BPM Flow Graph</CardTitle>
              <CardDescription>Track tempo progression and transitions</CardDescription>
            </CardHeader>
            <CardContent>
              <BPMFlowGraph set={currentSet} energyCurve={energyCurve} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="neon-pink">Key Progression Timeline</CardTitle>
              <CardDescription>Harmonic mixing visualization</CardDescription>
            </CardHeader>
            <CardContent>
              <KeyProgression set={currentSet} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="neon-cyan">Energy Level</CardTitle>
              <CardDescription>Current set energy meter</CardDescription>
            </CardHeader>
            <CardContent>
              <EnergyMeter set={currentSet} energyCurve={energyCurve} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Crowd Vibe</CardTitle>
              <CardDescription>Adjust set energy to match crowd</CardDescription>
            </CardHeader>
            <CardContent>
              <CrowdVibeSelector />
            </CardContent>
          </Card>

          <PersonaSelector
            selectedPersona={selectedPersona}
            onPersonaChange={setSelectedPersona}
          />

          <AITrackSuggestions
            currentTrackId={currentSet?.set_tracks?.[0]?.track?.id || null}
            eventType={undefined}
          />

          <DJAIControls
            currentBpm={currentSet?.set_tracks?.[0]?.track?.bpm}
            currentKey={currentSet?.set_tracks?.[0]?.track?.key || undefined}
            currentEnergy={currentSet?.set_tracks?.[0]?.track?.energy}
            eventType={undefined}
            personaId={selectedPersona}
          />
        </div>
      </div>
    </div>
  )
}

