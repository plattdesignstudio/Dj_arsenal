"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut, Music, Crown } from "lucide-react"
import { spotifyAuthApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface SpotifyAuthState {
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
  userProfile: {
    displayName: string | null
    email: string | null
    isPremium: boolean
    product: string | null
    imageUrl: string | null
  } | null
}

export function SpotifyLogin() {
  const [authState, setAuthState] = useState<SpotifyAuthState>({
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    userProfile: null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Load auth state from localStorage
    const stored = localStorage.getItem("spotify_auth")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Check if token is still valid
        if (parsed.expiresAt && parsed.expiresAt > Date.now()) {
          setAuthState(parsed)
        } else if (parsed.refreshToken) {
          // Token expired, try to refresh
          refreshAccessToken(parsed.refreshToken)
        }
      } catch (error) {
        console.error("Failed to load Spotify auth:", error)
      }
    }

    // Check for tokens or error in URL (from backend redirect after OAuth)
    const urlParams = new URLSearchParams(window.location.search)
    const accessToken = urlParams.get("access_token")
    const refreshToken = urlParams.get("refresh_token")
    const expiresIn = urlParams.get("expires_in")
    const error = urlParams.get("error")
    
    if (error) {
      toast({
        title: "Authentication Error",
        description: "Failed to connect to Spotify. Please try again.",
        variant: "destructive",
      })
      window.history.replaceState({}, "", window.location.pathname)
    } else if (accessToken && refreshToken && expiresIn) {
      // Tokens from backend redirect
      const expiresAt = Date.now() + (parseInt(expiresIn) * 1000)
      const newAuthState = {
        accessToken,
        refreshToken,
        expiresAt,
        userProfile: null,
      }
      setAuthState(newAuthState)
      localStorage.setItem("spotify_auth", JSON.stringify(newAuthState))
      
      // Load user profile to check Premium status
      loadUserProfile(accessToken)
      
      toast({
        title: "Success",
        description: "Successfully connected to Spotify! Loading profile...",
      })
      window.history.replaceState({}, "", window.location.pathname)
    }

    // Listen for callback events from page component (for code-based flow)
    const handleCallbackEvent = (event: CustomEvent<{ code: string }>) => {
      handleCallback(event.detail.code)
    }
    window.addEventListener("spotify-callback", handleCallbackEvent as EventListener)
    
    return () => {
      window.removeEventListener("spotify-callback", handleCallbackEvent as EventListener)
    }
  }, [])

  const handleLogin = () => {
    setIsLoading(true)
    // Redirect to backend auth endpoint which redirects to Spotify
    window.location.href = spotifyAuthApi.getAuthUrl()
  }

  const handleCallback = async (code: string) => {
    setIsLoading(true)
    try {
      const response = await spotifyAuthApi.handleCallback(code)
      const expiresAt = Date.now() + (response.expires_in * 1000)
      
      const newAuthState = {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresAt,
      }
      
      setAuthState(newAuthState)
      localStorage.setItem("spotify_auth", JSON.stringify(newAuthState))
      
      toast({
        title: "Success",
        description: "Successfully connected to Spotify! Full playback enabled.",
      })
    } catch (error) {
      console.error("Failed to authenticate:", error)
      toast({
        title: "Error",
        description: "Failed to connect to Spotify",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserProfile = async (accessToken: string) => {
    setIsLoadingProfile(true)
    try {
      const profile = await spotifyAuthApi.getUserProfile(accessToken)
      const premiumStatus = await spotifyAuthApi.checkPremium(accessToken)
      
      setAuthState((prev) => ({
        ...prev,
        userProfile: {
          displayName: profile.display_name,
          email: profile.email,
          isPremium: premiumStatus.is_premium,
          product: profile.product,
          imageUrl: profile.images?.[0]?.url || null,
        },
      }))
      
      // Update localStorage
      const stored = localStorage.getItem("spotify_auth")
      if (stored) {
        const parsed = JSON.parse(stored)
        parsed.userProfile = {
          displayName: profile.display_name,
          email: profile.email,
          isPremium: premiumStatus.is_premium,
          product: profile.product,
          imageUrl: profile.images?.[0]?.url || null,
        }
        localStorage.setItem("spotify_auth", JSON.stringify(parsed))
      }
      
      if (premiumStatus.is_premium) {
        toast({
          title: "Premium Account",
          description: "Full playback enabled! You can play complete tracks.",
        })
      } else {
        toast({
          title: "Free Account",
          description: "Upgrade to Premium for full track playback.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Failed to load user profile:", error)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const refreshAccessToken = async (refreshToken: string) => {
    try {
      const response = await spotifyAuthApi.refreshToken(refreshToken)
      const expiresAt = Date.now() + (response.expires_in * 1000)
      
      const newAuthState = {
        accessToken: response.access_token,
        refreshToken: response.refresh_token || refreshToken,
        expiresAt,
        userProfile: authState.userProfile, // Keep existing profile
      }
      
      setAuthState(newAuthState)
      localStorage.setItem("spotify_auth", JSON.stringify(newAuthState))
      
      // Reload profile if we have a new token
      if (response.access_token) {
        loadUserProfile(response.access_token)
      }
    } catch (error) {
      console.error("Failed to refresh token:", error)
      handleLogout()
    }
  }

  const handleLogout = () => {
    setAuthState({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      userProfile: null,
    })
    localStorage.removeItem("spotify_auth")
    toast({
      title: "Logged out",
      description: "Disconnected from Spotify",
    })
  }

  // Expose auth state via custom event for other components
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("spotify-auth-change", {
        detail: authState,
      })
    )
  }, [authState])

  if (authState.accessToken) {
    const isPremium = authState.userProfile?.isPremium ?? false
    const displayName = authState.userProfile?.displayName || "Spotify User"
    
    return (
      <div className="flex items-center gap-2">
        {isLoadingProfile ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/50">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-xs text-blue-400 font-medium">Loading...</span>
          </div>
        ) : (
          <>
            {authState.userProfile?.imageUrl && (
              <img
                src={authState.userProfile.imageUrl}
                alt={displayName}
                className="w-6 h-6 rounded-full"
              />
            )}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
              isPremium 
                ? "bg-green-500/20 border-green-500/50" 
                : "bg-yellow-500/20 border-yellow-500/50"
            }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                isPremium ? "bg-green-400" : "bg-yellow-400"
              }`} />
              <span className={`text-xs font-medium ${
                isPremium ? "text-green-400" : "text-yellow-400"
              }`}>
                {isPremium ? "Premium" : "Free"} • {displayName}
              </span>
            </div>
          </>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Disconnect</span>
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="neon"
      size="sm"
      onClick={handleLogin}
      disabled={isLoading}
      className="gap-2 bg-green-500 hover:bg-green-600 text-white border-green-400"
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <Music className="w-4 h-4" />
          <span>Sign in to Spotify Premium</span>
        </>
      )}
    </Button>
  )
}

// Hook to get current Spotify auth state
export function useSpotifyAuth() {
  const [authState, setAuthState] = useState<SpotifyAuthState>({
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    userProfile: null,
  })

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem("spotify_auth")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.expiresAt && parsed.expiresAt > Date.now()) {
          setAuthState(parsed)
        }
      } catch (error) {
        console.error("Failed to load Spotify auth:", error)
      }
    }

    // Listen for auth changes
    const handleAuthChange = (event: CustomEvent<SpotifyAuthState>) => {
      setAuthState(event.detail)
    }

    window.addEventListener("spotify-auth-change", handleAuthChange as EventListener)
    return () => {
      window.removeEventListener("spotify-auth-change", handleAuthChange as EventListener)
    }
  }, [])

  return authState
}

