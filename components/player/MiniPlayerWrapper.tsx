"use client"

import { usePathname } from "next/navigation"
import { MiniPlayer } from "./MiniPlayer"

export function MiniPlayerWrapper() {
  const pathname = usePathname()
  
  // Only show mini player on tracks and trending pages
  const shouldShow = pathname === "/tracks" || pathname === "/trending"
  
  if (!shouldShow) {
    return null
  }
  
  return <MiniPlayer />
}

