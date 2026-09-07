import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const STAGES = [
  { key: "screening", label: "Screening", color: "bg-blue-500" },
  { key: "technical", label: "Technical", color: "bg-purple-500" },
  { key: "final", label: "Final", color: "bg-amber-500" },
  { key: "offer", label: "Offer", color: "bg-emerald-500" },
  { key: "hired", label: "Hired", color: "bg-[hsl(160,84%,39%)]" },
] as const;

type StageKey = (typeof STAGES)[number]["key"];

function conversionRate(from: number, to: number): string {
  if (from === 0) return "-";
  return `${Math.round((to / from) * 100)}%`;
}

export default function PipelineFunnel() {
  const { company } = useAuth();
  const companyId = company?.id || "demo-company";

  const stats = useQuery(api.queries.getPipelineFunnelStats, { companyId });

  if (!stats || stats.total === 0) return null;

  const maxCount = Math.max(
    ...STAGES.map((s) => stats[s.key as StageKey] || 0),
    1
  );

  return (
    <Card className="border-border">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <ArrowRight className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Pipeline Funnel</h3>
          <span className="text-xs text-muted-foreground">
            {stats.total} candidates
          </span>
        </div>

        {/* Funnel bars */}
        <div className="space-y-2">
          {STAGES.map((stage, i) => {
            const count = stats[stage.key as StageKey] || 0;
            const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const nextCount =
              i < STAGES.length - 1
                ? stats[STAGES[i + 1].key as StageKey] || 0
                : null;

            return (
              <motion.div
                key={stage.key}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-20 text-right shrink-0">
                    {stage.label}
                  </span>
                  <div className="flex-1 h-7 bg-muted/30 rounded-md overflow-hidden relative">
                    <motion.div
                      className={`h-full ${stage.color} rounded-md`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(pct, 4)}%` }}
                      transition={{ duration: 0.5, delay: i * 0.06 }}
                    />
                    <span className="absolute inset-0 flex items-center px-2 text-xs font-semibold tabular-nums">
                      <span className={count > 0 ? "text-white drop-shadow-sm" : "text-muted-foreground"}>
                        {count}
                      </span>
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground w-10 shrink-0 tabular-nums">
                    {nextCount !== null ? conversionRate(count, nextCount) : ""}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Rejected - separate */}
        {stats.rejected > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-3 pt-3 border-t border-border"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-20 text-right shrink-0">
                Rejected
              </span>
              <div className="flex-1 h-7 bg-muted/30 rounded-md overflow-hidden relative">
                <motion.div
                  className="h-full bg-destructive/70 rounded-md"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.max(
                      (stats.rejected / maxCount) * 100,
                      4
                    )}%`,
                  }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                />
                <span className="absolute inset-0 flex items-center px-2 text-xs font-semibold tabular-nums text-white drop-shadow-sm">
                  {stats.rejected}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground w-10 shrink-0" />
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
