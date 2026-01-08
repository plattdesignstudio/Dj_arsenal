"use client"

import Image from "next/image"
import { Music } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface AlbumArtProps {
  imageUrl?: string | null
  alt?: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  fallbackIcon?: boolean
}

const sizeClasses = {
  sm: "w-12 h-12",
  md: "w-24 h-24",
  lg: "w-32 h-32",
  xl: "w-48 h-48",
}

const iconSizes = {
  sm: "w-6 h-6",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
}

export function AlbumArt({
  imageUrl,
  alt = "Album cover",
  size = "md",
  className,
  fallbackIcon = true,
}: AlbumArtProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const hasImage = imageUrl && imageUrl.trim() !== "" && !imageError

  if (!imageUrl && !fallbackIcon) {
    return null
  }

  return (
    <div
      data-album-art={alt}
      className={cn(
        "relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 flex items-center justify-center",
        "shadow-2xl border border-white/10",
        "transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/20",
        sizeClasses[size],
        className
      )}
      style={{
        boxShadow: hasImage 
          ? '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 255, 255, 0.1)' 
          : '0 10px 40px rgba(0, 0, 0, 0.5)'
      }}
    >
      {hasImage && imageUrl ? (
        <>
          {!imageError ? (
            <Image
              src={imageUrl}
              alt={alt}
              fill
              className={cn(
                "object-cover transition-all duration-500 hover:scale-110",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              sizes="(max-width: 768px) 100px, (max-width: 1200px) 200px, 300px"
              unoptimized={true}
              priority={size === "xl" || size === "lg"}
              onError={() => {
                console.warn("Failed to load album art with Next.js Image:", imageUrl)
                setImageError(true)
                setImageLoaded(false)
              }}
              onLoad={() => {
                setImageLoaded(true)
                setImageError(false)
              }}
            />
          ) : (
            <img
              src={imageUrl}
              alt={alt}
              className={cn(
                "absolute inset-0 w-full h-full object-cover transition-all duration-500 hover:scale-110",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              onError={() => {
                console.warn("Failed to load album art with img tag:", imageUrl)
                setImageError(true)
                setImageLoaded(false)
              }}
              onLoad={() => {
                setImageLoaded(true)
                setImageError(false)
              }}
            />
          )}
          {/* Gradient overlay for depth */}
          {imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
          )}
        </>
      ) : null}
      {(!hasImage || (fallbackIcon && !imageLoaded)) && (
        <div 
          className="fallback-icon absolute inset-0 flex items-center justify-center text-gray-500 bg-gradient-to-br from-cyan-900/20 to-purple-900/20"
          style={{ display: imageLoaded && hasImage ? 'none' : 'flex' }}
        >
          <Music className={cn(iconSizes[size], "opacity-60")} />
        </div>
      )}
    </div>
  )
}

