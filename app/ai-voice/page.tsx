"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  enhancedAIVoiceApi,
  personasApi,
  eventsApi,
  djIntelligenceApi,
  API_URL,
  type DJPersona,
  type EventType
} from "@/lib/api"
import { Mic, Play, Pause, Loader2, Sparkles, Volume2, Radio } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AudioModulationControls } from "@/components/dj/AudioModulationControls"

interface PersonaEnergy {
  id: string
  name: string
  description: string
  energy: "low" | "medium" | "high"
  color: string
}

const PERSONA_ENERGIES: PersonaEnergy[] = [
  {
    id: "hype_master",
    name: "Hype Master",
    description: "Infectious energy, authentic crowd connection",
    energy: "high",
    color: "text-red-500"
  },
  {
    id: "nova",
    name: "DJ NOVA",
    description: "Futuristic, confident, hypnotic",
    energy: "medium",
    color: "text-cyan-500"
  },
  {
    id: "underground",
    name: "Underground Selector",
    description: "Deep knowledge, authoritative",
    energy: "medium",
    color: "text-purple-500"
  },
  {
    id: "festival",
    name: "Festival Commander",
    description: "Commanding, theatrical presence",
    energy: "high",
    color: "text-yellow-500"
  },
  {
    id: "smooth",
    name: "Smooth Operator",
    description: "Subtle, sophisticated",
    energy: "low",
    color: "text-blue-500"
  }
]

interface EventScenario {
  name: string
  description: string
  suggestedPersona: string
  tempo: number
  style: string
  phrases: string[]
  icon: string
  color: string
}

const EVENT_SCENARIOS: EventScenario[] = [
  {
    name: "Club Night",
    description: "Peak hour energy, high intensity",
    suggestedPersona: "hype_master",
    tempo: 128,
    style: "club",
    phrases: [
      "Everybody hands up!",
      "Let's take this higher!",
      "Are you ready?",
      "This is for you!",
      "Make some noise!",
      "Energy is building!",
      "Here we go!",
      "Drop it!"
    ],
    icon: "🎵",
    color: "border-purple-500"
  },
  {
    name: "Festival",
    description: "Massive crowd, theatrical presence",
    suggestedPersona: "festival",
    tempo: 135,
    style: "festival",
    phrases: [
      "Festival family, are you ready?",
      "This is what you came for!",
      "Let's make history!",
      "Put your hands in the air!",
      "This moment is yours!",
      "We are one!",
      "Feel the energy!",
      "This is legendary!"
    ],
    icon: "🎪",
    color: "border-yellow-500"
  },
  {
    name: "Warehouse / Underground",
    description: "Deep, minimal, authentic",
    suggestedPersona: "underground",
    tempo: 130,
    style: "underground",
    phrases: [
      "Deep in the groove",
      "Feel the bass",
      "This is underground",
      "Lost in the music",
      "Pure energy",
      "The real sound",
      "Authentic vibes",
      "Underground family"
    ],
    icon: "🏭",
    color: "border-gray-500"
  },
  {
    name: "Afterparty",
    description: "Late night, high energy continuation",
    suggestedPersona: "hype_master",
    tempo: 140,
    style: "afterparty",
    phrases: [
      "We're just getting started!",
      "The night is young!",
      "Who's still with me?",
      "This is the afterparty!",
      "Keep the energy going!",
      "We don't stop!",
      "This is for the real ones!",
      "Let's go all night!"
    ],
    icon: "🌙",
    color: "border-indigo-500"
  },
  {
    name: "Sunset Lounge",
    description: "Chill vibes, sophisticated atmosphere",
    suggestedPersona: "smooth",
    tempo: 100,
    style: "lounge",
    phrases: [
      "Relax and enjoy",
      "Smooth vibes",
      "Take it easy",
      "Feel the moment",
      "Chill atmosphere",
      "Easy listening",
      "Smooth transitions",
      "Perfect vibes"
    ],
    icon: "🌅",
    color: "border-orange-500"
  },
  {
    name: "Wedding",
    description: "Celebratory, crowd-pleasing",
    suggestedPersona: "smooth",
    tempo: 115,
    style: "wedding",
    phrases: [
      "Let's celebrate!",
      "This is a special night!",
      "Everyone on the dance floor!",
      "Let's make memories!",
      "This is for the happy couple!",
      "Let's party!",
      "Everyone together!",
      "Celebrate love!"
    ],
    icon: "💒",
    color: "border-pink-500"
  },
  {
    name: "Corporate Event",
    description: "Professional, upbeat but controlled",
    suggestedPersona: "nova",
    tempo: 110,
    style: "corporate",
    phrases: [
      "Thank you for being here",
      "Let's network and enjoy",
      "Great energy tonight",
      "Enjoy the evening",
      "Thank you for coming",
      "Let's celebrate success",
      "Professional vibes",
      "Enjoy the music"
    ],
    icon: "💼",
    color: "border-blue-500"
  }
]

export default function AIVoicePage() {
  const [voiceText, setVoiceText] = useState("")
  const [selectedPersona, setSelectedPersona] = useState<string>("hype_master")
  const [selectedScenario, setSelectedScenario] = useState<string>("Club Night")
  const [generatingVoice, setGeneratingVoice] = useState(false)
  const [voiceAudioUrl, setVoiceAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [personas, setPersonas] = useState<DJPersona[]>([])
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [personaDescription, setPersonaDescription] = useState("")
  const [generatingPhrase, setGeneratingPhrase] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isSeeking, setIsSeeking] = useState(false)
  const [seekPosition, setSeekPosition] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { toast } = useToast()

  const currentScenario = EVENT_SCENARIOS.find(s => s.name === selectedScenario) || EVENT_SCENARIOS[0]

  useEffect(() => {
    loadPersonas()
    loadEventTypes()
  }, [])

  useEffect(() => {
    // Auto-update persona when scenario changes
    const scenario = EVENT_SCENARIOS.find(s => s.name === selectedScenario)
    if (scenario && scenario.suggestedPersona) {
      setSelectedPersona(scenario.suggestedPersona)
    }
  }, [selectedScenario])

  useEffect(() => {
    const persona = PERSONA_ENERGIES.find(p => p.id === selectedPersona)
    if (persona) {
      setPersonaDescription(persona.description)
    } else {
      const dbPersona = personas.find(p => p.id === selectedPersona)
      if (dbPersona) {
        setPersonaDescription(dbPersona.description || "")
      }
    }
  }, [selectedPersona, personas])

  const loadPersonas = async () => {
    try {
      const personaList = await personasApi.list()
      setPersonas(personaList)
    } catch (error) {
      console.error("Failed to load personas:", error)
    }
  }

  const loadEventTypes = async () => {
    try {
      const events = await eventsApi.getAll()
      setEventTypes(events)
    } catch (error) {
      console.error("Failed to load event types:", error)
    }
  }

  const handleGenerateVoice = async () => {
    if (!voiceText.trim()) {
      toast({
        title: "Error",
        description: "Please enter text to generate voice",
        variant: "destructive",
      })
      return
    }

    setGeneratingVoice(true)
    try {
      const result = await enhancedAIVoiceApi.generate({
        text: voiceText,
        personaId: selectedPersona || currentScenario.suggestedPersona,
        style: currentScenario.style,
        tempo: currentScenario.tempo,
      })
      
      const audioUrl = result.audio_url.startsWith("http") 
        ? result.audio_url 
        : `${API_URL}${result.audio_url}`
      
      setVoiceAudioUrl(audioUrl)
      setIsPlaying(false)
      
      toast({
        title: "Success",
        description: "Voice generated successfully!",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate voice",
        variant: "destructive",
      })
    } finally {
      setGeneratingVoice(false)
    }
  }

  // Format time helper function
  const formatTime = (seconds: number | undefined | null) => {
    if (seconds === undefined || seconds === null || isNaN(seconds) || seconds < 0) {
      return "0:00"
    }
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Update audio element when URL changes
  useEffect(() => {
    if (voiceAudioUrl && !audioRef.current) {
      const audio = new Audio(voiceAudioUrl)
      audioRef.current = audio
      
      // Set up event listeners
      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration)
      })
      
      audio.addEventListener("timeupdate", () => {
        if (!isSeeking) {
          setCurrentTime(audio.currentTime)
        }
      })
      
      audio.addEventListener("ended", () => {
        setIsPlaying(false)
        setCurrentTime(0)
      })
      
      audio.addEventListener("pause", () => {
        setIsPlaying(false)
      })
      
      audio.addEventListener("play", () => {
        setIsPlaying(true)
      })
    }
    
    return () => {
      // Cleanup when audio URL changes
      if (audioRef.current) {
        audioRef.current.removeEventListener("timeupdate", () => {})
        audioRef.current.removeEventListener("ended", () => {})
        audioRef.current.removeEventListener("pause", () => {})
        audioRef.current.removeEventListener("play", () => {})
      }
    }
  }, [voiceAudioUrl, isSeeking])

  // Progress update interval for smooth animation
  useEffect(() => {
    if (!isPlaying || !audioRef.current || isSeeking) return
    
    const interval = setInterval(() => {
      if (audioRef.current && !isSeeking) {
        setCurrentTime(audioRef.current.currentTime)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [isPlaying, isSeeking])

  const handlePlayPause = () => {
    if (!audioRef.current) {
      if (voiceAudioUrl) {
        const audio = new Audio(voiceAudioUrl)
        audioRef.current = audio
        audio.addEventListener("loadedmetadata", () => {
          setDuration(audio.duration)
        })
        audio.addEventListener("timeupdate", () => {
          if (!isSeeking) {
            setCurrentTime(audio.currentTime)
          }
        })
        audio.addEventListener("ended", () => {
          setIsPlaying(false)
          setCurrentTime(0)
        })
        audio.addEventListener("pause", () => {
          setIsPlaying(false)
        })
        audio.addEventListener("play", () => {
          setIsPlaying(true)
        })
      }
    }

    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
    } else {
      audioRef.current?.play()
      setIsPlaying(true)
    }
  }

  const handleSeek = (newTime: number) => {
    if (!audioRef.current || duration <= 0) return
    
    const clampedTime = Math.max(0, Math.min(newTime, duration))
    audioRef.current.currentTime = clampedTime
    setCurrentTime(clampedTime)
  }

  const handleSeekStart = () => {
    setIsSeeking(true)
  }

  const handleSeekChange = (newTime: number) => {
    if (duration > 0) {
      const clampedTime = Math.max(0, Math.min(newTime, duration))
      setSeekPosition(clampedTime)
    }
  }

  const handleSeekEnd = () => {
    if (seekPosition !== null) {
      handleSeek(seekPosition)
    }
    setIsSeeking(false)
    setSeekPosition(null)
  }

  const quickPhrases = currentScenario.phrases

  const selectedPersonaData = PERSONA_ENERGIES.find(p => p.id === selectedPersona) || personas.find(p => p.id === selectedPersona)
  
  const getEnergyLevel = (): string => {
    const persona = PERSONA_ENERGIES.find(p => p.id === selectedPersona)
    if (!persona) return "medium"
    return persona.energy === "high" ? "high" : persona.energy === "low" ? "low" : "medium"
  }

  const handleGeneratePhrase = async () => {
    setGeneratingPhrase(true)
    try {
      const energyLevel = getEnergyLevel()
      const personaName = PERSONA_ENERGIES.find(p => p.id === selectedPersona)?.name || selectedPersona
      
      const query = `Generate a short DJ phrase (10-15 words) for ${currentScenario.name}. Energy: ${energyLevel}. Style: ${personaName}. Return only the phrase, no quotes.`

      // Ensure personaId is not empty string
      const personaIdForRequest = selectedPersona && selectedPersona.trim() ? selectedPersona : undefined
      
      const result = await djIntelligenceApi.query({
        query,
        personaId: personaIdForRequest,
        eventType: currentScenario.name,
        currentEnergy: energyLevel === "high" ? 0.9 : energyLevel === "low" ? 0.3 : 0.6,
      })

      const generatedPhrase = result.response.trim()
      // Clean up the response - remove any quotes or extra formatting
      const cleanPhrase = generatedPhrase.replace(/^["']|["']$/g, '').trim()
      setVoiceText(cleanPhrase)
      
      toast({
        title: "Success",
        description: "Phrase generated!",
      })
    } catch (error: any) {
      console.error("Error generating phrase:", error)
      const errorMessage = error.response?.data?.detail || error.message || "Failed to generate phrase. Make sure the backend server is running."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setGeneratingPhrase(false)
    }
  }

  return (
    <div className="min-h-screen bg-black p-6 pb-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold neon-cyan mb-2 flex items-center space-x-3">
          <Mic className="w-10 h-10" />
          <span>AI Voice Studio</span>
        </h1>
        <p className="text-gray-400">Generate DJ voice with persona-based energy and audio modulation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Voice Generation */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-cyan-500" />
                <span>Voice Generation</span>
              </CardTitle>
              <CardDescription>Create AI-generated DJ voice with customizable personas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-4 rounded-lg border ${currentScenario.color} bg-black/50`}>
                <label className="text-sm text-gray-400 mb-2 block">Event Scenario</label>
                <select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500 mb-3"
                >
                  {EVENT_SCENARIOS.map((scenario) => (
                    <option key={scenario.name} value={scenario.name}>
                      {scenario.name}
                    </option>
                  ))}
                </select>
                {currentScenario && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xl">{currentScenario.icon}</span>
                      <p className="text-sm text-gray-300">{currentScenario.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                      <span>BPM: {currentScenario.tempo}</span>
                      <span>Style: {currentScenario.style}</span>
                      <span>Persona: {PERSONA_ENERGIES.find(p => p.id === currentScenario.suggestedPersona)?.name || currentScenario.suggestedPersona}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">DJ Persona / Energy</label>
                <select
                  value={selectedPersona}
                  onChange={(e) => setSelectedPersona(e.target.value)}
                  className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  {PERSONA_ENERGIES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.energy} energy)
                    </option>
                  ))}
                  {personas
                    .filter(p => !PERSONA_ENERGIES.find(pe => pe.id === p.id))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
                {personaDescription && (
                  <div className="mt-2 p-3 bg-black/50 rounded-lg border border-cyan-500/30">
                    <div className="flex items-center space-x-2 mb-1">
                      <Radio className="w-4 h-4 text-cyan-500" />
                      <span className="text-sm font-semibold text-cyan-400">Persona Description</span>
                    </div>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">
                      {personaDescription}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400 block">Voice Text</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGeneratePhrase}
                    disabled={generatingPhrase}
                    className="text-xs h-7 px-2"
                  >
                    {generatingPhrase ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 mr-1" />
                        Auto Generate Phrase
                      </>
                    )}
                  </Button>
                </div>
                <textarea
                  value={voiceText}
                  onChange={(e) => setVoiceText(e.target.value)}
                  placeholder="Enter text to convert to DJ voice... or click 'Auto Generate Phrase' for a quick phrase"
                  className="w-full h-28 px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-y min-h-[100px] max-h-[150px]"
                />
                {voiceText && (
                  <div className="mt-1 text-xs text-gray-500">
                    {voiceText.split(/\s+/).length} words
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400 block">Quick Phrases</label>
                  <span className="text-xs text-gray-500">Click to use short phrases</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickPhrases.map((phrase) => (
                    <Button
                      key={phrase}
                      variant="outline"
                      size="sm"
                      onClick={() => setVoiceText(phrase)}
                      className="text-xs"
                    >
                      {phrase}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                variant="neon"
                className="w-full"
                onClick={handleGenerateVoice}
                disabled={generatingVoice || !voiceText.trim()}
              >
                {generatingVoice ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Voice...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Generate Voice
                  </>
                )}
              </Button>

              {voiceAudioUrl && (
                <div className="p-4 bg-black/50 rounded-lg border border-cyan-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Volume2 className="w-5 h-5 text-cyan-500" />
                      <span className="text-sm font-semibold">Generated Audio</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePlayPause}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Play
                        </>
                      )}
                    </Button>
                  </div>
                  <audio
                    ref={audioRef}
                    src={voiceAudioUrl}
                    className="w-full"
                    controls
                    crossOrigin="anonymous"
                    preload="auto"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audio Modulation Controls */}
          {voiceAudioUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Radio className="w-5 h-5 text-purple-500" />
                  <span>Audio Modulation Studio</span>
                </CardTitle>
                <CardDescription>Real-time audio effects and EQ controls</CardDescription>
              </CardHeader>
              <CardContent>
                <AudioModulationControls audioUrl={voiceAudioUrl} audioElement={audioRef.current} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Persona Info & Energy Levels */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Persona Energies</CardTitle>
              <CardDescription>Select persona based on desired energy level</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {PERSONA_ENERGIES.map((persona) => (
                <div
                  key={persona.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedPersona === persona.id
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-white/10 bg-black/40 hover:border-white/20"
                  }`}
                  onClick={() => setSelectedPersona(persona.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-semibold ${persona.color}`}>{persona.name}</span>
                    <span className="text-xs text-gray-400 capitalize">{persona.energy}</span>
                  </div>
                  <p className="text-xs text-gray-400">{persona.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Energy Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-300">High Energy: Hype Master, Festival Commander</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-gray-300">Medium Energy: DJ NOVA, Underground</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-300">Low Energy: Smooth Operator</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

