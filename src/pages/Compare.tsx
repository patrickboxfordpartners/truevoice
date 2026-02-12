import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, GitCompareArrows, AlertTriangle, TrendingUp, Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScoreGauge } from "@/components/ScoreGauge";
import { Progress } from "@/components/ui/progress";
import { useCompletedReports } from "@/hooks/useReport";
import { candidateReports, candidateList, type CandidateReport } from "@/data/mockCandidates";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

const CompareColumn = ({ report, color }: { report: CandidateReport; color: string }) => {
  const categories = [
    { label: "Speech Patterns", score: report.speech, max: 25 },
    { label: "Response Timing", score: report.timing, max: 25 },
    { label: "Conversational Flow", score: report.flow, max: 25 },
    { label: "Linguistic Auth.", score: report.linguistic, max: 25 },
  ];

  return (
    <div className="flex-1 min-w-0">
      <div className="glass-card rounded-xl p-5 mb-4">
        <h3 className="font-bold text-lg truncate">{report.candidate}</h3>
        <p className="text-sm text-muted-foreground truncate">{report.position}</p>
        <p className="text-xs text-muted-foreground mt-1">{report.date}</p>
      </div>
      <div className="glass-card rounded-xl p-6 mb-4 flex flex-col items-center">
        <ScoreGauge score={report.overall} size={120} strokeWidth={8} />
      </div>
      <div className="glass-card rounded-xl p-5 mb-4 space-y-4">
        {categories.map(cat => (
          <div key={cat.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{cat.label}</span>
              <span className="text-xs font-bold">{cat.score}/{cat.max}</span>
            </div>
            <Progress value={(cat.score / cat.max) * 100} className="h-1.5" />
          </div>
        ))}
      </div>
      <div className="glass-card rounded-xl p-5">
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-warning" />
          Flags ({report.flags.length})
        </h4>
        {report.flags.length === 0 ? (
          <p className="text-xs text-muted-foreground">No flags detected</p>
        ) : (
          <div className="space-y-2">
            {report.flags.map((f, i) => (
              <div key={i} className="text-xs text-muted-foreground flex gap-2">
                <span className="font-mono shrink-0">{f.time}</span>
                <span className={f.severity === "high" ? "text-destructive" : f.severity === "medium" ? "text-warning" : ""}>{f.pattern}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Compare = () => {
  const { data: dbReports, isLoading } = useCompletedReports();

  // Build lookup from DB reports or fall back to mock data
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
    // Fallback to mock data
    return { reportMap: candidateReports, reportList: candidateList };
  }, [dbReports]);

  const ids = Object.keys(reportMap);
  const [leftId, setLeftId] = useState<string>(ids[0] || "1");
  const [rightId, setRightId] = useState<string>(ids[1] || "2");

  const left = reportMap[leftId];
  const right = reportMap[rightId];

  const radarData = left && right ? [
    { subject: "Speech", A: (left.speech / 25) * 100, B: (right.speech / 25) * 100 },
    { subject: "Timing", A: (left.timing / 25) * 100, B: (right.timing / 25) * 100 },
    { subject: "Flow", A: (left.flow / 25) * 100, B: (right.flow / 25) * 100 },
    { subject: "Linguistic", A: (left.linguistic / 25) * 100, B: (right.linguistic / 25) * 100 },
    { subject: "Engagement", A: left.engagement, B: right.engagement },
    { subject: "Confidence", A: left.confidence, B: right.confidence },
  ] : [];

  const summaryBarData = left && right ? [
    { category: "Speech", [left.candidate]: left.speech, [right.candidate]: right.speech },
    { category: "Timing", [left.candidate]: left.timing, [right.candidate]: right.timing },
    { category: "Flow", [left.candidate]: left.flow, [right.candidate]: right.flow },
    { category: "Linguistic", [left.candidate]: left.linguistic, [right.candidate]: right.linguistic },
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

        {/* Selectors */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="glass-card rounded-xl p-4 mb-8 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <label className="text-xs text-muted-foreground mb-1 block">Candidate A</label>
            <Select value={leftId} onValueChange={setLeftId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {reportList.map(c => (
                  <SelectItem key={c.id} value={c.id} disabled={c.id === rightId}>
                    {c.candidate} — {c.position} ({c.overall}/100)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <GitCompareArrows className="h-5 w-5 text-muted-foreground shrink-0 hidden sm:block" />
          <div className="flex-1 w-full">
            <label className="text-xs text-muted-foreground mb-1 block">Candidate B</label>
            <Select value={rightId} onValueChange={setRightId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {reportList.map(c => (
                  <SelectItem key={c.id} value={c.id} disabled={c.id === leftId}>
                    {c.candidate} — {c.position} ({c.overall}/100)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {left && right && (
          <>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="grid md:grid-cols-2 gap-6 mb-8">
              <CompareColumn report={left} color="hsl(var(--primary))" />
              <CompareColumn report={right} color="hsl(160, 84%, 39%)" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="glass-card rounded-xl p-6 mb-8">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Overlaid Authenticity Profile
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name={left.candidate} dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                  <Radar name={right.candidate} dataKey="B" stroke="hsl(160, 84%, 39%)" fill="hsl(160, 84%, 39%)" fillOpacity={0.15} strokeWidth={2} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="glass-card rounded-xl p-6 mb-8">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Category Score Comparison
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={summaryBarData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 25]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey={left.candidate} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={right.candidate} fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="glass-card rounded-xl p-6 mb-8">
              <h3 className="text-sm font-semibold mb-4">Quick Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="py-2 pr-4 font-medium">Metric</th>
                      <th className="py-2 px-4 font-medium">{left.candidate}</th>
                      <th className="py-2 px-4 font-medium">{right.candidate}</th>
                      <th className="py-2 pl-4 font-medium">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "Overall Score", a: left.overall, b: right.overall, suffix: "/100" },
                      { label: "Flags", a: left.flags.length, b: right.flags.length, suffix: "", inverted: true },
                      { label: "Duration", a: left.duration, b: right.duration, suffix: "", isString: true },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-3 pr-4 text-muted-foreground">{row.label}</td>
                        <td className="py-3 px-4 font-medium">
                          {row.isString ? row.a : <>{row.a}{row.suffix}</>}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {row.isString ? row.b : <>{row.b}{row.suffix}</>}
                        </td>
                        <td className="py-3 pl-4">
                          {!row.isString && typeof row.a === "number" && typeof row.b === "number" && (
                            <span className={
                              row.inverted
                                ? (row.a < row.b ? "text-success" : row.a > row.b ? "text-destructive" : "text-muted-foreground")
                                : (row.a > row.b ? "text-success" : row.a < row.b ? "text-destructive" : "text-muted-foreground")
                            }>
                              {row.a > row.b ? "+" : ""}{(row.a as number) - (row.b as number)}{row.suffix}
                            </span>
                          )}
                          {row.isString && <span className="text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default Compare;
