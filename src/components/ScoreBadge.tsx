import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  className?: string;
}

export const ScoreBadge = ({ score, className }: ScoreBadgeProps) => {
  const variant = score >= 75 ? "score-badge-high" : score >= 50 ? "score-badge-medium" : "score-badge-low";
  
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold", variant, className)}>
      <span className={cn(
        "h-2 w-2 rounded-full",
        score >= 75 ? "bg-success" : score >= 50 ? "bg-warning" : "bg-destructive"
      )} />
      {score}
    </span>
  );
};
