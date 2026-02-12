import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Share2, Calendar, AlertTriangle, Clock, Lightbulb, TrendingUp, BarChart3, Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreGauge } from "@/components/ScoreGauge";
import { Progress } from "@/components/ui/progress";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Cell
} from "recharts";
import { useReport } from "@/hooks/useReport";

const getDelayColor = (delay: number) => {
  if (delay < 1.5) return "hsl(0, 84%, 60%)";
  if (delay > 4) return "hsl(38, 92%, 50%)";
  return "hsl(160, 84%, 39%)";
};

const ScoreCard = ({ title, score, max, description, findings }: {
  title: string; score: number; max: number; description: string; findings: string[];
}) => (
  <div className="glass-card rounded-xl p-6">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold">{title}</h3>
      <span className="text-sm font-bold">{score}/{max}</span>
    </div>
    <Progress value={(score / max) * 100} className="h-2 mb-3" />
    <p className="text-xs text-muted-foreground mb-3">{description}</p>
    <ul className="space-y-1.5">
      {findings.map((f, i) => (
        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
          <span className="text-primary mt-0.5">•</span>{f}
        </li>
      ))}
    </ul>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg px-3 py-2 text-sm shadow-lg">
        <p className="font-medium">{label}</p>
        <p className="text-primary">{payload[0].name}: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const Report = () => {
  const { id } = useParams();
  const { data, isLoading, error } = useReport(id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Report not found or not yet generated.</p>
        <Link to="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const { interview, report, flags, timeline, responseDelays, interviewer } = data;

  const radarData = [
    { subject: "Speech", value: (report.speech_score / 25) * 100, fullMark: 100 },
    { subject: "Timing", value: (report.timing_score / 25) * 100, fullMark: 100 },
    { subject: "Flow", value: (report.flow_score / 25) * 100, fullMark: 100 },
    { subject: "Linguistic", value: (report.linguistic_score / 25) * 100, fullMark: 100 },
    { subject: "Engagement", value: report.engagement, fullMark: 100 },
    { subject: "Confidence", value: report.confidence, fullMark: 100 },
  ];

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">{interview.candidate_name}</h1>
              <p className="text-muted-foreground">{interview.position}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                {dateStr && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{dateStr}</span>}
                {interview.duration && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{interview.duration}</span>}
                {interviewer && <span>Interviewer: {interviewer.full_name}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" />PDF</Button>
              <Button variant="outline" size="sm" className="gap-1.5"><Share2 className="h-3.5 w-3.5" />Share</Button>
            </div>
          </div>
        </motion.div>

        {/* Main Score + Radar */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-8 flex flex-col items-center justify-center">
            <ScoreGauge score={report.overall_score} size={160} strokeWidth={10} />
            {report.summary && (
              <p className="text-muted-foreground mt-4 max-w-sm mx-auto text-sm text-center">
                {report.summary}
              </p>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Authenticity Profile
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Authenticity Timeline */}
        {timelineData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-6 mb-8">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Authenticity Score Over Time
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="min" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="score" name="Score" stroke="hsl(var(--primary))" fill="url(#scoreGradient)" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Response Timing Chart */}
        {delayData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card rounded-xl p-6 mb-8">
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
                      const d = delayData.find(dd => dd.question === payload[0]?.payload?.question);
                      return (
                        <div className="glass-card rounded-lg px-3 py-2 text-sm shadow-lg">
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

        {/* Score Breakdown */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-lg font-semibold mb-4">Score Breakdown</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <ScoreCard
              title="Speech Patterns"
              score={report.speech_score}
              max={25}
              description="Natural speech vs. reading cadence"
              findings={["Filler words, self-corrections, vocal variety analyzed"]}
            />
            <ScoreCard
              title="Response Timing"
              score={report.timing_score}
              max={25}
              description="Thinking time vs. instant responses"
              findings={["Response delay patterns analyzed across questions"]}
            />
            <ScoreCard
              title="Conversational Flow"
              score={report.flow_score}
              max={25}
              description="Natural dialogue vs. monologue delivery"
              findings={["Clarifying questions, engagement patterns analyzed"]}
            />
            <ScoreCard
              title="Linguistic Authenticity"
              score={report.linguistic_score}
              max={25}
              description="Spoken language vs. written language"
              findings={["Grammar, sentence structure, contractions analyzed"]}
            />
          </div>
        </motion.div>

        {/* Flags */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Detected Patterns
          </h2>
          {flags.length > 0 ? (
            <div className="space-y-3">
              {flags.map((flag) => (
                <div key={flag.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <span className="text-xs font-mono text-muted-foreground mt-0.5 shrink-0">{flag.time}</span>
                  <span className={flag.severity === "high" ? "text-destructive" : flag.severity === "medium" ? "text-warning" : "text-muted-foreground"}>
                    {flag.severity === "high" ? "🔴" : flag.severity === "medium" ? "⚠️" : "ℹ️"}
                  </span>
                  <span className="text-sm">{flag.pattern}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No significant patterns detected.</p>
          )}
        </motion.div>

        {/* Notes */}
        {interview.notes && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold mb-3">Interview Notes</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{interview.notes}</p>
          </motion.div>
        )}

        {/* Recommendations */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Suggested Next Steps
          </h2>
          {report.recommendations && report.recommendations.length > 0 ? (
            <ul className="space-y-2">
              {report.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-success">✓</span> {rec}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-2">
              <li className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-success">✓</span> Review the full transcript for context
              </li>
              <li className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-success">✓</span> Compare with other candidates using the Compare tool
              </li>
            </ul>
          )}
          <div className="flex gap-3 mt-6">
            <Button className="gap-2"><Calendar className="h-4 w-4" />Schedule Follow-Up</Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Report;
