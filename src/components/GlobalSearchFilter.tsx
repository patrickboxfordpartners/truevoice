import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, X, ChevronDown, AlertTriangle } from "lucide-react";

type Stage = "screening" | "technical" | "final" | "offer" | "hired" | "rejected";

export interface FilterState {
  search: string;
  stages: string[];
  scoreRange: [number, number];
  positions: string[];
  flaggedOnly: boolean;
}

interface GlobalSearchFilterProps {
  companyId: string;
  onSelectCandidate: (id: string) => void;
  onFilterChange: (filters: FilterState) => void;
  isOpen: boolean;
  onClose: () => void;
}

const STAGE_CONFIG: { key: Stage; label: string; color: string }[] = [
  { key: "screening", label: "Screening", color: "#3b82f6" },
  { key: "technical", label: "Technical", color: "#a855f7" },
  { key: "final", label: "Final", color: "#f59e0b" },
  { key: "offer", label: "Offer", color: "#22c55e" },
  { key: "hired", label: "Hired", color: "hsl(160,84%,39%)" },
  { key: "rejected", label: "Rejected", color: "#ef4444" },
];

const DEFAULT_FILTERS: FilterState = {
  search: "",
  stages: [],
  scoreRange: [0, 100],
  positions: [],
  flaggedOnly: false,
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function stageColor(stage: string): string {
  return STAGE_CONFIG.find((s) => s.key === stage)?.color ?? "#6b7280";
}

export function GlobalSearchFilter({
  companyId,
  onSelectCandidate,
  onFilterChange,
  isOpen,
  onClose,
}: GlobalSearchFilterProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [showPositions, setShowPositions] = useState(false);

  const searchResults = useQuery(
    api.queries.searchCandidates,
    filters.search.length >= 2
      ? { companyId, searchTerm: filters.search }
      : "skip"
  );

  const allCandidates = useQuery(api.queries.getCandidatesByCompany, { companyId });

  const availablePositions = useMemo(() => {
    if (!allCandidates) return [];
    const set = new Set(allCandidates.map((c) => c.position));
    return [...set].sort();
  }, [allCandidates]);

  const filteredResults = useMemo(() => {
    const source = filters.search.length >= 2 ? searchResults : allCandidates;
    if (!source) return [];

    return source.filter((c) => {
      if (filters.stages.length > 0 && !filters.stages.includes(c.stage)) return false;
      const score = c.overallScore ?? 0;
      if (score < filters.scoreRange[0] || score > filters.scoreRange[1]) return false;
      if (filters.positions.length > 0 && !filters.positions.includes(c.position)) return false;
      if (filters.flaggedOnly && c.flagCount === 0) return false;
      return true;
    });
  }, [searchResults, allCandidates, filters]);

  const updateFilters = useCallback(
    (patch: Partial<FilterState>) => {
      setFilters((prev) => {
        const next = { ...prev, ...patch };
        onFilterChange(next);
        return next;
      });
    },
    [onFilterChange]
  );

  const toggleStage = useCallback(
    (stage: string) => {
      updateFilters({
        stages: filters.stages.includes(stage)
          ? filters.stages.filter((s) => s !== stage)
          : [...filters.stages, stage],
      });
    },
    [filters.stages, updateFilters]
  );

  const togglePosition = useCallback(
    (pos: string) => {
      updateFilters({
        positions: filters.positions.includes(pos)
          ? filters.positions.filter((p) => p !== pos)
          : [...filters.positions, pos],
      });
    },
    [filters.positions, updateFilters]
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setFilters(DEFAULT_FILTERS);
      setShowPositions(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [isOpen, onClose]);

  const hasActiveFilters =
    filters.stages.length > 0 ||
    filters.positions.length > 0 ||
    filters.flaggedOnly ||
    filters.scoreRange[0] > 0 ||
    filters.scoreRange[1] < 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[101] w-full max-w-2xl"
          >
            <div className="glass-card rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-lg overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search candidates by name, email, position, or skill..."
                  value={filters.search}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                />
                {(filters.search || hasActiveFilters) && (
                  <button
                    onClick={() => {
                      setFilters(DEFAULT_FILTERS);
                      onFilterChange(DEFAULT_FILTERS);
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filter pills */}
              <div className="px-4 py-2.5 border-b border-border/50 flex flex-wrap items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

                {/* Stage filters */}
                {STAGE_CONFIG.map((stage) => {
                  const active = filters.stages.includes(stage.key);
                  return (
                    <button
                      key={stage.key}
                      onClick={() => toggleStage(stage.key)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                        active
                          ? "bg-foreground/10 text-foreground ring-1 ring-foreground/20"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: stage.color }}
                      />
                      {stage.label}
                    </button>
                  );
                })}

                <div className="h-4 w-px bg-border mx-1" />

                {/* Flagged toggle */}
                <button
                  onClick={() => updateFilters({ flaggedOnly: !filters.flaggedOnly })}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    filters.flaggedOnly
                      ? "bg-red-500/10 text-red-600 ring-1 ring-red-500/20"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <AlertTriangle className="h-3 w-3" />
                  Flagged
                </button>

                {/* Score range */}
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground">
                  <span className="text-[10px] font-medium">Score</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={filters.scoreRange[0]}
                    onChange={(e) =>
                      updateFilters({
                        scoreRange: [Number(e.target.value), filters.scoreRange[1]],
                      })
                    }
                    className="w-8 bg-transparent text-center outline-none text-foreground"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={filters.scoreRange[1]}
                    onChange={(e) =>
                      updateFilters({
                        scoreRange: [filters.scoreRange[0], Number(e.target.value)],
                      })
                    }
                    className="w-8 bg-transparent text-center outline-none text-foreground"
                  />
                </div>

                {/* Position dropdown */}
                {availablePositions.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowPositions(!showPositions)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                        filters.positions.length > 0
                          ? "bg-foreground/10 text-foreground ring-1 ring-foreground/20"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Position
                      {filters.positions.length > 0 && (
                        <span className="ml-0.5 text-[10px] bg-accent text-white rounded-full h-4 w-4 flex items-center justify-center">
                          {filters.positions.length}
                        </span>
                      )}
                      <ChevronDown className="h-3 w-3" />
                    </button>

                    {showPositions && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-10 py-1 max-h-48 overflow-y-auto">
                        {availablePositions.map((pos) => (
                          <button
                            key={pos}
                            onClick={() => togglePosition(pos)}
                            className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${
                              filters.positions.includes(pos)
                                ? "bg-accent/10 text-accent font-medium"
                                : "text-foreground hover:bg-muted/50"
                            }`}
                          >
                            {pos}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Results */}
              <div className="max-h-[50vh] overflow-y-auto">
                {filteredResults.length > 0 ? (
                  <div className="py-1">
                    <p className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      {filteredResults.length} result{filteredResults.length !== 1 ? "s" : ""}
                    </p>
                    {filteredResults.map((c) => (
                      <button
                        key={c._id}
                        onClick={() => {
                          onSelectCandidate(c._id);
                          onClose();
                        }}
                        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-muted/50 transition-colors"
                      >
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                          style={{ background: stageColor(c.stage) }}
                        >
                          {getInitials(c.candidateName)}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {c.candidateName}
                            </span>
                            {c.flagCount > 0 && (
                              <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground truncate block">
                            {c.position}
                          </span>
                        </div>
                        <span
                          className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{
                            color: stageColor(c.stage),
                            backgroundColor: `${stageColor(c.stage)}15`,
                          }}
                        >
                          {c.stage}
                        </span>
                        {c.overallScore != null && (
                          <span
                            className={`text-xs font-bold tabular-nums ${
                              c.overallScore >= 80
                                ? "text-emerald-600"
                                : c.overallScore >= 60
                                  ? "text-blue-600"
                                  : c.overallScore >= 40
                                    ? "text-amber-600"
                                    : "text-red-500"
                            }`}
                          >
                            {c.overallScore}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Search className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">
                      {filters.search.length >= 2
                        ? "No candidates match your search"
                        : "Type at least 2 characters or use filters"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default GlobalSearchFilter;
