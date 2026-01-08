"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, Music, TrendingUp, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function PerformancePage() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentBPM, setCurrentBPM] = useState(128)
  const { toast } = useToast()

  useEffect(() => {
    // Simulate BPM updates
    const interval = setInterval(() => {
      setCurrentBPM((prev) => prev + (Math.random() - 0.5) * 2)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleEmergency = (type: string) => {
    toast({
      title: "Emergency Action",
      description: `${type} activated`,
    })
  }

  return (
    <div className="min-h-screen bg-black p-6 pb-24">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-4xl font-bold neon-cyan">Live Performance Mode</h1>
        <Button variant="neon" onClick={handleFullscreen}>
          {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Display */}
        <div className="lg:col-span-3">
          <Card className="h-96 flex items-center justify-center">
            <CardContent className="text-center">
              <div className="text-8xl font-bold neon-cyan mb-4 pulse-beat">
                {Math.round(currentBPM)}
              </div>
              <div className="text-2xl text-gray-400">BPM</div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Controls */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-4">Emergency Controls</h3>
              <div className="space-y-2">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleEmergency("Energy Boost")}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Energy Boost
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleEmergency("Key Rescue")}
                >
                  <Music className="w-4 h-4 mr-2" />
                  Key Rescue
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleEmergency("BPM Stabilize")}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  BPM Stabilize
                </Button>
                <Button
                  variant="neon"
                  className="w-full"
                  onClick={() => handleEmergency("Crowd Hype")}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Crowd Hype
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}






