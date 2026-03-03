export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

// difficultyScore is 1..5 where 5 is easiest
export function difficultyColor(scoreRaw: number | null | undefined) {
  if (scoreRaw == null || Number.isNaN(scoreRaw)) return "bg-zinc-500"

  const score = clamp(scoreRaw, 1, 5)

  // IMPORTANT: match the exact mapping you use on the professor page.
  // If your professor mapping is different, edit these thresholds to match.
  if (score >= 4.5) return "bg-emerald-500"
  if (score >= 3.5) return "bg-lime-500"
  if (score >= 2.5) return "bg-yellow-500"
  if (score >= 1.5) return "bg-orange-500"
  return "bg-red-500"
}

export function difficultyLabel(scoreRaw: number | null | undefined) {
  if (scoreRaw == null || Number.isNaN(scoreRaw)) return "No data"
  const score = clamp(scoreRaw, 1, 5)

  if (score >= 4.5) return "Very easy"
  if (score >= 3.5) return "Easy"
  if (score >= 2.5) return "Medium"
  if (score >= 1.5) return "Hard"
  return "Very hard"
}