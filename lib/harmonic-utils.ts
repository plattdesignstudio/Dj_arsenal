// Harmonic mixing utilities (client-side version of backend logic)

export function getCompatibleKeys(camelotKey: string) {
  if (!camelotKey || camelotKey.length < 2) {
    return { perfect: [], safe: [], risky: [] }
  }

  const number = parseInt(camelotKey.slice(0, -1))
  const mode = camelotKey.slice(-1)

  // Perfect matches
  const perfect = [camelotKey]
  const oppositeMode = mode === "A" ? "B" : "A"
  perfect.push(`${number}${oppositeMode}`)

  // Safe transitions (adjacent numbers)
  const safe: string[] = []
  const prevNum = number === 1 ? 12 : number - 1
  const nextNum = number === 12 ? 1 : number + 1
  safe.push(`${prevNum}${mode}`, `${nextNum}${mode}`)
  safe.push(`${prevNum}${oppositeMode}`, `${nextNum}${oppositeMode}`)

  // Risky transitions (+4/-4)
  const risky: string[] = []
  const risky1 = number - 4 < 1 ? number - 4 + 12 : number - 4
  const risky2 = number + 4 > 12 ? number + 4 - 12 : number + 4
  risky.push(`${risky1}${mode}`, `${risky1}${oppositeMode}`)
  risky.push(`${risky2}${mode}`, `${risky2}${oppositeMode}`)

  return { perfect, safe, risky }
}

export function getTransitionType(fromKey: string, toKey: string): string {
  if (!fromKey || !toKey) return "unknown"

  const compat = getCompatibleKeys(fromKey)

  if (compat.perfect.includes(toKey)) return "perfect"
  if (compat.safe.includes(toKey)) return "smooth"
  if (compat.risky.includes(toKey)) return "risky"
  return "clash"
}

export function calculateCompatibilityScore(fromKey: string, toKey: string): number {
  const transitionType = getTransitionType(fromKey, toKey)

  const scores: Record<string, number> = {
    perfect: 1.0,
    smooth: 0.8,
    risky: 0.5,
    clash: 0.2,
    unknown: 0.0,
  }

  return scores[transitionType] || 0.0
}






