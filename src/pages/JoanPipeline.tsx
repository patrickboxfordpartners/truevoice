import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Loader2, CheckCircle2, AlertCircle, ArrowRight, FileText, Filter, Clock, Brain, Download, CheckSquare, Square, X, GitCompareArrows, Orbit, LayoutDashboard } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import AutopilotQueue from "@/components/AutopilotQueue";
import AutopilotAnalytics from "@/components/AutopilotAnalytics";
import PipelineFunnel from "@/components/PipelineFunnel";
import JoanNotificationToast from "@/components/JoanNotificationToast";
import JoanChat from "@/components/JoanChat";
import { QuickActionsMenu } from "@/components/QuickActionsMenu";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { GlobalSearchFilter } from "@/components/GlobalSearchFilter";
import { SentimentBadges } from "@/components/SentimentBadges";
import { Search, Keyboard, CalendarDays } from "lucide-react";

type Stage = "screening" | "technical" | "final" | "offer" | "hired" | "rejected";

interface Candidate {
  _id: Id<"hiring_pipeline">;
  interviewId: string;
  candidateName: string;
  position: string;
  stage: Stage;
  overallScore?: number;
  flagCount: number;
  actionItemsComplete: number;
  actionItemsTotal: number;
  updatedAt: number;
  resumeText?: string;
  resumeUrl?: string;
}

const STAGE_LABELS: Record<Stage, string> = {
  screening: "Screening",
  technical: "Technical",
  final: "Final Round",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

const STAGE_COLORS: Record<Stage, string> = {
  screening: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  technical: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  final: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  offer: "bg-green-500/10 text-green-600 border-green-500/20",
  hired: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

function getScoreColor(score?: number): string {
  if (!score) return "text-muted-foreground";
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-destructive";
}

function getScoreBgColor(score?: number): string {
  if (!score) return "bg-muted/10";
  if (score >= 80) return "bg-success/10";
  if (score >= 60) return "bg-warning/10";
  return "bg-destructive/10";
}

function getDaysInStage(updatedAt: number): number {
  const now = Date.now();
  const diff = now - updatedAt;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function CandidateListCard({ candidate, selected, onToggleSelect, onContextMenu }: { candidate: Candidate; selected: boolean; onToggleSelect: (id: Id<"hiring_pipeline">) => void; onContextMenu?: (e: React.MouseEvent, c: Candidate) => void }) {
  const navigate = useNavigate();
  const scoreColor = getScoreColor(candidate.overallScore);
  const scoreBgColor = getScoreBgColor(candidate.overallScore);
  const daysInStage = getDaysInStage(candidate.updatedAt);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card rounded-lg p-4 hover:shadow-md transition-all group ${selected ? "ring-2 ring-primary/50" : ""}`}
      onContextMenu={(e) => { e.preventDefault(); onContextMenu?.(e, candidate); }}
    >
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSelect(candidate._id); }}
          className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
        >
          {selected ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5" />}
        </button>

        {/* Score Badge - Left (hidden on very small screens) */}
        {candidate.overallScore !== undefined && (
          <div className={`hidden sm:flex items-center justify-center w-12 h-12 rounded-lg ${scoreBgColor} shrink-0`}>
            <span className={`text-lg font-bold tabular-nums ${scoreColor}`}>
              {candidate.overallScore}
            </span>
          </div>
        )}

        {/* Main Info - Center */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm sm:text-base truncate">{candidate.candidateName}</h4>
            {/* Inline score on mobile */}
            {candidate.overallScore !== undefined && (
              <span className={`sm:hidden text-xs font-bold tabular-nums ${scoreColor}`}>
                {candidate.overallScore}
              </span>
            )}
            {(candidate.resumeText || candidate.resumeUrl) && (
              <FileText className="h-4 w-4 text-blue-600 shrink-0" title="Resume on file" />
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground truncate mb-1.5 sm:mb-2">{candidate.position}</p>

          {/* Metadata Row */}
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap text-xs text-muted-foreground">
            <Badge variant="outline" className={`${STAGE_COLORS[candidate.stage as Stage]} border text-[10px] sm:text-xs`}>
              {STAGE_LABELS[candidate.stage as Stage]}
            </Badge>

            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
              <span>{candidate.actionItemsComplete}/{candidate.actionItemsTotal}</span>
            </div>

            {candidate.flagCount > 0 && (
              <div className="flex items-center gap-1 text-destructive">
                <AlertCircle className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                <span>{candidate.flagCount}</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Clock className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
              <span>{daysInStage}d</span>
            </div>
          </div>
          <SentimentBadges interviewId={candidate.interviewId} compact className="mt-1.5" />
        </div>

        {/* Action - Right */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/joan-candidate/${candidate.interviewId}`)}
          className="opacity-70 group-hover:opacity-100 transition-opacity shrink-0 h-8 px-2 sm:px-3"
        >
          <span className="hidden sm:inline">View</span>
          <ArrowRight className="h-4 w-4 sm:ml-1" />
        </Button>
      </div>
    </motion.div>
  );
}

export default function JoanPipeline() {
  const { company } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Filters
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [resumeFilter, setResumeFilter] = useState<boolean>(false);

  // Context menu
  const [contextMenu, setContextMenu] = useState<{ candidate: Candidate; position: { x: number; y: number } } | null>(null);
  const handleContextMenu = useCallback((e: React.MouseEvent, c: Candidate) => {
    setContextMenu({ candidate: c, position: { x: e.clientX, y: e.clientY } });
  }, []);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStage, setBulkStage] = useState<string>("");

  // Search + shortcuts
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Real-time subscription to candidates
  const companyId = company?.id || "demo-company";
  const candidates = useQuery(
    api.queries.getCandidatesByCompany,
    { companyId }
  ) as Candidate[] | undefined;

  // Bulk move mutation
  const bulkMove = useMutation(api.mutations.bulkMoveCandidates);

  // Export data query
  const exportData = useQuery(api.queries.getPipelineExportData, { companyId });

  // Selection helpers
  const toggleSelect = useCallback((id: Id<"hiring_pipeline">) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const deselectAll = useCallback(() => setSelectedIds(new Set()), []);

  const handleBulkMove = async (stage: Stage) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds) as Id<"hiring_pipeline">[];
    const result = await bulkMove({ candidateIds: ids, toStage: stage });
    toast({ title: `Moved ${result.moved} candidate${result.moved !== 1 ? "s" : ""} to ${STAGE_LABELS[stage]}` });
    setSelectedIds(new Set());
    setBulkStage("");
  };

  const handleExportCsv = () => {
    if (!exportData || exportData.length === 0) return;
    const headers = ["Name","Email","Position","Stage","Score","Flags","Action Items","Confidence","Recommendation","Summary","Created","Updated"];
    const rows = exportData.map((r) => [
      r.candidateName,
      r.candidateEmail,
      r.position,
      r.stage,
      r.overallScore ?? "",
      r.flagCount,
      `${r.actionItemsComplete}/${r.actionItemsTotal}`,
      r.confidenceScore ?? "",
      r.recommendation ?? "",
      (r.briefSummary ?? "").replace(/"/g, '""'),
      new Date(r.createdAt).toISOString().split("T")[0],
      new Date(r.updatedAt).toISOString().split("T")[0],
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `joan-pipeline-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `Exported ${exportData.length} candidates to CSV` });
  };

  // Get unique positions for filter
  const positions = useMemo(() => {
    if (!candidates) return [];
    const uniquePositions = Array.from(new Set(candidates.map((c) => c.position)));
    return uniquePositions.sort();
  }, [candidates]);

  // Apply filters
  const filteredCandidates = useMemo(() => {
    if (!candidates) return [];

    let filtered = [...candidates];

    // Position filter
    if (positionFilter !== "all") {
      filtered = filtered.filter((c) => c.position === positionFilter);
    }

    // Stage filter
    if (stageFilter !== "all") {
      filtered = filtered.filter((c) => c.stage === stageFilter);
    }

    // Score filter
    if (scoreFilter === "80+") {
      filtered = filtered.filter((c) => c.overallScore && c.overallScore >= 80);
    } else if (scoreFilter === "60-79") {
      filtered = filtered.filter((c) => c.overallScore && c.overallScore >= 60 && c.overallScore < 80);
    } else if (scoreFilter === "below-60") {
      filtered = filtered.filter((c) => c.overallScore && c.overallScore < 60);
    }

    // Resume filter
    if (resumeFilter) {
      filtered = filtered.filter((c) => c.resumeText || c.resumeUrl);
    }

    // Sort by score (highest first), then by date (newest first)
    filtered.sort((a, b) => {
      if (a.overallScore !== undefined && b.overallScore !== undefined) {
        return b.overallScore - a.overallScore;
      }
      return b.updatedAt - a.updatedAt;
    });

    return filtered;
  }, [candidates, positionFilter, stageFilter, scoreFilter, resumeFilter]);

  const selectAll = useCallback(() => {
    if (!filteredCandidates) return;
    setSelectedIds(new Set(filteredCandidates.map((c) => c._id)));
  }, [filteredCandidates]);

  return (
    <div className="min-h-screen bg-background">
      <JoanNotificationToast />

      {/* Mobile notice */}
      <div className="sm:hidden bg-muted/50 border-b border-border px-4 py-2 text-center">
        <p className="text-xs text-muted-foreground">For the best experience, use a tablet or computer</p>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Shield className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold truncate">
                <span className="text-gradient">Joan</span> <span className="hidden xs:inline">Hiring </span>Pipeline
              </h1>
              <p className="text-xs text-muted-foreground">
                {candidates?.length || 0} candidates • {filteredCandidates.length} shown
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="h-8 sm:h-9"
              title="Search (Ctrl+K)"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShortcutsOpen(true)}
              className="h-8 sm:h-9"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
            <DarkModeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/joan-digest")}
              className="h-8 sm:h-9"
            >
              <CalendarDays className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Digest</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/joan-orbit")}
              className="h-8 sm:h-9"
            >
              <Orbit className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Orbit</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/joan-dashboard")}
              className="h-8 sm:h-9"
            >
              <LayoutDashboard className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/joan-compare")}
              className="h-8 sm:h-9"
            >
              <GitCompareArrows className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Compare</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={!exportData || exportData.length === 0} className="h-8 sm:h-9">
              <Download className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {candidates === undefined ? (
          <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center max-w-md">
              <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No candidates yet</h3>
              <p className="text-muted-foreground mb-4">
                Joan hasn't detected any candidates in your hiring pipeline yet.
                Once you conduct interviews, candidates will appear here automatically.
              </p>
              <div className="glass-card p-4 text-left">
                <p className="text-sm font-medium mb-2">To get started:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Run a TrueVoice interview</li>
                  <li>• Joan will extract action items automatically</li>
                  <li>• Candidates appear with authenticity scores</li>
                  <li>• Filter and review candidates efficiently</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Filters Bar */}
            <div className="glass-card rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Position Filter */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Position</label>
                  <Select value={positionFilter} onValueChange={setPositionFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Positions</SelectItem>
                      {positions.map((pos) => (
                        <SelectItem key={pos} value={pos}>
                          {pos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Stage Filter */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Stage</label>
                  <Select value={stageFilter} onValueChange={setStageFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stages</SelectItem>
                      <SelectItem value="screening">Screening</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="final">Final Round</SelectItem>
                      <SelectItem value="offer">Offer</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Score Filter */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Score</label>
                  <Select value={scoreFilter} onValueChange={setScoreFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Scores</SelectItem>
                      <SelectItem value="80+">80+ (Excellent)</SelectItem>
                      <SelectItem value="60-79">60-79 (Good)</SelectItem>
                      <SelectItem value="below-60">Below 60 (Concerning)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Resume Filter */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Resume</label>
                  <Button
                    variant={resumeFilter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setResumeFilter(!resumeFilter)}
                    className="w-full h-10 justify-start"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {resumeFilter ? "Has Resume" : "Any"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Pipeline Funnel */}
            <div className="mb-6">
              <PipelineFunnel />
            </div>

            {/* Joan Accuracy Analytics */}
            <div className="mb-6">
              <AutopilotAnalytics />
            </div>

            {/* Joan Autopilot Queue */}
            <div className="mb-6">
              <AutopilotQueue />
            </div>

            {/* Candidates List */}
            <div className="space-y-3">
              {/* Select All header */}
              {filteredCandidates.length > 0 && (
                <div className="flex items-center gap-3 px-1">
                  <button
                    onClick={selectedIds.size === filteredCandidates.length ? deselectAll : selectAll}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {selectedIds.size === filteredCandidates.length && filteredCandidates.length > 0
                      ? <CheckSquare className="h-5 w-5 text-primary" />
                      : <Square className="h-5 w-5" />}
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
                  </span>
                </div>
              )}

              {filteredCandidates.length === 0 ? (
                <div className="glass-card rounded-lg p-8 text-center">
                  <p className="text-muted-foreground">No candidates match your filters</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setPositionFilter("all");
                      setStageFilter("all");
                      setScoreFilter("all");
                      setResumeFilter(false);
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              ) : (
                filteredCandidates.map((candidate) => (
                  <CandidateListCard
                    key={candidate._id}
                    candidate={candidate}
                    selected={selectedIds.has(candidate._id)}
                    onToggleSelect={toggleSelect}
                    onContextMenu={handleContextMenu}
                  />
                ))
              )}
            </div>
          </>
        )}
      </main>

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-4 sm:bottom-6 left-2 right-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-auto z-50 bg-card border border-border rounded-xl shadow-lg px-3 sm:px-5 py-2.5 sm:py-3 flex flex-wrap items-center justify-center gap-2 sm:gap-4"
          >
            <span className="text-xs sm:text-sm font-medium tabular-nums">{selectedIds.size} selected</span>

            <Select value={bulkStage} onValueChange={(val) => handleBulkMove(val as Stage)}>
              <SelectTrigger className="w-[120px] sm:w-[140px] h-8 text-xs">
                <SelectValue placeholder="Move to..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="screening">Screening</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="final">Final Round</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {selectedIds.size >= 2 && (
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => navigate(`/joan-compare?ids=${Array.from(selectedIds).join(",")}`)}
              >
                <GitCompareArrows className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Compare</span>
              </Button>
            )}

            <Button variant="ghost" size="sm" onClick={deselectAll} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <JoanChat />

      {/* Quick Actions Context Menu */}
      {contextMenu && (
        <QuickActionsMenu
          candidateId={contextMenu.candidate._id}
          candidateName={contextMenu.candidate.candidateName}
          currentStage={contextMenu.candidate.stage}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onAction={(action) => {
            if (action === "add-note") navigate(`/joan-candidate/${contextMenu.candidate.interviewId}`);
            if (action === "schedule") navigate(`/joan-candidate/${contextMenu.candidate.interviewId}`);
            setContextMenu(null);
          }}
        />
      )}

      {/* Global Search Overlay */}
      <GlobalSearchFilter
        companyId={companyId}
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectCandidate={(id) => {
          setSearchOpen(false);
          navigate(`/joan-candidate/${id}`);
        }}
        onFilterChange={() => {}}
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
