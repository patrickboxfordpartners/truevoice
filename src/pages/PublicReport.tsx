// src/pages/PublicReport.tsx
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { motion } from "framer-motion"
import { Shield, Loader2, AlertTriangle } from "lucide-react"
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts"
import { ScoreGauge } from "@/components/ScoreGauge"
import { SCORE_LABELS } from "@/lib/scoreLabels"
import type { FullReport } from "@/types"

const ease = [0.16, 1, 0.3, 1]

const severityColor = (s: string) =>
  s === "high" ? "text-destructive" : s === "medium" ? "text-warning" : "text-muted-foreground"
const severityBg = (s: string) =>
  s === "high"
    ? "bg-destructive/10 border-destructive/20"
    : s === "medium"
    ? "bg-warning/10 border-warning/20"
    : "bg-muted/30 border-border"

const PublicReport = () => {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<FullReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    const fnUrl = `${supabaseUrl}/functions/v1/get-public-report?token=${encodeURIComponent(token)}`
    fetch(fnUrl, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          setError("This report link is invalid or has expired.")
        } else {
          setData(await res.json())
        }
      })
      .catch(() => setError("This report link is invalid or has expired."))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
          <h1 className="text-xl font-semibold mb-2">Link not found</h1>
          <p className="text-muted-foreground text-sm">{error ?? "This report link is invalid or has expired."}</p>
        </div>
      </div>
    )
  }

  const { interview, report, flags, timeline } = data

  const radarData = report ? [
    { subject: SCORE_LABELS.speech, value: ((report.speech_score ?? 0) / 25) * 100 },
    { subject: SCORE_LABELS.timing, value: ((report.timing_score ?? 0) / 25) * 100 },
    { subject: SCORE_LABELS.flow, value: ((report.flow_score ?? 0) / 25) * 100 },
    { subject: SCORE_LABELS.linguistic, value: ((report.linguistic_score ?? 0) / 25) * 100 },
  ] : []

  const timelineData = timeline.map((t) => ({ name: t.minute, score: t.score }))

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" strokeWidth={1.8} />
          <span className="font-semibold text-sm tracking-tight">TrueVoice HQ</span>
        </div>
        <span className="text-xs text-muted-foreground">Interview Report</span>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Candidate + score */}
        <motion.div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">{interview.candidate_name}</h1>
            <p className="text-muted-foreground mt-0.5">{interview.position}</p>
          </div>
          {report && (
            <ScoreGauge score={report.overall_score ?? 0} size={100} />
          )}
        </motion.div>

        {/* Summary */}
        {report?.summary && (
          <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-4">
            {report.summary}
          </p>
        )}

        {/* Radar + Timeline side by side */}
        {report && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card rounded-xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">Dimension Breakdown</p>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid className="stroke-border" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {timelineData.length > 0 && (
              <div className="glass-card rounded-xl p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">Score Over Time</p>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={timelineData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Behavioral signals */}
        {flags.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">{SCORE_LABELS.flags}</p>
            <div className="space-y-2">
              {flags.map((f, i) => (
                <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${severityBg(f.severity)}`}>
                  <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${f.severity === "high" ? "bg-destructive" : f.severity === "medium" ? "bg-warning" : "bg-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${severityColor(f.severity)}`}>{f.pattern}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">at {f.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {report?.recommendations && Array.isArray(report.recommendations) && report.recommendations.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Recommendations</p>
            <ul className="space-y-2">
              {report.recommendations.map((rec: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Powered by{" "}
            <a href="https://truevoicehq.com" className="text-primary hover:underline">TrueVoice HQ</a>
            {" "}· A Boxford Partners Company
          </p>
        </div>
      </main>
    </div>
  )
}

export default PublicReport
