import { useEffect, useState } from "react";

interface ScoreGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  animated?: boolean;
}

const getScoreColor = (score: number) => {
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
};

const getScoreStroke = (score: number) => {
  if (score >= 75) return "stroke-success";
  if (score >= 50) return "stroke-warning";
  return "stroke-destructive";
};

const getScoreLabel = (score: number) => {
  if (score >= 75) return "High Authenticity";
  if (score >= 50) return "Moderate";
  return "Low Authenticity";
};

export const ScoreGauge = ({ score, size = 120, strokeWidth = 8, showLabel = true, animated = true }: ScoreGaugeProps) => {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;

  useEffect(() => {
    if (!animated) return;
    const timer = setTimeout(() => setDisplayScore(score), 100);
    return () => clearTimeout(timer);
  }, [score, animated]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-muted"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className={getScoreStroke(score)}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: animated ? "stroke-dashoffset 1.5s ease-out" : "none" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{Math.round(displayScore)}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      {showLabel && (
        <span className={`text-sm font-medium ${getScoreColor(score)}`}>
          {getScoreLabel(score)}
        </span>
      )}
    </div>
  );
};

export { getScoreColor, getScoreLabel };
