import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Navigation } from "@/components/navigation"
import { Providers } from "@/components/providers"
import { MiniPlayerWrapper } from "@/components/player/MiniPlayerWrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DJ Arsenal - AI-Augmented DJ Dashboard",
  description: "Professional DJ performance and creation platform",
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <div id="root-scroll-container">
            {children}
          </div>
          <MiniPlayerWrapper />
          <Navigation />
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}



