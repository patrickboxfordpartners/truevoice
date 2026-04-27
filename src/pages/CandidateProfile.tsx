import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Loader2, ExternalLink, AlertTriangle, User,
  Mail, FileText, Calendar,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScoreBadge } from "@/components/ScoreBadge";
import { useCandidateHistory, useUpdateCandidate } from "@/hooks/useCandidates";
import type { CandidateInterview } from "@/hooks/useCandidates";
import { useToast } from "@/hooks/use-toast";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function avg(nums: (number | null)[]): number {
  const valid = nums.filter((n): n is number => n !== null);
  if (valid.length === 0) return 0;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

const DRIFT_THRESHOLD = 30;

function hasDrift(interviews: CandidateInterview[], avgScore: number): boolean {
  return interviews.some(
    (i) => i.overall_score !== null && Math.abs(i.overall_score - avgScore) > DRIFT_THRESHOLD
  );
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

const ScoreTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg px-3 py-2 text-sm shadow-lg border border-border">
        <p className="font-medium text-muted-foreground">{label}</p>
        <p className="text-primary font-semibold">Score: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const CandidateProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useCandidateHistory(id);
  const updateCandidate = useUpdateCandidate(id!);
  const { toast } = useToast();

  const [editingNotes, setEditingNotes] = useState(false);
  const [editingLinkedIn, setEditingLinkedIn] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [linkedInValue, setLinkedInValue] = useState("");

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
        <p className="text-muted-foreground">Candidate not found.</p>
        <Link to="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const { interviews } = data;
  const completedInterviews = interviews.filter((i) => i.overall_score !== null);

  // Score trend data (chronological, completed only)
  const trendData = completedInterviews.map((i, idx) => ({
    label: new Date(i.scheduled_at ?? i.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    score: i.overall_score as number,
    position: i.position,
    idx,
  }));

  // Average dimension scores for radar (using raw sub-scores out of 25 → normalise to 100)
  const avgSpeech = avg(completedInterviews.map((i) => i.speech_score)) * 4;
  const avgTiming = avg(completedInterviews.map((i) => i.timing_score)) * 4;
  const avgFlow = avg(completedInterviews.map((i) => i.flow_score)) * 4;
  const avgLinguistic = avg(completedInterviews.map((i) => i.linguistic_score)) * 4;
  const avgOverall = avg(completedInterviews.map((i) => i.overall_score));

  const radarData = [
    { dim: "Speech", value: avgSpeech },
    { dim: "Timing", value: avgTiming },
    { dim: "Flow", value: avgFlow },
    { dim: "Linguistic", value: avgLinguistic },
  ];

  const showDriftBanner = completedInterviews.length > 1 && hasDrift(completedInterviews, avgOverall);

  const handleSaveNotes = async () => {
    try {
      await updateCandidate.mutateAsync({ notes: notesValue });
      setEditingNotes(false);
      toast({ title: "Notes saved" });
    } catch {
      toast({ title: "Failed to save notes", variant: "destructive" });
    }
  };

  const handleSaveLinkedIn = async () => {
    try {
      await updateCandidate.mutateAsync({ linkedin_url: linkedInValue || null });
      setEditingLinkedIn(false);
      toast({ title: "LinkedIn URL saved" });
    } catch {
      toast({ title: "Failed to save LinkedIn URL", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Back link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Drift banner */}
        {showDriftBanner && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30 mb-6"
          >
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-warning">Possible profile inconsistency</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                One or more interviews deviate more than {DRIFT_THRESHOLD} points from this candidate's
                average score. This may indicate different interview conditions, significant skill
                growth, or a different person using the same profile.
              </p>
            </div>
          </motion.div>
        )}

        {/* Candidate header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">
              {data.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <h1 className="text-2xl font-bold">{data.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {data.email}
              </div>

              {/* LinkedIn */}
              <div className="flex items-center gap-2 text-sm">
                {editingLinkedIn ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={linkedInValue}
                      onChange={(e) => setLinkedInValue(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="h-7 text-sm w-72"
                      autoFocus
                    />
                    <Button size="sm" className="h-7 px-3" onClick={handleSaveLinkedIn} disabled={updateCandidate.isPending}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-3" onClick={() => setEditingLinkedIn(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : data.linkedin_url ? (
                  <a
                    href={data.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    LinkedIn profile
                  </a>
                ) : (
                  <button
                    onClick={() => { setLinkedInValue(""); setEditingLinkedIn(true); }}
                    className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2 transition-colors"
                  >
                    + Add LinkedIn URL
                  </button>
                )}
                {data.linkedin_url && !editingLinkedIn && (
                  <button
                    onClick={() => { setLinkedInValue(data.linkedin_url ?? ""); setEditingLinkedIn(true); }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex sm:flex-col gap-4 sm:gap-1 sm:text-right text-sm shrink-0">
              <div>
                <p className="text-muted-foreground text-xs">Interviews</p>
                <p className="font-bold text-lg">{interviews.length}</p>
              </div>
              {avgOverall > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs">Avg score</p>
                  <p className="font-bold text-lg">{avgOverall}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Notes
              </span>
              {!editingNotes && (
                <button
                  onClick={() => { setNotesValue(data.notes ?? ""); setEditingNotes(true); }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                >
                  {data.notes ? "Edit" : "+ Add notes"}
                </button>
              )}
            </div>
            {editingNotes ? (
              <div className="space-y-2">
                <Textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  placeholder="Internal notes about this candidate..."
                  className="text-sm min-h-[80px]"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveNotes} disabled={updateCandidate.isPending}>
                    {updateCandidate.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingNotes(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : data.notes ? (
              <p className="text-sm text-muted-foreground leading-relaxed">{data.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic">No notes yet.</p>
            )}
          </div>
        </motion.div>

        {/* Charts row — only when there's data */}
        {completedInterviews.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Score trend */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="glass-card rounded-xl p-6"
            >
              <h2 className="text-base font-semibold mb-4">Score Trend</h2>
              {trendData.length === 1 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <p className="text-3xl font-bold">{trendData[0].score}</p>
                  <p className="text-sm text-muted-foreground">{trendData[0].label} — {trendData[0].position}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="candidateGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ScoreTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      fill="url(#candidateGradient)"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Linguistic fingerprint (radar) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="glass-card rounded-xl p-6"
            >
              <h2 className="text-base font-semibold mb-1">Linguistic Fingerprint</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Average dimension scores across all interviews
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="dim"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}`, "Avg score"]}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        )}

        {/* Interview history */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="glass-card rounded-xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-base font-semibold">Interview History</h2>
          </div>

          {interviews.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted-foreground text-sm">
              No interviews on record yet.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="px-6 py-3 font-medium">Position</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Score</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {[...interviews].reverse().map((interview) => {
                  const dateStr = new Date(
                    interview.scheduled_at ?? interview.created_at
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr
                      key={interview.id}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-sm">{interview.position}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {dateStr}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {interview.overall_score !== null ? (
                          <ScoreBadge score={interview.overall_score} />
                        ) : (
                          <span className="text-muted-foreground text-sm">&mdash;</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            interview.status === "completed"
                              ? "bg-success/10 text-success"
                              : interview.status === "in_progress"
                              ? "bg-primary/10 text-primary"
                              : interview.status === "cancelled"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {interview.status === "in_progress"
                            ? "In Progress"
                            : interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {interview.status === "completed" && (
                          <Link to={`/report/${interview.id}`}>
                            <Button variant="ghost" size="sm">
                              View Report
                            </Button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CandidateProfile;
