"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { transcriptionApi, type TranscriptionResponse } from "@/lib/api"
import { Mic, Upload, FileAudio, Loader2, Play, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function TranscriptionInterface() {
  const [file, setFile] = useState<File | null>(null)
  const [transcribing, setTranscribing] = useState(false)
  const [transcript, setTranscript] = useState<TranscriptionResponse | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setAudioUrl(URL.createObjectURL(selectedFile))
      setTranscript(null)
    }
  }

  const handleTranscribe = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select an audio file",
        variant: "destructive",
      })
      return
    }

    setTranscribing(true)
    try {
      const result = await transcriptionApi.transcribeFile(file, undefined, "DJ hype phrases, crowd chants, live MC moments")
      setTranscript(result)
      toast({
        title: "Success",
        description: `Transcribed ${result.duration.toFixed(1)}s of audio`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to transcribe audio",
        variant: "destructive",
      })
    } finally {
      setTranscribing(false)
    }
  }

  const handleCopyText = () => {
    if (transcript?.text) {
      navigator.clipboard.writeText(transcript.text)
      toast({
        title: "Copied",
        description: "Transcript copied to clipboard",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mic className="w-5 h-5 text-purple-500" />
          <span>Audio Transcription</span>
        </CardTitle>
        <CardDescription>Transcribe mic input, crowd chants, and live MC moments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            {file ? `Selected: ${file.name}` : "Select Audio File"}
          </Button>
        </div>

        {audioUrl && (
          <div className="p-3 bg-black/50 rounded-lg border border-white/10">
            <div className="flex items-center space-x-2 mb-2">
              <FileAudio className="w-4 h-4 text-cyan-500" />
              <span className="text-sm font-semibold">Audio Preview</span>
            </div>
            <audio controls className="w-full">
              <source src={audioUrl} type={file?.type || "audio/mpeg"} />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        <Button
          variant="neon"
          className="w-full"
          onClick={handleTranscribe}
          disabled={transcribing || !file}
        >
          {transcribing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Transcribing...
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              Transcribe Audio
            </>
          )}
        </Button>

        {transcript && (
          <div className="space-y-3">
            <div className="p-4 bg-black/50 rounded-lg border border-purple-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-400">
                  Language: <span className="text-white">{transcript.language}</span>
                </div>
                <div className="text-sm text-gray-400">
                  Duration: <span className="text-white">{transcript.duration.toFixed(1)}s</span>
                </div>
              </div>
              <p className="text-sm text-purple-300 whitespace-pre-wrap mb-3">
                {transcript.text}
              </p>
              {transcript.segments && transcript.segments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="text-xs text-gray-400 mb-2">Segments:</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {transcript.segments.map((seg, idx) => (
                      <div key={idx} className="text-xs text-gray-500">
                        [{seg.start?.toFixed(1)}s - {seg.end?.toFixed(1)}s] {seg.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyText}
                className="flex-1"
              >
                Copy Text
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const blob = new Blob([transcript.text], { type: "text/plain" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = "transcript.txt"
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="flex-1"
              >
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}





