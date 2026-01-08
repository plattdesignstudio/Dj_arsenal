"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlbumArt } from "@/components/ui/album-art"
import { Button } from "@/components/ui/button"
import { 
  aiApi, 
  djIntelligenceApi,
  personasApi,
  visualsApi,
  eventsApi, 
  setsApi,
  enhancedAIVoiceApi,
  type EventType,
  type DJPersona
} from "@/lib/api"
import { Sparkles, Wand2, Music, FileText, Brain, Image as ImageIcon, Loader2, Mic, Play } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AudioModulationControls } from "@/components/dj/AudioModulationControls"

export default function AIStudioPage() {
  const [eventType, setEventType] = useState("Club Night")
  const [duration, setDuration] = useState(60)
  const [generating, setGenerating] = useState(false)
  const [generatedSet, setGeneratedSet] = useState<any>(null)
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [personas, setPersonas] = useState<DJPersona[]>([])
  const [selectedPersona, setSelectedPersona] = useState<string>("")
  const [djQuery, setDjQuery] = useState("")
  const [djResponse, setDjResponse] = useState("")
  const [streamingResponse, setStreamingResponse] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [voiceText, setVoiceText] = useState("")
  const [generatingVoice, setGeneratingVoice] = useState(false)
  const [voiceAudioUrl, setVoiceAudioUrl] = useState<string | null>(null)
  const [voicePersona, setVoicePersona] = useState<string>("hype_master")
  const { toast } = useToast()

  const loadEventTypes = async () => {
    try {
      const events = await eventsApi.getAll()
      setEventTypes(events)
    } catch (error) {
      console.error("Failed to load event types:", error)
    }
  }

  useEffect(() => {
    loadEventTypes()
    loadPersonas()
  }, [])

  const loadPersonas = async () => {
    try {
      const personaList = await personasApi.list()
      setPersonas(personaList)
    } catch (error) {
      console.error("Failed to load personas:", error)
    }
  }

  const handleGenerateSet = async () => {
    setGenerating(true)
    try {
      const result = await aiApi.generateSet(eventType, duration)
      setGeneratedSet(result)
      toast({
        title: "Success",
        description: "AI set generated successfully!",
      })
    } catch (error) {
      console.error("Failed to generate set:", error)
      toast({
        title: "Error",
        description: "Failed to generate AI set",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveSet = async () => {
    if (!generatedSet || !generatedSet.tracks) return

    try {
      const trackIds = generatedSet.tracks.map((t: any) => t.id)
      const totalDuration = generatedSet.tracks.reduce(
        (sum: number, t: any) => sum + (t.duration || 240),
        0
      )

      await setsApi.create({
        name: `AI Generated Set - ${eventType}`,
        description: generatedSet.notes?.join("\n") || "AI-generated set",
        duration: totalDuration,
        track_ids: trackIds,
      })

      toast({
        title: "Success",
        description: "Set saved successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save set",
        variant: "destructive",
      })
    }
  }

  const handleDJIntelligence = async () => {
    if (!djQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a question",
        variant: "destructive",
      })
      return
    }

    setIsStreaming(true)
    setStreamingResponse("")
    setDjResponse("")

    try {
      await djIntelligenceApi.queryStream(
        {
          query: djQuery,
          personaId: selectedPersona || undefined,
          eventType: eventType,
        },
        (chunk) => {
          setStreamingResponse((prev) => prev + chunk)
        }
      )
      setDjResponse(streamingResponse)
      setIsStreaming(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get DJ intelligence",
        variant: "destructive",
      })
      setIsStreaming(false)
    }
  }

  const handleGenerateVisual = async () => {
    setGenerating(true)
    try {
      const result = await visualsApi.generate({
        prompt: `DJ logo for ${eventType} event, modern, electronic, professional`,
        style: eventType.toLowerCase().includes("festival") ? "festival" : "club",
        quality: "hd",
      })
      toast({
        title: "Success",
        description: "Visual generated! Check the result below.",
      })
      // In a real app, you'd display the image
      window.open(result.image_url, "_blank")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate visual",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
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
        personaId: voicePersona || "hype_master",
        style: eventType.toLowerCase().includes("festival") ? "festival" : "club",
        tempo: 128,
      })
      
      // Construct full URL if needed
      const audioUrl = result.audio_url.startsWith("http") 
        ? result.audio_url 
        : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${result.audio_url}`
      
      setVoiceAudioUrl(audioUrl)
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

  return (
    <div className="min-h-screen bg-black p-6 pb-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold neon-cyan mb-2 flex items-center space-x-3">
          <Sparkles className="w-10 h-10" />
          <span>AI Studio</span>
        </h1>
        <p className="text-gray-400">AI-powered set generation and optimization</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DJ Intelligence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-500" />
              <span>DJ Intelligence</span>
            </CardTitle>
            <CardDescription>Ask AI for DJ advice and track suggestions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Persona</label>
              <select
                value={selectedPersona}
                onChange={(e) => setSelectedPersona(e.target.value)}
                className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Default</option>
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Ask DJ AI</label>
              <textarea
                value={djQuery}
                onChange={(e) => setDjQuery(e.target.value)}
                placeholder="e.g., 'Suggest next track for 128 BPM peak hour' or 'How do I recover energy?'"
                className="w-full h-24 px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>
            <Button
              variant="neon"
              className="w-full"
              onClick={handleDJIntelligence}
              disabled={isStreaming || !djQuery.trim()}
            >
              {isStreaming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Get AI Advice
                </>
              )}
            </Button>
            {(streamingResponse || djResponse) && (
              <div className="p-4 bg-black/50 rounded-lg border border-purple-500/30">
                <p className="text-sm text-purple-300 font-mono whitespace-pre-wrap">
                  {streamingResponse || djResponse}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visual Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ImageIcon className="w-5 h-5 text-cyan-500" />
              <span>Visual Generator</span>
            </CardTitle>
            <CardDescription>Generate DJ logos and event posters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGenerateVisual}
              disabled={generating}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              {generating ? "Generating..." : "Generate Event Visual"}
            </Button>
            <p className="text-xs text-gray-500">
              Creates a professional DJ visual for your current event type
            </p>
          </CardContent>
        </Card>

        {/* Set Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wand2 className="w-5 h-5 text-purple-500" />
              <span>Generate Set</span>
            </CardTitle>
            <CardDescription>Create a complete DJ set using AI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                {eventTypes.map((et) => (
                  <option key={et.id} value={et.name}>
                    {et.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Duration: {duration} minutes
              </label>
              <input
                type="range"
                min="30"
                max="120"
                step="15"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <Button
              variant="neon"
              className="w-full"
              onClick={handleGenerateSet}
              disabled={generating}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {generating ? "Generating..." : "Generate AI Set"}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Set */}
        {generatedSet && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Music className="w-5 h-5 text-cyan-500" />
                  <span>Generated Set</span>
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleSaveSet}>
                  Save Set
                </Button>
              </div>
              <CardDescription>
                {generatedSet.tracks?.length || 0} tracks selected by AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {generatedSet.tracks?.map((track: any, idx: number) => (
                  <div
                    key={track.id || idx}
                    className="p-3 glass-panel rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <AlbumArt
                        imageUrl={track.cover_art || track.album_image_url}
                        alt={`${track.title} by ${track.artist}`}
                        size="sm"
                        className="flex-shrink-0"
                      />
                      <span className="text-xs font-bold text-purple-500">#{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white truncate">{track.title}</div>
                        <div className="text-sm text-gray-400 truncate">{track.artist}</div>
                      </div>
                      {track.bpm && (
                        <span className="text-xs text-cyan-500">{track.bpm} BPM</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {generatedSet.notes && generatedSet.notes.length > 0 && (
                <div className="mt-4 p-3 glass-panel rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-semibold">AI Notes</span>
                  </div>
                  <ul className="text-sm text-gray-400 space-y-1">
                    {generatedSet.notes.map((note: string, idx: number) => (
                      <li key={idx}>• {note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Additional AI Tools Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold neon-purple mb-4">Advanced AI Tools</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common DJ intelligence queries</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={async () => {
                  setDjQuery("Suggest the next track for peak hour")
                  await handleDJIntelligence()
                }}
                disabled={isStreaming}
              >
                Suggest Next Track
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={async () => {
                  setDjQuery("How do I recover energy in 2 tracks?")
                  await handleDJIntelligence()
                }}
                disabled={isStreaming}
              >
                Recover Energy Strategy
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={async () => {
                  setDjQuery("What's the best BPM ramp from 120 to 128?")
                  await handleDJIntelligence()
                }}
                disabled={isStreaming}
              >
                BPM Ramp Strategy
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}



