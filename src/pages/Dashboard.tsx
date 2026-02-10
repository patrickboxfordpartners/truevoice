import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, TrendingUp, Calendar, Users, Shield, LogOut, Settings, ChevronDown, Clock, ArrowUp, ArrowDown, ArrowUpDown, Filter, X, ChevronLeft, ChevronRight, GitCompareArrows, Download, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScoreBadge } from "@/components/ScoreBadge";
import { CreateInterviewDialog } from "@/components/CreateInterviewDialog";

type SortKey = "candidate" | "position" | "date" | "duration" | "score";
type SortDir = "asc" | "desc";

const ITEMS_PER_PAGE = 8;

const mockInterviews = [
  { id: "1", candidate: "Sarah Chen", position: "Senior Frontend Engineer", date: "2026-02-10T14:00:00", duration: "42:15", score: 87 },
  { id: "2", candidate: "James Wilson", position: "Product Manager", date: "2026-02-10T10:30:00", duration: "38:20", score: 62 },
  { id: "3", candidate: "Emily Rodriguez", position: "UX Designer", date: "2026-02-09T15:00:00", duration: "45:10", score: 91 },
  { id: "4", candidate: "Michael Park", position: "Backend Developer", date: "2026-02-09T11:00:00", duration: "35:45", score: 34 },
  { id: "5", candidate: "Lisa Thompson", position: "Data Analyst", date: "2026-02-08T09:00:00", duration: "40:00", score: 78 },
  { id: "6", candidate: "David Kim", position: "DevOps Engineer", date: "2026-02-07T16:00:00", duration: "37:30", score: 55 },
  { id: "7", candidate: "Rachel Adams", position: "QA Engineer", date: "2026-02-06T13:00:00", duration: "33:50", score: 73 },
  { id: "8", candidate: "Tom Harris", position: "Full Stack Developer", date: "2026-02-06T10:00:00", duration: "41:20", score: 88 },
  { id: "9", candidate: "Nina Patel", position: "Product Designer", date: "2026-02-05T14:30:00", duration: "39:10", score: 45 },
  { id: "10", candidate: "Carlos Mendez", position: "iOS Developer", date: "2026-02-05T09:00:00", duration: "36:40", score: 82 },
  { id: "11", candidate: "Sophie Turner", position: "Marketing Analyst", date: "2026-02-04T15:00:00", duration: "44:05", score: 67 },
  { id: "12", candidate: "Alex Novak", position: "Security Engineer", date: "2026-02-04T11:00:00", duration: "38:55", score: 94 },
  { id: "13", candidate: "Jordan Lee", position: "ML Engineer", date: "2026-02-03T14:00:00", duration: "47:30", score: 29 },
  { id: "14", candidate: "Priya Sharma", position: "Technical Writer", date: "2026-02-03T10:00:00", duration: "32:15", score: 71 },
  { id: "15", candidate: "Marcus Brown", position: "SRE", date: "2026-02-02T16:00:00", duration: "35:00", score: 58 },
  { id: "16", candidate: "Olivia Zhang", position: "Data Engineer", date: "2026-02-02T09:00:00", duration: "43:20", score: 85 },
  { id: "17", candidate: "Ethan Wright", position: "Android Developer", date: "2026-02-01T13:00:00", duration: "37:45", score: 41 },
  { id: "18", candidate: "Mia Johansson", position: "Scrum Master", date: "2026-02-01T10:00:00", duration: "30:10", score: 76 },
];

const Dashboard = () => {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

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

  const filtered = useMemo(() => {
    let items = mockInterviews.filter(
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
  }, [search, scoreFilter, sortKey, sortDir]);

  // Reset page when filters change
  useMemo(() => { setPage(1); }, [search, scoreFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

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
            <span className="font-medium text-foreground">Dashboard</span>
            <span className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors">Interviews</span>
            <span className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors">Settings</span>
          </nav>
          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Interview
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">JD</div>
              <ChevronDown className="h-3.5 w-3.5" />
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
            <p className="text-3xl font-bold">24</p>
            <p className="text-xs text-success mt-1 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +12% from last month</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Avg. Authenticity Score</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">72<span className="text-lg text-muted-foreground">/100</span></p>
            <p className="text-xs text-success mt-1 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +3 pts from last month</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Interviews Today</span>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">3</p>
            <p className="text-xs text-muted-foreground mt-1">2 completed, 1 upcoming</p>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
          {/* Interviews Table */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recent Interviews</h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                    const headers = ["Candidate", "Position", "Date", "Duration", "Score"];
                    const rows = filtered.map(i => [
                      `"${i.candidate}"`,
                      `"${i.position}"`,
                      new Date(i.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                      i.duration,
                      i.score,
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
                  <Link to="/compare">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <GitCompareArrows className="h-3.5 w-3.5" />
                      Compare
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-3">
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
                    <SelectItem value="medium">Medium (50–79)</SelectItem>
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
                    <th className="px-6 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("duration")}>
                      <span className="inline-flex items-center gap-1.5">Duration <SortIcon col="duration" /></span>
                    </th>
                    <th className="px-6 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("score")}>
                      <span className="inline-flex items-center gap-1.5">Score <SortIcon col="score" /></span>
                    </th>
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
                      <td className="px-6 py-4 text-muted-foreground text-sm">{interview.duration}</td>
                      <td className="px-6 py-4"><ScoreBadge score={interview.score} /></td>
                      <td className="px-6 py-4">
                        <Link to={`/report/${interview.id}`}>
                          <Button variant="ghost" size="sm">View Report</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        No interviews found matching your filters.
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
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">Anna Lewis</p>
                      <p className="text-muted-foreground text-xs">Marketing Lead</p>
                    </div>
                    <span className="text-muted-foreground text-xs">3:00 PM</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-semibold mb-2">Needs Review</h3>
              <p className="text-3xl font-bold text-warning">2</p>
              <p className="text-xs text-muted-foreground">Completed interviews not yet viewed</p>
            </motion.div>
          </div>
        </div>
      </main>

      <CreateInterviewDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
};

export default Dashboard;
