"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { visualsApi, type VisualGenerationRequest } from "@/lib/api"
import { Image as ImageIcon, Download, Loader2, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface VisualGeneratorProps {
  defaultStyle?: "club" | "festival" | "underground" | "corporate"
}

export function VisualGenerator({ defaultStyle = "club" }: VisualGeneratorProps) {
  const [prompt, setPrompt] = useState("")
  const [style, setStyle] = useState<"club" | "festival" | "underground" | "corporate">(defaultStyle)
  const [size, setSize] = useState<"1024x1024" | "1792x1024" | "1024x1792">("1024x1024")
  const [quality, setQuality] = useState<"standard" | "hd">("hd")
  const [generating, setGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive",
      })
      return
    }

    setGenerating(true)
    try {
      const request: VisualGenerationRequest = {
        prompt,
        style,
        size,
        quality,
      }

      const result = await visualsApi.generate(request)
      setGeneratedImage(result.image_url)
      toast({
        title: "Success",
        description: "Visual generated successfully!",
      })
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

  const handleQuickGenerate = async (type: "logo" | "poster") => {
    if (type === "logo") {
      const result = await visualsApi.generateLogo("DJ Arsenal", style)
      setGeneratedImage(result.image_url)
    } else {
      const result = await visualsApi.generatePoster(
        "Summer Festival 2024",
        "July 15, 2024",
        "Central Park",
        style
      )
      setGeneratedImage(result.image_url)
    }
    toast({
      title: "Success",
      description: `${type === "logo" ? "Logo" : "Poster"} generated!`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ImageIcon className="w-5 h-5 text-cyan-500" />
          <span>Visual Generator</span>
        </CardTitle>
        <CardDescription>Generate DJ logos, posters, and branding</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the visual you want to create..."
            className="w-full h-24 px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Style</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as any)}
              className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="club">Club</option>
              <option value="festival">Festival</option>
              <option value="underground">Underground</option>
              <option value="corporate">Corporate</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Size</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value as any)}
              className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="1024x1024">Square (1024x1024)</option>
              <option value="1792x1024">Wide (1792x1024)</option>
              <option value="1024x1792">Tall (1024x1792)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-2 block">Quality</label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value as any)}
            className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="standard">Standard</option>
            <option value="hd">HD</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickGenerate("logo")}
            disabled={generating}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Quick Logo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickGenerate("poster")}
            disabled={generating}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Quick Poster
          </Button>
        </div>

        <Button
          variant="neon"
          className="w-full"
          onClick={handleGenerate}
          disabled={generating || !prompt.trim()}
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <ImageIcon className="w-4 h-4 mr-2" />
              Generate Visual
            </>
          )}
        </Button>

        {generatedImage && (
          <div className="mt-4 space-y-2">
            <img
              src={generatedImage}
              alt="Generated visual"
              className="w-full rounded-lg border border-cyan-500/30"
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.open(generatedImage, "_blank")}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Image
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}





