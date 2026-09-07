import { useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, PanInfo } from "framer-motion";
import { ArrowLeft, Orbit, AlertTriangle } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { JoanAvatar } from "@/components/JoanAvatar";
import { useToast } from "@/hooks/use-toast";

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
}

const ACTIVE_STAGES: Stage[] = ["hired", "offer", "final", "technical", "screening"];

const STAGE_CONFIG: Record<string, { label: string; color: string; ringColor: string; radius: number }> = {
  hired:     { label: "Hired",      color: "#0fba81", ringColor: "rgba(15,186,129,0.25)",  radius: 100 },
  offer:     { label: "Offer",      color: "#22c55e", ringColor: "rgba(34,197,94,0.25)",   radius: 170 },
  final:     { label: "Final",      color: "#f59e0b", ringColor: "rgba(245,158,11,0.25)",  radius: 240 },
  technical: { label: "Technical",  color: "#a855f7", ringColor: "rgba(168,85,247,0.25)",  radius: 310 },
  screening: { label: "Screening",  color: "#3b82f6", ringColor: "rgba(59,130,246,0.25)",  radius: 380 },
};

const VIEW_SIZE = 860;
const CENTER = VIEW_SIZE / 2;

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function getNodeSize(score?: number): number {
  if (!score) return 36;
  if (score >= 80) return 44;
  if (score >= 60) return 40;
  return 34;
}

function closestStage(distFromCenter: number): Stage {
  let best: Stage = "screening";
  let bestDiff = Infinity;
  for (const stage of ACTIVE_STAGES) {
    const diff = Math.abs(distFromCenter - STAGE_CONFIG[stage].radius);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = stage;
    }
  }
  return best;
}

function CandidateNode({
  candidate,
  pctX,
  pctY,
  containerRef,
  onDragEnd,
  onClick,
}: {
  candidate: Candidate;
  pctX: number;
  pctY: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onDragEnd: (id: Id<"hiring_pipeline">, newStage: Stage) => void;
  onClick: (id: Id<"hiring_pipeline">) => void;
}) {
  const size = getNodeSize(candidate.overallScore);
  const config = STAGE_CONFIG[candidate.stage];
  const [isDragging, setIsDragging] = useState(false);
  const didDrag = useRef(false);

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const containerSize = rect.width;
    const scale = containerSize / VIEW_SIZE;

    const nodeX = (pctX / 100) * containerSize + info.offset.x;
    const nodeY = (pctY / 100) * containerSize + info.offset.y;
    const centerPx = containerSize / 2;
    const dist = Math.sqrt((nodeX - centerPx) ** 2 + (nodeY - centerPx) ** 2) / scale;

    const newStage = closestStage(dist);
    if (newStage !== candidate.stage) {
      onDragEnd(candidate._id, newStage);
    }

    setTimeout(() => { didDrag.current = false; }, 50);
  }, [pctX, pctY, containerRef, candidate._id, candidate.stage, onDragEnd]);

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.1}
      dragSnapToOrigin
      onDragStart={() => { setIsDragging(true); didDrag.current = true; }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.2, zIndex: 50 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay: Math.random() * 0.3 }}
      className="absolute cursor-grab active:cursor-grabbing group"
      style={{
        left: `${pctX}%`,
        top: `${pctY}%`,
        transform: "translate(-50%, -50%)",
        zIndex: isDragging ? 50 : 20,
      }}
      onClick={(e) => {
        if (!didDrag.current) {
          e.stopPropagation();
          onClick(candidate._id);
        }
      }}
      title={`${candidate.candidateName} — ${candidate.position} (${candidate.overallScore ?? "N/A"})`}
    >
      <div
        className="relative rounded-full flex items-center justify-center text-white font-semibold shadow-lg border-2 transition-shadow"
        style={{
          width: size,
          height: size,
          fontSize: size < 38 ? 11 : 13,
          background: `linear-gradient(135deg, ${config.color}, ${config.color}cc)`,
          borderColor: isDragging ? "#fff" : `${config.color}88`,
          boxShadow: isDragging
            ? `0 0 20px ${config.color}80, 0 8px 32px rgba(0,0,0,0.3)`
            : `0 2px 8px ${config.color}40`,
        }}
      >
        {getInitials(candidate.candidateName)}

        {candidate.flagCount > 0 && (
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 border-2 border-background animate-pulse" />
        )}

        {candidate.overallScore != null && (
          <span
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold rounded-full px-1.5 bg-background/90 backdrop-blur-sm border shadow-sm"
            style={{ color: config.color, borderColor: `${config.color}40` }}
          >
            {candidate.overallScore}
          </span>
        )}
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[60]">
        <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded-md shadow-lg border">
          {candidate.candidateName}
        </div>
      </div>
    </motion.div>
  );
}

function RejectedRow({
  candidates,
  onClick,
}: {
  candidates: Candidate[];
  onClick: (id: Id<"hiring_pipeline">) => void;
}) {
  if (candidates.length === 0) return null;
  return (
    <div className="mt-6 px-4 w-full max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-3 text-muted-foreground text-sm">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <span>Rejected ({candidates.length})</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {candidates.map((c) => (
          <motion.button
            key={c._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => onClick(c._id)}
            className="h-8 w-8 rounded-full bg-muted/50 border border-border/50 text-muted-foreground text-[10px] font-semibold flex items-center justify-center hover:bg-muted transition-colors"
            title={`${c.candidateName} — ${c.position}`}
          >
            {getInitials(c.candidateName)}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default function JoanOrbit() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const orbitRef = useRef<HTMLDivElement>(null);

  const candidates = useQuery(api.queries.getCandidatesByCompany, { companyId: "demo-company" }) as Candidate[] | undefined;
  const moveStage = useMutation(api.mutations.moveCandidateStage);

  const [hoveredStage, setHoveredStage] = useState<Stage | null>(null);

  const { orbitCandidates, rejectedCandidates } = useMemo(() => {
    if (!candidates) return { orbitCandidates: [], rejectedCandidates: [] };
    const orbit: Candidate[] = [];
    const rejected: Candidate[] = [];
    for (const c of candidates) {
      if (c.stage === "rejected") rejected.push(c);
      else orbit.push(c);
    }
    return { orbitCandidates: orbit, rejectedCandidates: rejected };
  }, [candidates]);

  const candidatePositions = useMemo(() => {
    const byStage: Record<string, Candidate[]> = {};
    for (const c of orbitCandidates) {
      if (!byStage[c.stage]) byStage[c.stage] = [];
      byStage[c.stage].push(c);
    }

    const positions: { candidate: Candidate; pctX: number; pctY: number }[] = [];
    for (const stage of ACTIVE_STAGES) {
      const group = byStage[stage] || [];
      const config = STAGE_CONFIG[stage];
      group.forEach((c, i) => {
        const offset = group.length === 1 ? 0 : (Math.PI * 2 * i) / group.length;
        const angle = offset - Math.PI / 2;
        const px = CENTER + config.radius * Math.cos(angle);
        const py = CENTER + config.radius * Math.sin(angle);
        positions.push({
          candidate: c,
          pctX: (px / VIEW_SIZE) * 100,
          pctY: (py / VIEW_SIZE) * 100,
        });
      });
    }
    return positions;
  }, [orbitCandidates]);

  const handleDragEnd = useCallback(
    async (id: Id<"hiring_pipeline">, newStage: Stage) => {
      try {
        await moveStage({ candidateId: id, newStage, movedBy: "manual" });
        toast({ title: "Stage updated", description: `Moved to ${STAGE_CONFIG[newStage].label}` });
      } catch {
        toast({ title: "Error", description: "Failed to update stage", variant: "destructive" });
      }
    },
    [moveStage, toast]
  );

  const handleClick = useCallback(
    (id: Id<"hiring_pipeline">) => navigate(`/joan-candidate/${id}`),
    [navigate]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/joan-pipeline")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Pipeline
          </Button>
          <div className="flex items-center gap-2">
            <Orbit className="h-5 w-5 text-accent" />
            <h1 className="text-lg font-semibold">Orbit View</h1>
          </div>
          {candidates && (
            <span className="text-sm text-muted-foreground ml-auto">
              {orbitCandidates.length} active &middot; {rejectedCandidates.length} rejected
            </span>
          )}
        </div>
      </div>

      {/* Orbit visualization */}
      <div className="flex flex-col items-center pt-6 pb-4">
        <div
          ref={orbitRef}
          className="relative"
          style={{ width: "min(90vw, 860px)", aspectRatio: "1/1" }}
        >
          {/* SVG rings background */}
          <svg
            viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            <defs>
              <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(15,186,129,0.3)" />
                <stop offset="100%" stopColor="rgba(15,186,129,0)" />
              </radialGradient>
            </defs>

            {ACTIVE_STAGES.map((stage) => {
              const config = STAGE_CONFIG[stage];
              const isHovered = hoveredStage === stage;
              return (
                <circle
                  key={stage}
                  cx={CENTER}
                  cy={CENTER}
                  r={config.radius}
                  fill="none"
                  stroke={isHovered ? config.color : config.ringColor}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  strokeDasharray="8 6"
                  opacity={isHovered ? 0.9 : 0.6}
                  style={{ transition: "all 0.3s ease" }}
                />
              );
            })}

            <circle cx={CENTER} cy={CENTER} r={60} fill="url(#center-glow)" />
          </svg>

          {/* Joan avatar at center */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="relative">
              <div className="absolute inset-0 -m-4 rounded-full bg-accent/10 animate-pulse" />
              <JoanAvatar size="lg" showPulse />
            </div>
          </div>

          {/* Stage labels */}
          {ACTIVE_STAGES.map((stage) => {
            const config = STAGE_CONFIG[stage];
            const pctY = ((CENTER - config.radius - 14) / VIEW_SIZE) * 100;
            return (
              <div
                key={`label-${stage}`}
                className="absolute text-[10px] font-medium tracking-wide uppercase select-none cursor-default"
                style={{
                  left: "50%",
                  top: `${pctY}%`,
                  transform: "translate(-50%, -50%)",
                  color: config.color,
                  opacity: hoveredStage === stage ? 1 : 0.7,
                  transition: "opacity 0.2s",
                  zIndex: 5,
                }}
                onMouseEnter={() => setHoveredStage(stage)}
                onMouseLeave={() => setHoveredStage(null)}
              >
                {config.label}
              </div>
            );
          })}

          {/* Candidate nodes */}
          {candidatePositions.map(({ candidate, pctX, pctY }) => (
            <CandidateNode
              key={candidate._id}
              candidate={candidate}
              pctX={pctX}
              pctY={pctY}
              containerRef={orbitRef}
              onDragEnd={handleDragEnd}
              onClick={handleClick}
            />
          ))}
        </div>

        {/* Rejected row */}
        <RejectedRow candidates={rejectedCandidates} onClick={handleClick} />
      </div>

      {/* Legend */}
      <div className="fixed bottom-6 left-6 bg-card/90 backdrop-blur-md border border-border/50 rounded-xl shadow-lg px-4 py-3 z-30">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-medium">Stages</p>
        <div className="flex flex-col gap-1.5">
          {ACTIVE_STAGES.slice().reverse().map((stage) => {
            const config = STAGE_CONFIG[stage];
            return (
              <div
                key={stage}
                className="flex items-center gap-2 cursor-default"
                onMouseEnter={() => setHoveredStage(stage)}
                onMouseLeave={() => setHoveredStage(null)}
              >
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: config.color }} />
                <span className="text-xs text-muted-foreground">{config.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loading overlay */}
      {!candidates && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <span className="text-sm text-muted-foreground">Loading orbit...</span>
          </div>
        </div>
      )}
    </div>
  );
}
