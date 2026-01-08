"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { setsApi, flowApi, type Set, type SetWithTracks } from "@/lib/api"
import { formatDuration } from "@/lib/utils"
import { Plus, Play, Edit, Sparkles } from "lucide-react"
import Link from "next/link"
import { aiApi } from "@/lib/api"

export default function SetsPage() {
  const [sets, setSets] = useState<Set[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSets()
  }, [])

  const loadSets = async () => {
    try {
      const data = await setsApi.getAll()
      setSets(data)
    } catch (error) {
      console.error("Failed to load sets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOptimize = async (setId: string) => {
    try {
      await flowApi.optimizeSet(setId)
      loadSets() // Reload
    } catch (error) {
      console.error("Failed to optimize set:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl neon-cyan">Loading sets...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-6 pb-24">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold neon-cyan mb-2">DJ Sets</h1>
          <p className="text-gray-400">Create and manage your performance sets</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" asChild>
            <Link href="/ai-studio">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Generate
            </Link>
          </Button>
          <Button variant="neon">
            <Plus className="w-4 h-4 mr-2" />
            New Set
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sets.map((set) => (
          <Card key={set.id} className="hover:border-cyan-500/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-xl">{set.name}</CardTitle>
              {set.description && <CardDescription>{set.description}</CardDescription>}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Duration</span>
                  <span className="text-white">{formatDuration(set.duration)}</span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/sets/${set.id}`}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                  <Button variant="neon" size="sm" className="flex-1">
                    <Play className="w-4 h-4 mr-2" />
                    Play
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => handleOptimize(set.id)}
                >
                  Optimize Flow
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sets.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No sets yet. Create your first set to get started.
        </div>
      )}
    </div>
  )
}






