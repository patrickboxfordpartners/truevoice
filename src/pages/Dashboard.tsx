import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, TrendingUp, Calendar, Users, Shield, LogOut, Settings, ChevronDown, Clock, ArrowUp, ArrowDown, ArrowUpDown, Filter, X, ChevronLeft, ChevronRight, GitCompareArrows, Download, Moon, Sun, Mail, Table2, CalendarDays, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScoreBadge } from "@/components/ScoreBadge";
import { CreateInterviewDialog } from "@/components/CreateInterviewDialog";
import { EmailTemplateDialog } from "@/components/EmailTemplateDialog";
import { InterviewCalendar } from "@/components/InterviewCalendar";
import { useAuth } from "@/contexts/AuthContext";
import { useInterviews } from "@/hooks/useInterviews";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import type { Interview } from "@/types";

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

type SortKey = "candidate" | "position" | "date" | "duration" | "score";

type SortDir = "asc" | "desc";

const ITEMS_PER_PAGE = 8;

const Dashboard = () => {
  const { toast } = useToast();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: interviews, isLoading } = useInterviews();
  const stats = useDashboardStats(interviews);

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEmailTemplates, setShowEmailTemplates] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [page, setPage] = useState(1);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "date" ? "desc" : "asc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  // Map DB interviews to display format
  const displayInterviews = useMemo(() => {
    if (!interviews) return [];
    return interviews.map((i) => ({
      id: i.id,
      candidate: i.candidate_name,
      position: i.position,
      date: i.scheduled_at || i.created_at,
      duration: i.duration || "—",
      score: 0, // Score comes from reports, shown as — if no report
      status: i.status,
    }));
  }, [interviews]);

  // For calendar view, map to the format InterviewCalendar expects
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

  const filtered = useMemo(() => {
    let items = displayInterviews.filter(
      (i) =>
        i.candidate.toLowerCase().includes(search.toLowerCase()) ||
        i.position.toLowerCase().includes(search.toLowerCase())
    );

    if (scoreFilter === "high") items = items.filter(i => i.score >= 80);
    else if (scoreFilter === "medium") items = items.filter(i => i.score >= 50 && i.score < 80);
    else if (scoreFilter === "low") items = items.filter(i => i.score < 50);

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

  // Reset page when filters change
  useMemo(() => { setPage(1); }, [search, scoreFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const monthChange = stats.interviewsLastMonth > 0
    ? Math.round(((stats.interviewsThisMonth - stats.interviewsLastMonth) / stats.interviewsLastMonth) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg">AuthentiView</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/dashboard" className="font-medium text-foreground">Dashboard</Link>
              <span className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors">Interviews</span>
              <Link to="/settings" className="text-muted-foreground hover:text-foreground transition-colors">Settings</Link>
          </nav>
          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Interview
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">{initials}</div>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1 text-muted-foreground">
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Interviews This Month</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{stats.interviewsThisMonth}</p>
            {monthChange !== 0 && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${monthChange > 0 ? "text-success" : "text-destructive"}`}>
                <TrendingUp className="h-3 w-3" /> {monthChange > 0 ? "+" : ""}{monthChange}% from last month
              </p>
            )}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Interviews</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{displayInterviews.length}</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.needsReview} completed</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Interviews Today</span>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{stats.interviewsToday}</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.completedToday} completed, {stats.interviewsToday - stats.completedToday} upcoming</p>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
          {/* Interviews Table */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">Recent Interviews</h2>
                  <div className="flex items-center rounded-lg border border-border p-0.5">
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
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                    const headers = ["Candidate", "Position", "Date", "Duration", "Status"];
                    const rows = filtered.map(i => [
                      `"${i.candidate}"`,
                      `"${i.position}"`,
                      new Date(i.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                      i.duration,
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
                    Export CSV
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowEmailTemplates(true)}>
                    <Mail className="h-3.5 w-3.5" />
                    Email Templates
                  </Button>
                  <Link to="/compare">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <GitCompareArrows className="h-3.5 w-3.5" />
                      Compare
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : viewMode === "table" ? (
              <>
              <div className="p-6 pt-0 pb-0">
              <div className="flex items-center gap-3 pb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by candidate or position..."
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
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
                        ) : interview.status === "scheduled" ? (
                          <Link to={`/room/${interview.id}`}>
                            <Button variant="ghost" size="sm">Start</Button>
                          </Link>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        {displayInterviews.length === 0
                          ? "No interviews yet. Create your first one!"
                          : "No interviews found matching your filters."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
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
                  <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
              </>
            ) : (
              <div className="p-6">
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
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-xl p-6">
              <Button onClick={() => setShowCreate(true)} className="w-full gap-2 mb-4">
                <Plus className="h-4 w-4" />
                Create New Interview
              </Button>
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Scheduled Today
                </h3>
                <div className="space-y-3">
                  {stats.scheduledToday.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No interviews scheduled today</p>
                  ) : (
                    stats.scheduledToday.map((iv) => (
                      <div key={iv.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">{iv.candidate_name}</p>
                          <p className="text-muted-foreground text-xs">{iv.position}</p>
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {iv.scheduled_at
                            ? new Date(iv.scheduled_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                            : "—"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-semibold mb-2">Completed</h3>
              <p className="text-3xl font-bold text-success">{stats.needsReview}</p>
              <p className="text-xs text-muted-foreground">Completed interviews with reports</p>
            </motion.div>
          </div>
        </div>
      </main>

      <CreateInterviewDialog open={showCreate} onOpenChange={setShowCreate} />
      <EmailTemplateDialog open={showEmailTemplates} onOpenChange={setShowEmailTemplates} />
    </div>
  );
};

export default Dashboard;
