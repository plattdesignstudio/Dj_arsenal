"use client"

import { DJTurntable } from "@/components/dj/DJTurntable"
import { useEffect } from "react"
import { usePathname } from "next/navigation"

export default function TurntablePage() {
  const pathname = usePathname()
  
  // Prevent Next.js from trying to scroll on this fullscreen page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Disable scroll restoration for this page
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual'
      }
      
      // Scroll to top on mount to prevent any scroll issues
      window.scrollTo(0, 0)
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
      
      return () => {
        // Re-enable body scroll when leaving
        document.body.style.overflow = 'unset'
      }
    }
  }, [pathname])

  // Handle Spotify callback - tokens or code in URL will be handled by SpotifyLogin component
  // This effect just ensures the component is aware of URL changes

  return (
    <div id="turntable-page" data-nextjs-scroll-focus-boundary>
      <DJTurntable />
    </div>
  )
}

