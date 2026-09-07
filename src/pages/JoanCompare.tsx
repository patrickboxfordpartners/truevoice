import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Loader2, ArrowLeft, Users, ChevronDown, CheckCircle2, XCircle, Eye, BarChart3 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { RadarScoreChart } from "@/components/RadarScoreChart";

const REC_COLORS: Record<string, string> = {
  advance: "bg-green-500/10 text-green-600 border-green-500/20",
  review: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  reject: "bg-red-500/10 text-red-600 border-red-500/20",
};

const STAGE_COLORS: Record<string, string> = {
  screening: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  technical: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  final: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  offer: "bg-green-500/10 text-green-600 border-green-500/20",
  hired: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const BAR_COLORS = ["hsl(160, 84%, 39%)", "hsl(262, 83%, 58%)", "hsl(32, 95%, 44%)"];

type Candidate = {
  _id: Id<"hiring_pipeline">;
  candidateName: string;
  position: string;
  stage: string;
  overallScore?: number;
  brief?: {
    confidenceScore: number;
    recommendation: string;
    summary: string;
    strengths: string[];
    risks: string[];
  };
};

function CandidateColumn({ candidate, color }: { candidate: Candidate; color: string }) {
  const brief = candidate.brief;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: color }}
            >
              {candidate.candidateName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{candidate.candidateName}</h3>
              <p className="text-xs text-muted-foreground truncate">{candidate.position}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`${STAGE_COLORS[candidate.stage] || ""} border text-xs`}>
              {candidate.stage}
            </Badge>
            {brief && (
              <Badge variant="outline" className={`${REC_COLORS[brief.recommendation] || ""} border text-xs`}>
                {brief.recommendation}
              </Badge>
            )}
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold tabular-nums">{candidate.overallScore ?? "--"}</p>
              <p className="text-[10px] text-muted-foreground">Overall Score</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold tabular-nums">{brief?.confidenceScore ?? "--"}</p>
              <p className="text-[10px] text-muted-foreground">Joan Confidence</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {brief && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {brief.summary.slice(0, 300)}
              {brief.summary.length > 300 && "..."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Strengths */}
      {brief && brief.strengths.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {brief.strengths.map((s, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Risks */}
      {brief && brief.risks.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5 text-red-600" />
              Risks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {brief.risks.map((r, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* No brief */}
      {!brief && (
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground text-center">
              No intelligence brief available for this candidate.
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

export default function JoanCompare() {
  const { company } = useAuth();
  const companyId = company?.id || "demo-company";

  const candidates = useQuery(api.queries.getCandidatesWithBriefs, { companyId });

  const [selectedIds, setSelectedIds] = useState<string[]>(["", ""]);

  const selectedCandidates = useMemo(() => {
    if (!candidates) return [];
    return selectedIds
      .filter((id) => id !== "")
      .map((id) => candidates.find((c) => c._id === id))
      .filter((c): c is Candidate => c !== undefined);
  }, [candidates, selectedIds]);

  const chartData = useMemo(() => {
    if (selectedCandidates.length < 2) return [];
    return [
      {
        name: "Overall",
        ...Object.fromEntries(
          selectedCandidates.map((c) => [c.candidateName, c.overallScore ?? 0])
        ),
      },
      {
        name: "Confidence",
        ...Object.fromEntries(
          selectedCandidates.map((c) => [c.candidateName, c.brief?.confidenceScore ?? 0])
        ),
      },
    ];
  }, [selectedCandidates]);

  const updateSelection = (index: number, value: string) => {
    setSelectedIds((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addSlot = () => {
    if (selectedIds.length < 3) {
      setSelectedIds((prev) => [...prev, ""]);
    }
  };

  const removeSlot = (index: number) => {
    if (selectedIds.length > 2) {
      setSelectedIds((prev) => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link to="/joan-pipeline">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Pipeline</span>
              </Button>
            </Link>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <Shield className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold truncate">
                <span className="text-gradient">Joan</span> Compare
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6">
        {candidates === undefined ? (
          <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : candidates.length < 2 ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center max-w-md">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Not enough candidates</h3>
              <p className="text-muted-foreground">
                You need at least 2 candidates in the pipeline to compare.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Selector Bar */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Select candidates to compare</span>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 flex-wrap">
                {selectedIds.map((id, index) => (
                  <div key={index} className="w-full sm:flex-1 sm:min-w-[200px]">
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      Candidate {index + 1}
                    </label>
                    <div className="flex items-center gap-1">
                      <Select value={id} onValueChange={(v) => updateSelection(index, v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select candidate..." />
                        </SelectTrigger>
                        <SelectContent>
                          {candidates
                            .filter(
                              (c) =>
                                !selectedIds.includes(c._id) || c._id === id
                            )
                            .map((c) => (
                              <SelectItem key={c._id} value={c._id}>
                                {c.candidateName} - {c.position}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {selectedIds.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 h-10 w-10 p-0"
                          onClick={() => removeSlot(index)}
                        >
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {selectedIds.length < 3 && (
                  <Button variant="outline" size="sm" onClick={addSlot} className="h-10">
                    + Add
                  </Button>
                )}
              </div>
            </motion.div>

            {/* Score Chart */}
            {selectedCandidates.length >= 2 && chartData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Score Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={chartData} barGap={8}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "12px" }} />
                        {selectedCandidates.map((c, i) => (
                          <Bar
                            key={c._id}
                            dataKey={c.candidateName}
                            fill={BAR_COLORS[i]}
                            radius={[4, 4, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Side-by-side Columns */}
            {selectedCandidates.length >= 2 && (
              <div
                className={`grid gap-6 ${
                  selectedCandidates.length === 3 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
                }`}
              >
                {selectedCandidates.map((c, i) => (
                  <CandidateColumn key={c._id} candidate={c} color={BAR_COLORS[i]} />
                ))}
              </div>
            )}

            {/* Radar Score Breakdown Comparison */}
            {selectedCandidates.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-4 w-4 text-accent" />
                  <h2 className="text-sm font-semibold">Score Breakdown Comparison</h2>
                </div>
                <div
                  className={`grid gap-6 ${
                    selectedCandidates.length === 3 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
                  }`}
                >
                  {selectedCandidates.map((c) => (
                    <div key={`radar-${c._id}`}>
                      <p className="text-xs text-muted-foreground mb-2 font-medium text-center">
                        {c.candidateName}
                      </p>
                      <RadarScoreChart candidateId={c._id} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Empty state */}
            {selectedCandidates.length < 2 && (
              <div className="flex items-center justify-center h-[40vh]">
                <div className="text-center">
                  <Eye className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Select at least 2 candidates above to compare
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
