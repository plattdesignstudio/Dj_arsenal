"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Music, Disc, Zap, Sparkles, TrendingUp, Radio, Mic } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/turntable", label: "Turntable", icon: Radio },
  { href: "/tracks", label: "Tracks", icon: Music },
  { href: "/trending", label: "Trending", icon: TrendingUp },
  { href: "/sets", label: "Sets", icon: Disc },
  { href: "/ai-studio", label: "AI Studio", icon: Sparkles },
  { href: "/ai-voice", label: "AI Voice", icon: Mic },
  { href: "/performance", label: "Performance", icon: Zap },
]

export function Navigation() {
  const pathname = usePathname()
  const isTurntable = pathname === "/turntable"

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 z-50",
        isTurntable && "z-[60]" // Ensure nav is above turntable (z-50)
      )}
      data-nextjs-scroll-focus-boundary="true"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-around py-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-colors",
                  isActive
                    ? "text-cyan-500"
                    : "text-gray-400 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}



