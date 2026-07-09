import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus, Search, Shield, LogOut, Moon, Sun, ArrowUp, ArrowDown,
  ArrowUpDown, Filter, X, ChevronLeft, ChevronRight, Download,
  Mail, Table2, CalendarDays, Loader2, LayoutGrid, Settings, CheckCircle2, Users,
  Upload, Lock, BarChart3, Radio, ArrowRight,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScoreBadge } from "@/components/ScoreBadge";
import { CreateInterviewDialog } from "@/components/CreateInterviewDialog";
import { EmailTemplateDialog } from "@/components/EmailTemplateDialog";
import { BulkImportDialog } from "@/components/BulkImportDialog";
import { InterviewCalendar } from "@/components/InterviewCalendar";
import { InsightStrip } from "@/components/dashboard/InsightStrip";
import { CandidateCard } from "@/components/dashboard/CandidateCard";
import { PositionFilter } from "@/components/dashboard/PositionFilter";
import { getScoreColor } from "@/components/ScoreGauge";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import { useInterviews } from "@/hooks/useInterviews";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useCompletedReports } from "@/hooks/useReport";
import { useCandidates } from "@/hooks/useCandidates";
import type { Interview } from "@/types";
import { supabase } from "@/lib/supabase";

const DarkModeToggle = () => {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="h-9 w-9"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

type ViewMode = "cards" | "table" | "calendar" | "candidates" | "positions";
type SortKey = "candidate" | "position" | "date" | "duration" | "score";
type SortDir = "asc" | "desc";

const ITEMS_PER_PAGE = 8;

const Dashboard = () => {
  const { toast } = useToast();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const plan = usePlan();
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(
    searchParams.get("checkout") === "success"
  );
  const { data: interviews, isLoading } = useInterviews();

  // Clear the ?checkout=success param from the URL after showing the banner
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      const next = new URLSearchParams(searchParams);
      next.delete("checkout");
      setSearchParams(next, { replace: true });
    }
  }, []);
  const { data: completedReports, isLoading: reportsLoading } = useCompletedReports();
  const { data: candidates, isLoading: candidatesLoading } = useCandidates();
  const stats = useDashboardStats(interviews);

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEmailTemplates, setShowEmailTemplates] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [positionFilter, setPositionFilter] = useState("all");

  // Table-specific state
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  // Build a lookup from interview ID to report data
  const reportLookup = useMemo(() => {
    const map = new Map<string, typeof completedReports extends (infer T)[] | undefined ? T : never>();
    if (completedReports) {
      for (const r of completedReports) {
        if (r) map.set(r.id, r);
      }
    }
    return map;
  }, [completedReports]);

  // Unique positions for filter
  const positions = useMemo(() => {
    if (!interviews) return [];
    const set = new Set(interviews.map((i) => i.position).filter(Boolean));
    return Array.from(set).sort();
  }, [interviews]);

  // Filtered interviews for cards view
  const cardInterviews = useMemo(() => {
    if (!interviews) return [];
    let items = [...interviews];

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) => i.candidate_name.toLowerCase().includes(q) || i.position.toLowerCase().includes(q)
      );
    }

    if (positionFilter !== "all") {
      items = items.filter((i) => i.position === positionFilter);
    }

    // Sort: completed with reports first (by score desc), then in_progress, then scheduled, then cancelled
    items.sort((a, b) => {
      const statusOrder = { in_progress: 0, completed: 1, scheduled: 2, cancelled: 3 };
      const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 4;
      const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 4;
      if (aOrder !== bOrder) return aOrder - bOrder;

      // Within completed, sort by score desc
      if (a.status === "completed" && b.status === "completed") {
        const aScore = reportLookup.get(a.id)?.overall ?? 0;
        const bScore = reportLookup.get(b.id)?.overall ?? 0;
        return bScore - aScore;
      }

      // Within scheduled, sort by date asc (soonest first)
      if (a.status === "scheduled" && b.status === "scheduled") {
        return new Date(a.scheduled_at ?? a.created_at).getTime() - new Date(b.scheduled_at ?? b.created_at).getTime();
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return items;
  }, [interviews, search, positionFilter, reportLookup]);

  const completedInterviews = useMemo(
    () => (interviews ?? []).filter((i) => i.status === "completed"),
    [interviews]
  );

  const scheduledInterviews = useMemo(
    () => (interviews ?? []).filter(
      (i) => i.status === "scheduled" || i.status === "in_progress"
    ),
    [interviews]
  );

  // Table view logic (existing)
  const displayInterviews = useMemo(() => {
    if (!interviews) return [];
    return interviews.map((i) => ({
      id: i.id,
      candidate: i.candidate_name,
      position: i.position,
      date: i.scheduled_at || i.created_at,
      duration: i.duration || "\u2014",
      score: reportLookup.get(i.id)?.overall ?? 0,
      status: i.status,
    }));
  }, [interviews, reportLookup]);

  const calendarInterviews = useMemo(() => {
    return displayInterviews.map((i) => ({
      id: i.id,
      candidate: i.candidate,
      position: i.position,
      date: i.date,
      duration: i.duration,
      score: i.score,
    }));
  }, [displayInterviews]);

  const positionsData = useMemo(() => {
    if (!completedReports) return []
    const map = new Map<string, { scores: number[]; candidates: { name: string; score: number; id: string }[] }>()
    completedReports.forEach((r: any) => {
      if (!r) return
      const pos = r.position || "Unknown Position"
      if (!map.has(pos)) map.set(pos, { scores: [], candidates: [] })
      const entry = map.get(pos)!
      entry.scores.push(r.overall ?? 0)
      entry.candidates.push({ name: r.candidate, score: r.overall ?? 0, id: r.id })
    })
    return Array.from(map.entries())
      .map(([position, { scores, candidates }]) => ({
        position,
        count: scores.length,
        avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        top3: [...candidates].sort((a, b) => b.score - a.score).slice(0, 3),
      }))
      .sort((a, b) => b.count - a.count)
  }, [completedReports])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "date" ? "desc" : "asc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const tableFiltered = useMemo(() => {
    let items = displayInterviews.filter(
      (i) =>
        i.candidate.toLowerCase().includes(search.toLowerCase()) ||
        i.position.toLowerCase().includes(search.toLowerCase())
    );

    if (scoreFilter === "high") items = items.filter((i) => i.score >= 80);
    else if (scoreFilter === "medium") items = items.filter((i) => i.score >= 50 && i.score < 80);
    else if (scoreFilter === "low") items = items.filter((i) => i.score < 50);

    items.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "candidate": cmp = a.candidate.localeCompare(b.candidate); break;
        case "position": cmp = a.position.localeCompare(b.position); break;
        case "date": cmp = new Date(a.date).getTime() - new Date(b.date).getTime(); break;
        case "duration": cmp = a.duration.localeCompare(b.duration); break;
        case "score": cmp = a.score - b.score; break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return items;
  }, [search, scoreFilter, sortKey, sortDir, displayInterviews]);

  useMemo(() => { setPage(1); }, [search, scoreFilter]);

  const totalPages = Math.max(1, Math.ceil(tableFiltered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = tableFiltered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Checkout success banner */}
      {showCheckoutSuccess && (
        <div className="bg-green-500 text-white px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">
              You're now on the <span className="font-bold capitalize">{plan.tier}</span> plan. Video interviews and all Pro features are now active.
            </span>
          </div>
          <button
            onClick={() => setShowCheckoutSuccess(false)}
            className="shrink-0 text-white/80 hover:text-white transition-colors text-lg leading-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-lg"><span className="font-extrabold uppercase">TRUE</span><span className="font-medium text-foreground/70">voice</span><span className="font-medium text-gradient">HQ</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/dashboard" className="font-medium text-foreground">Dashboard</Link>
            <span className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors">Interviews</span>
            <Link to="/settings" className="text-muted-foreground hover:text-foreground transition-colors">Settings</Link>
          </nav>
          <div className="flex items-center gap-3">
            <DarkModeToggle />
            {plan.hasBulkImport ? (
              <Button variant="outline" size="sm" onClick={() => setShowBulkImport(true)} className="gap-2 hidden sm:flex">
                <Upload className="h-4 w-4" />
                Import CSV
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 hidden sm:flex text-muted-foreground"
                onClick={() => window.location.href = "/settings"}
                title="Upgrade to Scale to use bulk import"
              >
                <Lock className="h-3.5 w-3.5" />
                Import CSV
              </Button>
            )}
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Interview
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                {initials}
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1 text-muted-foreground">
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Insight Strip */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <InsightStrip interviews={interviews} completedReports={completedReports as any} />
        </motion.div>

        {/* Controls Row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center justify-between gap-4 flex-wrap"
        >
          <div className="flex items-center gap-4 flex-wrap flex-1 min-w-0">
            <PositionFilter
              positions={positions}
              selected={positionFilter}
              onChange={setPositionFilter}
            />
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates..."
                className="pl-10 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-border p-0.5">
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2.5 gap-1.5 text-xs"
                onClick={() => setViewMode("cards")}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Cards
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2.5 gap-1.5 text-xs"
                onClick={() => setViewMode("table")}
              >
                <Table2 className="h-3.5 w-3.5" />
                Table
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2.5 gap-1.5 text-xs"
                onClick={() => setViewMode("calendar")}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Calendar
              </Button>
              <Button
                variant={viewMode === "candidates" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2.5 gap-1.5 text-xs"
                onClick={() => setViewMode("candidates")}
              >
                <Users className="h-3.5 w-3.5" />
                Candidates
              </Button>
              <Button
                variant={viewMode === "positions" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2.5 gap-1.5 text-xs"
                onClick={() => setViewMode("positions")}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Positions
              </Button>
            </div>

            <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => setShowEmailTemplates(true)}>
              <Mail className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Templates</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => {
              const headers = ["Candidate", "Position", "Date", "Duration", "Score", "Status"];
              const rows = displayInterviews.map((i) => [
                `"${i.candidate}"`,
                `"${i.position}"`,
                new Date(i.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                i.duration,
                i.score || "",
                i.status,
              ].join(","));
              const csv = [headers.join(","), ...rows].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "interviews.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}>
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </motion.div>

        {/* First-run guidance — shown when no completed interviews yet */}
        {!isLoading && !reportsLoading && completedInterviews.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            {scheduledInterviews.length > 0 ? (
              /* Has a scheduled interview — guide them to run it */
              <div className="glass-card rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Radio className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground">
                    Your first interview is ready.
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Share the candidate link and open the interview room when you're on the call.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={() => navigate(`/interviewer/${scheduledInterviews[0].id}`)}
                >
                  Open Interview Room
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              /* No interviews at all — prompt to create one */
              <div className="glass-card rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground">
                    Create your first interview.
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Invite a candidate or colleague to experience TrueVoice's real-time analysis.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={() => setShowCreate(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Interview
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Main Content */}
        {isLoading || reportsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === "cards" ? (
          /* Cards View */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cardInterviews.length === 0 ? (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                {interviews?.length === 0
                  ? "No interviews yet. Create your first one!"
                  : "No interviews matching your filters."}
              </div>
            ) : (
              cardInterviews.map((interview, i) => {
                const report = reportLookup.get(interview.id);

                if (interview.status === "completed" && report) {
                  const highestSeverity = report.flags.length > 0
                    ? (report.flags.some((f: any) => f.severity === "high")
                      ? "high"
                      : report.flags.some((f: any) => f.severity === "medium")
                        ? "medium"
                        : "low") as "low" | "medium" | "high"
                    : undefined;

                  return (
                    <CandidateCard
                      key={interview.id}
                      type="completed"
                      id={interview.id}
                      candidate={interview.candidate_name}
                      position={interview.position}
                      date={new Date(interview.scheduled_at ?? interview.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      overall={report.overall}
                      speech={report.speech}
                      timing={report.timing}
                      flow={report.flow}
                      linguistic={report.linguistic}
                      summary={report.summary}
                      flagCount={report.flags.length}
                      highestSeverity={highestSeverity}
                      index={i}
                    />
                  );
                }

                if (interview.status === "scheduled" || interview.status === "in_progress") {
                  const dateStr = interview.scheduled_at
                    ? new Date(interview.scheduled_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                      })
                    : "Not scheduled";

                  return (
                    <CandidateCard
                      key={interview.id}
                      type={interview.status as "scheduled" | "in_progress"}
                      id={interview.id}
                      candidate={interview.candidate_name}
                      position={interview.position}
                      date={dateStr}
                      index={i}
                      onResendInvitation={() => {
                        supabase.functions.invoke("send-interview-email", {
                          body: { interview_id: interview.id, template_type: "invitation" },
                        }).then(({ error }) => {
                          if (error) {
                            toast({ title: "Failed to resend invitation", variant: "destructive" });
                          } else {
                            toast({
                              title: "Invitation resent",
                              description: `Sent to ${interview.candidate_email}`,
                            });
                          }
                        }).catch(() => {
                          toast({ title: "Failed to resend invitation", variant: "destructive" });
                        });
                      }}
                    />
                  );
                }

                // Completed without report, show as simple card
                return (
                  <CandidateCard
                    key={interview.id}
                    type="scheduled"
                    id={interview.id}
                    candidate={interview.candidate_name}
                    position={interview.position}
                    date={new Date(interview.scheduled_at ?? interview.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    index={i}
                  />
                );
              })
            )}
          </div>
        ) : viewMode === "table" ? (
          /* Table View */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
            <div className="p-6 pb-0">
              <div className="flex items-center gap-3 pb-6">
                <Select value={scoreFilter} onValueChange={setScoreFilter}>
                  <SelectTrigger className="w-[160px] gap-2">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Score filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Scores</SelectItem>
                    <SelectItem value="high">High (80+)</SelectItem>
                    <SelectItem value="medium">Medium (50-79)</SelectItem>
                    <SelectItem value="low">Low (&lt;50)</SelectItem>
                  </SelectContent>
                </Select>
                {(search || scoreFilter !== "all") && (
                  <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setScoreFilter("all"); }} className="gap-1 text-muted-foreground">
                    <X className="h-3.5 w-3.5" /> Clear
                  </Button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b border-border">
                    <th className="px-6 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("candidate")}>
                      <span className="inline-flex items-center gap-1.5">Candidate <SortIcon col="candidate" /></span>
                    </th>
                    <th className="px-6 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("position")}>
                      <span className="inline-flex items-center gap-1.5">Position <SortIcon col="position" /></span>
                    </th>
                    <th className="px-6 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("date")}>
                      <span className="inline-flex items-center gap-1.5">Date <SortIcon col="date" /></span>
                    </th>
                    <th className="px-6 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("score")}>
                      <span className="inline-flex items-center gap-1.5">Score <SortIcon col="score" /></span>
                    </th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((interview) => (
                    <tr key={interview.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{interview.candidate}</td>
                      <td className="px-6 py-4 text-muted-foreground">{interview.position}</td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">
                        {new Date(interview.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4">
                        {interview.score > 0 ? <ScoreBadge score={interview.score} /> : <span className="text-muted-foreground text-sm">\u2014</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          interview.status === "completed" ? "bg-success/10 text-success" :
                          interview.status === "in_progress" ? "bg-primary/10 text-primary" :
                          interview.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {interview.status === "in_progress" ? "In Progress" : interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {interview.status === "completed" ? (
                          <Link to={`/report/${interview.id}`}>
                            <Button variant="ghost" size="sm">View Report</Button>
                          </Link>
                        ) : interview.status === "scheduled" || interview.status === "waiting_for_interviewer" ? (
                          <Link to={`/interviewer/${interview.id}`}>
                            <Button variant="ghost" size="sm" className="gap-1.5">
                              {interview.status === "waiting_for_interviewer" ? "Join Interview" : "Start Interview"}
                            </Button>
                          </Link>
                        ) : interview.status === "in_progress" ? (
                          <Link to={`/interviewer/${interview.id}`}>
                            <Button variant="ghost" size="sm" className="gap-1.5">Rejoin</Button>
                          </Link>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        {displayInterviews.length === 0
                          ? "No interviews yet. Create your first one!"
                          : "No interviews found matching your filters."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}\u2013{Math.min(safePage * ITEMS_PER_PAGE, tableFiltered.length)} of {tableFiltered.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      variant={p === safePage ? "default" : "outline"}
                      size="sm"
                      className="w-8"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        ) : viewMode === "calendar" ? (
          /* Calendar View */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6">
            <InterviewCalendar
              interviews={calendarInterviews}
              onReschedule={(id, newDate) => {
                const iv = calendarInterviews.find((i) => i.id === id);
                if (iv) {
                  const d = new Date(newDate);
                  toast({
                    title: "Interview rescheduled",
                    description: `${iv.candidate} moved to ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
                  });
                }
              }}
            />
          </motion.div>
        ) : viewMode === "positions" ? (
          /* Positions View */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {positionsData.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                No completed interviews yet.
              </div>
            ) : positionsData.map((pos) => (
              <div key={pos.position} className="glass-card rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-sm">{pos.position}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {pos.count} interview{pos.count !== 1 ? "s" : ""} &middot; avg score{" "}
                      <span className={`font-semibold ${getScoreColor(pos.avg)}`}>{pos.avg}</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pos.top3.map((c) => (
                    <Link
                      key={c.id}
                      to={`/report/${c.id}`}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-secondary hover:bg-accent/20 transition-colors"
                    >
                      <span className={`font-semibold tabular-nums ${getScoreColor(c.score)}`}>{c.score}</span>
                      <span className="text-muted-foreground">{c.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          /* Candidates View */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                All Candidates
              </h2>
              <span className="text-xs text-muted-foreground">{candidates?.length ?? 0} total</span>
            </div>
            {candidatesLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !candidates || candidates.length === 0 ? (
              <div className="px-6 py-12 text-center text-muted-foreground text-sm">
                No candidates yet. Create an interview to add one.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border">
                    <th className="px-6 py-3 font-medium">Candidate</th>
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Interviews</th>
                    <th className="px-6 py-3 font-medium">Avg Score</th>
                    <th className="px-6 py-3 font-medium">Last Interview</th>
                    <th className="px-6 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate) => (
                    <tr
                      key={candidate.id}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs shrink-0">
                            {candidate.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                          </div>
                          <span className="font-medium text-sm">{candidate.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{candidate.email}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{candidate.interview_count}</td>
                      <td className="px-6 py-4">
                        {candidate.avg_score !== null ? (
                          <ScoreBadge score={candidate.avg_score} />
                        ) : (
                          <span className="text-muted-foreground text-sm">&mdash;</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {candidate.last_interview_at
                          ? new Date(candidate.last_interview_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : ", "}
                      </td>
                      <td className="px-6 py-4">
                        <Link to={`/candidates/${candidate.id}`}>
                          <Button variant="ghost" size="sm">View Profile</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        )}
      </main>

      <CreateInterviewDialog open={showCreate} onOpenChange={setShowCreate} />
      <EmailTemplateDialog open={showEmailTemplates} onOpenChange={setShowEmailTemplates} />
      <BulkImportDialog open={showBulkImport} onOpenChange={setShowBulkImport} />
    </div>
  );
};

export default Dashboard;
