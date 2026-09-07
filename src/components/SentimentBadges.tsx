import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ThumbsUp, Zap, MessageCircle, Shield } from "lucide-react";

interface SentimentBadgesProps {
  interviewId?: string;
  candidateId?: string;
  compact?: boolean;
  className?: string;
}

interface SentimentIndicator {
  label: string;
  color: string;
  icon: React.ElementType;
}

function getConfidence(score: number): SentimentIndicator {
  if (score >= 80) return { label: "High Confidence", color: "#22c55e", icon: ThumbsUp };
  if (score >= 60) return { label: "Moderate", color: "#3b82f6", icon: ThumbsUp };
  if (score >= 40) return { label: "Low", color: "#f59e0b", icon: ThumbsUp };
  return { label: "Uncertain", color: "#ef4444", icon: ThumbsUp };
}

function getEngagement(score: number): SentimentIndicator {
  if (score >= 80) return { label: "Highly Engaged", color: "#22c55e", icon: Zap };
  if (score >= 60) return { label: "Engaged", color: "#3b82f6", icon: Zap };
  if (score >= 40) return { label: "Passive", color: "#f59e0b", icon: Zap };
  return { label: "Disengaged", color: "#ef4444", icon: Zap };
}

function getFluency(score: number): SentimentIndicator {
  if (score >= 80) return { label: "Fluent", color: "#22c55e", icon: MessageCircle };
  if (score >= 60) return { label: "Clear", color: "#3b82f6", icon: MessageCircle };
  if (score >= 40) return { label: "Average", color: "#f59e0b", icon: MessageCircle };
  return { label: "Hesitant", color: "#ef4444", icon: MessageCircle };
}

function getAuthenticity(score: number): SentimentIndicator {
  if (score >= 80) return { label: "Authentic", color: "#22c55e", icon: Shield };
  if (score >= 60) return { label: "Credible", color: "#3b82f6", icon: Shield };
  if (score >= 40) return { label: "Review", color: "#f59e0b", icon: Shield };
  return { label: "Flagged", color: "#ef4444", icon: Shield };
}

export function SentimentBadges({
  interviewId,
  candidateId,
  compact = false,
  className = "",
}: SentimentBadgesProps) {
  const scores = useQuery(
    api.queries.getScoreBreakdown,
    candidateId || interviewId
      ? { candidateId, interviewId }
      : "skip"
  );

  if (scores === undefined) {
    return (
      <div className={`inline-flex gap-1.5 ${className}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-5 w-16 rounded-full bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (scores === null) return null;

  const fluencyScore = (scores.speechScore + scores.flowScore) / 2;

  const indicators = [
    getConfidence(scores.confidence),
    getEngagement(scores.engagement),
    getFluency(fluencyScore),
    getAuthenticity(scores.overallScore),
  ];

  return (
    <div className={`inline-flex flex-wrap gap-1.5 ${className}`}>
      {indicators.map((indicator) => {
        const Icon = indicator.icon;
        return (
          <span
            key={indicator.label}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: `${indicator.color}1a`,
              color: indicator.color,
            }}
            title={indicator.label}
          >
            <Icon className="h-2.5 w-2.5" />
            {!compact && indicator.label}
          </span>
        );
      })}
    </div>
  );
}

export default SentimentBadges;
