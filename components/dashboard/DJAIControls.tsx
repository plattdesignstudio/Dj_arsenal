"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  djIntelligenceApi,
  type DJIntelligenceRequest,
} from "@/lib/api"
import { Mic, TrendingUp, Loader2 } from "lucide-react"

interface DJAIControlsProps {
  currentBpm?: number
  currentKey?: string
  currentEnergy?: number
  eventType?: string
  personaId?: string
}

export function DJAIControls({
  currentBpm,
  currentKey,
  currentEnergy,
  eventType,
  personaId,
}: DJAIControlsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)
  const [streamingResponse, setStreamingResponse] = useState<string>("")

  const handleAction = async (
    action: string,
    apiCall: () => Promise<any>,
    successMessage: string
  ) => {
    setLoading(action)
    setStreamingResponse("")
    try {
      const result = await apiCall()
      toast({
        title: "Success",
        description: successMessage,
      })
      return result
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || error.message || "Action failed",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
      setStreamingResponse("")
    }
  }

  const handleRecoverEnergy = async () => {
    if (currentEnergy === undefined) {
      toast({
        title: "Error",
        description: "Current energy level required",
        variant: "destructive",
      })
      return
    }

    const targetEnergy = Math.min(0.95, currentEnergy + 0.3)

    const request: DJIntelligenceRequest = {
      query: `Energy is at ${currentEnergy.toFixed(2)}, need to reach ${targetEnergy.toFixed(2)} in 2 tracks. How do I recover?`,
      personaId,
      currentEnergy,
      currentBpm,
      currentKey,
      eventType,
    }

    await handleAction(
      "recover",
      () => djIntelligenceApi.query(request),
      "Recovery strategy generated!"
    )
  }

  const handleSuggestNextTrack = async () => {
    const request: DJIntelligenceRequest = {
      query: `Suggest the next track${currentBpm ? ` at ${currentBpm} BPM` : ""}${
        currentEnergy !== undefined ? ` with energy ${currentEnergy.toFixed(2)}` : ""
      }${eventType ? ` for a ${eventType} event` : ""}`,
      personaId,
      currentBpm,
      currentKey,
      currentEnergy,
      eventType,
    }

    // Use streaming for live feedback
    setLoading("suggest")
    setStreamingResponse("")

    try {
      await djIntelligenceApi.queryStream(request, (chunk) => {
        setStreamingResponse((prev) => prev + chunk)
      })

      toast({
        title: "Success",
        description: "Track suggestion generated!",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Suggestion failed",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="neon-cyan">AI DJ Controls</CardTitle>
        <CardDescription>Real-time AI-powered DJ actions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleRecoverEnergy}
            disabled={loading !== null || currentEnergy === undefined}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            size="lg"
          >
            {loading === "recover" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <TrendingUp className="mr-2 h-4 w-4" />
            )}
            Recover Energy
          </Button>

          <Button
            onClick={handleSuggestNextTrack}
            disabled={loading !== null}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            size="lg"
          >
            {loading === "suggest" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mic className="mr-2 h-4 w-4" />
            )}
            Suggest Track
          </Button>
        </div>

        {streamingResponse && (
          <div className="mt-4 p-3 bg-black/50 rounded-lg border border-cyan-500/30">
            <p className="text-sm text-cyan-400 font-mono">{streamingResponse}</p>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>Current: {currentBpm ? `${currentBpm} BPM` : "-"} | {currentKey || "-"} | {currentEnergy !== undefined ? `${(currentEnergy * 100).toFixed(0)}%` : "-"}</p>
          {eventType && <p>Event: {eventType}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
