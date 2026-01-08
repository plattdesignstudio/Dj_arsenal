"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { personasApi, type DJPersona } from "@/lib/api"
import { User, Sparkles } from "lucide-react"

interface PersonaSelectorProps {
  selectedPersona?: string
  onPersonaChange?: (personaId: string) => void
  showDescription?: boolean
}

export function PersonaSelector({
  selectedPersona,
  onPersonaChange,
  showDescription = false,
}: PersonaSelectorProps) {
  const [personas, setPersonas] = useState<DJPersona[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPersonas()
  }, [])

  const loadPersonas = async () => {
    try {
      const personaList = await personasApi.list()
      setPersonas(personaList)
      if (personaList.length > 0 && !selectedPersona && onPersonaChange) {
        onPersonaChange(personaList[0].id)
      }
    } catch (error) {
      console.error("Failed to load personas:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-gray-400">Loading personas...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="w-5 h-5 text-cyan-500" />
          <span>DJ Persona</span>
        </CardTitle>
        <CardDescription>Select your AI DJ personality</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {personas.map((persona) => (
          <div
            key={persona.id}
            onClick={() => onPersonaChange?.(persona.id)}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              selectedPersona === persona.id
                ? "border-cyan-500 bg-cyan-500/10"
                : "border-white/10 bg-black/40 hover:border-cyan-500/50"
            }`}
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <div className="flex-1">
                <div className="font-semibold text-white">{persona.name}</div>
                {showDescription && persona.description && (
                  <div className="text-xs text-gray-400 mt-1">
                    {persona.description.substring(0, 100)}...
                  </div>
                )}
              </div>
              {selectedPersona === persona.id && (
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}





