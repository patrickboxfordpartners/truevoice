import { useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Download, Share2, Calendar, AlertTriangle, Clock,
  Lightbulb, TrendingUp, BarChart3, Activity, Loader2, Eye, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreGauge } from "@/components/ScoreGauge";
import { MiniRadar } from "@/components/dashboard/MiniRadar";
import { Progress } from "@/components/ui/progress";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Cell, ReferenceLine, ReferenceDot,
} from "recharts";
import { useReport } from "@/hooks/useReport";
import { getScoreColor } from "@/components/ScoreGauge";
import { usePanelists } from "@/hooks/usePanelists";

const getDelayColor = (delay: number) => {
  if (delay < 1.5) return "hsl(0, 84%, 60%)";
  if (delay > 4) return "hsl(38, 92%, 50%)";
  return "hsl(160, 84%, 39%)";
};

const severityColor = (s: string) =>
  s === "high" ? "text-destructive" : s === "medium" ? "text-warning" : "text-muted-foreground";
const severityBg = (s: string) =>
  s === "high" ? "bg-destructive/10 border-destructive/20" : s === "medium" ? "bg-warning/10 border-warning/20" : "bg-muted/30 border-border";
const severityIcon = (s: string) =>
  s === "high" ? "bg-destructive" : s === "medium" ? "bg-warning" : "bg-muted-foreground";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg px-3 py-2 text-sm shadow-lg border border-border">
        <p className="font-medium">Minute {label}</p>
        <p className="text-primary">Score: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const Report = () => {
  const { id } = useParams();
  const { data, isLoading, error } = useReport(id);
  const [hoveredFlag, setHoveredFlag] = useState<number | null>(null);
  const { data: panelists = [] } = usePanelists(data?.interview?.id);

  const flags = data?.flags ?? [];
  const flagsByMinute = useMemo(() => {
    const map = new Map<number, typeof flags>();
    for (const flag of flags) {
      const parts = flag.time?.split(":") ?? [];
      const min = parts.length >= 2 ? parseInt(parts[0], 10) : 0;
      const existing = map.get(min) ?? [];
      existing.push(flag);
      map.set(min, existing);
    }
    return map;
  }, [flags]);

  const flagMinutes = useMemo(() => Array.from(flagsByMinute.keys()), [flagsByMinute]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data || !data.report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Report not found or not yet generated.</p>
        <Link to="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const { interview, report, timeline, responseDelays, interviewer } = data;
  const isPanelInterview = (report.panelist_count ?? 1) > 1;

  const timelineData = timeline.map((t) => ({
    min: t.minute,
    score: t.score,
  }));

  const delayData = responseDelays.map((d) => ({
    question: d.question,
    delay: d.delay,
    label: d.label,
  }));

  const dateStr = interview.scheduled_at
    ? new Date(interview.scheduled_at).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
      })
    : "";

  const highFlags = flags.filter((f) => f.severity === "high").length;
  const medFlags = flags.filter((f) => f.severity === "medium").length;
  const lowFlags = flags.filter((f) => f.severity === "low").length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <Link to="/dashboard" className="no-print inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Compact Header: Candidate info + Score + Radar in one row */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Left: Candidate info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-2xl font-bold">{interview.candidate_name}</h1>
                {isPanelInterview && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    <Users className="h-3 w-3" />
                    Panel Interview
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">{interview.position}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                {dateStr && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{dateStr}</span>}
                {interview.duration && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{interview.duration}</span>}
                {interviewer && <span>Interviewer: {interviewer.full_name}</span>}
              </div>
              {report.summary && (
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-xl">{report.summary}</p>
              )}
            </div>

            {/* Center: Score + Radar */}
            <div className="flex items-center gap-6">
              <ScoreGauge score={report.overall_score} size={100} strokeWidth={8} />
              <MiniRadar
                speech={report.speech_score}
                timing={report.timing_score}
                flow={report.flow_score}
                linguistic={report.linguistic_score}
                overall={report.overall_score}
                size={100}
              />
            </div>

            {/* Right: Actions */}
            <div className="flex lg:flex-col gap-2 no-print">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => window.print()}
              >
                <Download className="h-3.5 w-3.5" />PDF
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5"><Share2 className="h-3.5 w-3.5" />Share</Button>
              {interview.candidate_id && (
                <Link to={`/candidates/${interview.candidate_id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5 w-full">
                    <Eye className="h-3.5 w-3.5" />History
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </motion.div>

        {/* HERO: Interview Timeline with Flag Markers */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              Interview Timeline
            </h2>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {highFlags > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-destructive" />{highFlags} high
                </span>
              )}
              {medFlags > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-warning" />{medFlags} medium
                </span>
              )}
              {lowFlags > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground" />{lowFlags} low
                </span>
              )}
            </div>
          </div>

          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={timelineData} margin={{ top: 20, right: 10, bottom: 10, left: 10 }}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="min"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: "Minutes", position: "insideBottomRight", offset: -5, fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="score"
                  name="Score"
                  stroke="hsl(var(--primary))"
                  fill="url(#scoreGradient)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                />
                {/* Flag markers on the timeline */}
                {flagMinutes.map((min) => {
                  const flagsAtMin = flagsByMinute.get(min) ?? [];
                  const worst = flagsAtMin.some((f) => f.severity === "high")
                    ? "high"
                    : flagsAtMin.some((f) => f.severity === "medium")
                      ? "medium"
                      : "low";
                  const color = worst === "high" ? "hsl(0, 84%, 60%)" : worst === "medium" ? "hsl(38, 92%, 50%)" : "hsl(var(--muted-foreground))";
                  const timelinePoint = timelineData.find((t) => t.min === min);
                  const score = timelinePoint?.score ?? 50;

                  return (
                    <ReferenceDot
                      key={min}
                      x={min}
                      y={score}
                      r={6}
                      fill={color}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                      onMouseEnter={() => setHoveredFlag(min)}
                      onMouseLeave={() => setHoveredFlag(null)}
                      style={{ cursor: "pointer" }}
                    />
                  );
                })}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
              No timeline data available.
            </div>
          )}

          {/* Flag detail on hover */}
          {hoveredFlag !== null && flagsByMinute.has(hoveredFlag) && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 rounded-lg bg-muted/30 border border-border"
            >
              <p className="text-xs font-medium text-muted-foreground mb-2">Flags at minute {hoveredFlag}:</p>
              <div className="space-y-1.5">
                {(flagsByMinute.get(hoveredFlag) ?? []).map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${severityIcon(f.severity)}`} />
                    <span>{f.pattern}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Two-column: Flags list + Score breakdown */}
        <div className="grid lg:grid-cols-[1fr_1fr] gap-6 mb-6">
          {/* Detected Patterns, chronological */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Detected Patterns
            </h2>
            {flags.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {flags.map((flag) => (
                  <div
                    key={flag.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${severityBg(flag.severity)} transition-colors`}
                  >
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 mt-1.5 ${severityIcon(flag.severity)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed">{flag.pattern}</p>
                      <p className="text-xs text-muted-foreground mt-1">{flag.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No significant patterns detected.</p>
            )}
          </motion.div>

          {/* Score Breakdown, compact */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              Score Breakdown
            </h2>
            <div className="space-y-4">
              {[
                { label: "Speech Patterns", score: report.speech_score, desc: "Natural cadence vs. scripted delivery" },
                { label: "Response Timing", score: report.timing_score, desc: "Natural thinking pauses vs. instant recall" },
                { label: "Conversational Flow", score: report.flow_score, desc: "Engaged dialogue vs. monologue" },
                { label: "Linguistic Authenticity", score: report.linguistic_score, desc: "Spoken language vs. written/formal" },
              ].map((dim) => (
                <div key={dim.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{dim.label}</span>
                    <span className={`text-sm font-bold tabular-nums ${getScoreColor(dim.score * 4)}`}>
                      {dim.score}/25
                    </span>
                  </div>
                  <Progress value={(dim.score / 25) * 100} className="h-2 mb-1" />
                  <p className="text-xs text-muted-foreground">{dim.desc}</p>
                </div>
              ))}

              {/* Engagement & Confidence */}
              <div className="pt-3 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Engagement</span>
                  <span className={`text-sm font-bold tabular-nums ${getScoreColor(report.engagement)}`}>
                    {report.engagement}/100
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Confidence</span>
                  <span className={`text-sm font-bold tabular-nums ${getScoreColor(report.confidence)}`}>
                    {report.confidence}/100
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Response Timing Chart */}
        {delayData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card rounded-xl p-6 mb-6">
            <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Response Delay Per Question
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              <span className="inline-block h-2 w-2 rounded-full bg-success mr-1" />Natural (1.5-4s)
              <span className="inline-block h-2 w-2 rounded-full bg-destructive mr-1 ml-3" />Too fast (&lt;1.5s)
              <span className="inline-block h-2 w-2 rounded-full bg-warning mr-1 ml-3" />Slow (&gt;4s)
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={delayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="question" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis unit="s" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const d = delayData.find((dd) => dd.question === payload[0]?.payload?.question);
                      return (
                        <div className="glass-card rounded-lg px-3 py-2 text-sm shadow-lg border border-border">
                          <p className="font-medium">{d?.label}</p>
                          <p className="text-primary">{payload[0].value}s response time</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="delay" radius={[4, 4, 0, 0]}>
                  {delayData.map((entry, index) => (
                    <Cell key={index} fill={getDelayColor(entry.delay)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Notes */}
        {interview.notes && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">Interview Notes</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{interview.notes}</p>
          </motion.div>
        )}

        {/* Recommendations */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Suggested Next Steps
          </h2>
          {report.recommendations && report.recommendations.length > 0 ? (
            <ul className="space-y-2">
              {report.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-success mt-0.5">&#10003;</span> {rec}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-2">
              <li className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-success">&#10003;</span> Review the full transcript for context
              </li>
              <li className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-success">&#10003;</span> Compare with other candidates using the Compare tool
              </li>
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-6 no-print">
            <Button className="gap-2"><Calendar className="h-4 w-4" />Schedule Follow-Up</Button>
            {interview.candidate_id && (
              <Link
                to={`/candidates/${interview.candidate_id}`}
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                View {interview.candidate_name}&apos;s full interview history &#8594;
              </Link>
            )}
          </div>
        </motion.div>

        {/* Panel Notes */}
        {panelists.length > 0 && panelists.some((p) => p.notes) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              Panel Notes
            </h2>
            <div className="space-y-4">
              {panelists
                .filter((p) => p.notes)
                .map((p) => {
                  const name = p.profile.full_name ?? p.profile.email;
                  const initials = name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <div key={p.id} className="flex gap-3">
                      {p.profile.avatar_url ? (
                        <img
                          src={p.profile.avatar_url}
                          alt={initials}
                          className="h-8 w-8 rounded-full object-cover border border-border shrink-0 mt-0.5"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/10 border border-border flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-0.5">
                          {initials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-medium">{name}</span>
                          {p.score_override !== null && p.score_override !== undefined && (
                            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              Score: {p.score_override}/100
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{p.notes}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Report;
