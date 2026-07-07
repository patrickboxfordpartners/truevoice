export const SCORE_LABELS = {
  speech: "Communication Quality",
  timing: "Thinking & Engagement",
  flow: "Interview Presence",
  linguistic: "Response Authenticity",
  overall: "Intelligence Score",
  flags: "Behavioral Signals",
} as const

export type ScoreDimension = keyof typeof SCORE_LABELS

/** Human-readable quality label for a 0-100 overall Intelligence Score. */
export function getGaugeLabel(score: number): string {
  if (score >= 75) return "Strong Signal"
  if (score >= 50) return "Mixed Signal"
  return "Weak Signal"
}
