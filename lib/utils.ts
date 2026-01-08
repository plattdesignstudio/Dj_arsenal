import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function formatBPM(bpm: number | null | undefined): string {
  if (!bpm) return "—"
  return Math.round(bpm).toString()
}

export function getEnergyColor(energy: number | null | undefined): string {
  if (!energy) return "text-gray-500"
  if (energy >= 0.8) return "text-red-500"
  if (energy >= 0.6) return "text-orange-500"
  if (energy >= 0.4) return "text-yellow-500"
  return "text-green-500"
}

export function getEnergyLabel(energy: number | null | undefined): string {
  if (!energy) return "Unknown"
  if (energy >= 0.8) return "Peak"
  if (energy >= 0.6) return "High"
  if (energy >= 0.4) return "Medium"
  return "Low"
}






