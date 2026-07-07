import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, GitCompareArrows, AlertTriangle, TrendingUp, Activity, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScoreGauge } from "@/components/ScoreGauge";
import { MiniRadar } from "@/components/dashboard/MiniRadar";
import { getScoreColor } from "@/components/ScoreGauge";
import { Progress } from "@/components/ui/progress";
import { useCompletedReports } from "@/hooks/useReport";
import { SCORE_LABELS } from "@/lib/scoreLabels";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

interface CandidateReport {
  id: string;
  candidate: string;
  position: string;
  date: string;
  duration: string;
  interviewer: string;
  overall: number;
  speech: number;
  timing: number;
  flow: number;
  linguistic: number;
  engagement: number;
  confidence: number;
  flags: { time: string; pattern: string; severity: "low" | "medium" | "high" }[];
  notes: string;
  timeline: { min: string; score: number }[];
  responseDelays: { question: string; delay: number; label: string }[];
}

const severityDot = (s: string) =>
  s === "high" ? "bg-destructive" : s === "medium" ? "bg-warning" : "bg-muted-foreground";
const severityBg = (s: string) =>
  s === "high" ? "bg-destructive/10 border-destructive/20" : s === "medium" ? "bg-warning/10 border-warning/20" : "bg-muted/50 border-border";

const DimensionBar = ({ label, a, b, max, nameA, nameB }: {
  label: string; a: number; b: number; max: number; nameA: string; nameB: string;
}) => {
  const pctA = (a / max) * 100;
  const pctB = (b / max) * 100;
  const diff = a - b;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">
          <span className="font-bold">{a}</span>
          <span className="text-muted-foreground mx-1">vs</span>
          <span className="font-bold">{b}</span>
          <span className="text-muted-foreground">/{max}</span>
          {diff !== 0 && (
            <span className={`ml-1.5 ${diff > 0 ? "text-success" : "text-destructive"}`}>
              ({diff > 0 ? "+" : ""}{diff})
            </span>
          )}
        </span>
      </div>
      <div className="flex gap-1 h-2">
        <div className="flex-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${pctA}%` }}
          />
        </div>
        <div className="flex-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[hsl(160,84%,39%)] transition-all duration-500"
            style={{ width: `${pctB}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const Compare = () => {
  const { data: dbReports, isLoading } = useCompletedReports();

  const { reportMap, reportList } = useMemo(() => {
    if (dbReports && dbReports.length > 0) {
      const map: Record<string, CandidateReport> = {};
      const list: { id: string; candidate: string; position: string; overall: number }[] = [];
      dbReports.forEach((r: any) => {
        if (!r) return;
        map[r.id] = {
          id: r.id,
          candidate: r.candidate,
          position: r.position,
          date: r.date,
          duration: r.duration,
          interviewer: "",
          overall: r.overall,
          speech: r.speech,
          timing: r.timing,
          flow: r.flow,
          linguistic: r.linguistic,
          engagement: r.engagement ?? 0,
          confidence: r.confidence ?? 0,
          flags: r.flags ?? [],
          notes: "",
          timeline: r.timeline ?? [],
          responseDelays: r.responseDelays ?? [],
        };
        list.push({ id: r.id, candidate: r.candidate, position: r.position, overall: r.overall });
      });
      return { reportMap: map, reportList: list };
    }
    return { reportMap: {} as Record<string, CandidateReport>, reportList: [] };
  }, [dbReports]);

  const ids = Object.keys(reportMap);
  const [leftId, setLeftId] = useState<string>(ids[0] || "1");
  const [rightId, setRightId] = useState<string>(ids[1] || "2");

  const left = reportMap[leftId];
  const right = reportMap[rightId];

  const radarData = left && right ? [
    { subject: SCORE_LABELS.speech, A: (left.speech / 25) * 100, B: (right.speech / 25) * 100 },
    { subject: SCORE_LABELS.timing, A: (left.timing / 25) * 100, B: (right.timing / 25) * 100 },
    { subject: SCORE_LABELS.flow, A: (left.flow / 25) * 100, B: (right.flow / 25) * 100 },
    { subject: SCORE_LABELS.linguistic, A: (left.linguistic / 25) * 100, B: (right.linguistic / 25) * 100 },
    { subject: "Engage", A: left.engagement, B: right.engagement },
    { subject: "Confid.", A: left.confidence, B: right.confidence },
  ] : [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <GitCompareArrows className="h-6 w-6 text-primary" />
            Compare Candidates
          </h1>
          <p className="text-muted-foreground text-sm mb-6">Side-by-side authenticity analysis</p>
        </motion.div>

        {/* Candidate Cards + Selectors */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-start mb-8"
        >
          {/* Candidate A */}
          <div className="glass-card rounded-xl p-5">
            <Select value={leftId} onValueChange={setLeftId}>
              <SelectTrigger className="mb-4"><SelectValue /></SelectTrigger>
              <SelectContent>
                {reportList.map((c) => (
                  <SelectItem key={c.id} value={c.id} disabled={c.id === rightId}>
                    {c.candidate} &mdash; {c.position} ({c.overall})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {left && (
              <div className="flex items-center gap-4">
                <MiniRadar
                  speech={left.speech} timing={left.timing}
                  flow={left.flow} linguistic={left.linguistic}
                  overall={left.overall} size={80}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{left.candidate}</h3>
                  <p className="text-sm text-muted-foreground truncate">{left.position}</p>
                  <p className="text-xs text-muted-foreground mt-1">{left.date}</p>
                </div>
                <span className={`text-3xl font-bold tabular-nums ${getScoreColor(left.overall)}`}>
                  {left.overall}
                </span>
              </div>
            )}
          </div>

          {/* VS divider */}
          <div className="hidden md:flex items-center justify-center self-center">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
              VS
            </div>
          </div>

          {/* Candidate B */}
          <div className="glass-card rounded-xl p-5">
            <Select value={rightId} onValueChange={setRightId}>
              <SelectTrigger className="mb-4"><SelectValue /></SelectTrigger>
              <SelectContent>
                {reportList.map((c) => (
                  <SelectItem key={c.id} value={c.id} disabled={c.id === leftId}>
                    {c.candidate} &mdash; {c.position} ({c.overall})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {right && (
              <div className="flex items-center gap-4">
                <MiniRadar
                  speech={right.speech} timing={right.timing}
                  flow={right.flow} linguistic={right.linguistic}
                  overall={right.overall} size={80}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{right.candidate}</h3>
                  <p className="text-sm text-muted-foreground truncate">{right.position}</p>
                  <p className="text-xs text-muted-foreground mt-1">{right.date}</p>
                </div>
                <span className={`text-3xl font-bold tabular-nums ${getScoreColor(right.overall)}`}>
                  {right.overall}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {left && right && (
          <>
            {/* Dimension Comparison + Overlaid Radar */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              {/* Dimension bars */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="glass-card rounded-xl p-6"
              >
                <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Dimension Comparison
                </h3>
                <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-3 rounded-sm bg-primary" />{left.candidate}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-3 rounded-sm bg-[hsl(160,84%,39%)]" />{right.candidate}
                  </span>
                </div>
                <div className="space-y-4">
                  <DimensionBar label={SCORE_LABELS.speech} a={left.speech} b={right.speech} max={25} nameA={left.candidate} nameB={right.candidate} />
                  <DimensionBar label={SCORE_LABELS.timing} a={left.timing} b={right.timing} max={25} nameA={left.candidate} nameB={right.candidate} />
                  <DimensionBar label={SCORE_LABELS.flow} a={left.flow} b={right.flow} max={25} nameA={left.candidate} nameB={right.candidate} />
                  <DimensionBar label={SCORE_LABELS.linguistic} a={left.linguistic} b={right.linguistic} max={25} nameA={left.candidate} nameB={right.candidate} />
                  <div className="pt-3 border-t border-border space-y-4">
                    <DimensionBar label="Engagement" a={left.engagement} b={right.engagement} max={100} nameA={left.candidate} nameB={right.candidate} />
                    <DimensionBar label="Confidence" a={left.confidence} b={right.confidence} max={100} nameA={left.candidate} nameB={right.candidate} />
                  </div>
                </div>
              </motion.div>

              {/* Overlaid Radar */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="glass-card rounded-xl p-6"
              >
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  Authenticity Profile Overlay
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                    <PolarGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name={left.candidate} dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                    <Radar name={right.candidate} dataKey="B" stroke="hsl(160, 84%, 39%)" fill="hsl(160, 84%, 39%)" fillOpacity={0.15} strokeWidth={2} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Flags Comparison */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="grid md:grid-cols-2 gap-6 mb-6"
            >
              {[
                { report: left, color: "primary" },
                { report: right, color: "success" },
              ].map(({ report, color }) => (
                <div key={report.id} className="glass-card rounded-xl p-5">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    {report.candidate} &mdash; Flags ({report.flags.length})
                  </h4>
                  {report.flags.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No flags detected</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {report.flags.map((f, i) => (
                        <div key={i} className={`text-xs p-2.5 rounded-lg border ${severityBg(f.severity)}`}>
                          <div className="flex items-start gap-2">
                            <span className={`h-2 w-2 rounded-full flex-shrink-0 mt-1 ${severityDot(f.severity)}`} />
                            <div>
                              <p className="leading-relaxed">{f.pattern}</p>
                              <p className="text-muted-foreground mt-0.5 font-mono">{f.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </motion.div>

            {/* Quick Summary */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="glass-card rounded-xl p-6 mb-8"
            >
              <h3 className="text-sm font-semibold mb-4">Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="py-2 pr-4 font-medium">Metric</th>
                      <th className="py-2 px-4 font-medium">{left.candidate}</th>
                      <th className="py-2 px-4 font-medium">{right.candidate}</th>
                      <th className="py-2 pl-4 font-medium">Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "Overall Score", a: left.overall, b: right.overall, suffix: "/100" },
                      { label: "Total Flags", a: left.flags.length, b: right.flags.length, suffix: "", inverted: true },
                      { label: "High Severity Flags", a: left.flags.filter((f) => f.severity === "high").length, b: right.flags.filter((f) => f.severity === "high").length, suffix: "", inverted: true },
                    ].map((row, i) => {
                      const diff = row.a - row.b;
                      const better = row.inverted ? diff < 0 : diff > 0;
                      const worse = row.inverted ? diff > 0 : diff < 0;
                      return (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-3 pr-4 text-muted-foreground">{row.label}</td>
                          <td className="py-3 px-4 font-medium tabular-nums">{row.a}{row.suffix}</td>
                          <td className="py-3 px-4 font-medium tabular-nums">{row.b}{row.suffix}</td>
                          <td className="py-3 pl-4 tabular-nums">
                            <span className={better ? "text-success" : worse ? "text-destructive" : "text-muted-foreground"}>
                              {diff > 0 ? "+" : ""}{diff}{row.suffix}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="border-b border-border/50">
                      <td className="py-3 pr-4 text-muted-foreground">Duration</td>
                      <td className="py-3 px-4 font-medium">{left.duration}</td>
                      <td className="py-3 px-4 font-medium">{right.duration}</td>
                      <td className="py-3 pl-4 text-muted-foreground">&mdash;</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* View full reports */}
              <div className="flex gap-3 mt-6">
                <Link to={`/report/${left.id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    {left.candidate} Report <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
                <Link to={`/report/${right.id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    {right.candidate} Report <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default Compare;
