import { difficultyColor, difficultyLabel } from "@/app/lib/difficulty"

export default function DifficultyCircle({
  score,
  size = 12,
}: {
  score: number | null | undefined
  size?: number
}) {
  const colorClass = difficultyColor(score)
  const label = difficultyLabel(score)
  const px = `${size}px`

  return (
    <div
      className={`inline-block rounded-full ${colorClass}`}
      style={{ width: px, height: px }}
      title={score == null ? label : `${label} (${score.toFixed(2)})`}
      aria-label={score == null ? label : `Difficulty ${score.toFixed(2)} out of 5`}
    />
  )
}