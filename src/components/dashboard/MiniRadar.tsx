interface MiniRadarProps {
  speech: number;
  timing: number;
  flow: number;
  linguistic: number;
  size?: number;
  overall?: number;
}

const getColor = (score: number) => {
  if (score >= 75) return { fill: "rgba(34, 140, 100, 0.15)", stroke: "hsl(160, 84%, 39%)" };
  if (score >= 50) return { fill: "rgba(234, 170, 20, 0.15)", stroke: "hsl(38, 92%, 50%)" };
  return { fill: "rgba(220, 60, 60, 0.15)", stroke: "hsl(0, 84%, 60%)" };
};

export const MiniRadar = ({ speech, timing, flow, linguistic, size = 80, overall = 0 }: MiniRadarProps) => {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 4;

  // Normalize scores from 0-25 to 0-1
  const axes = [
    speech / 25,
    timing / 25,
    flow / 25,
    linguistic / 25,
  ];

  // 4 axes at 90-degree intervals, starting from top
  const angles = [
    -Math.PI / 2,        // top (speech)
    0,                    // right (timing)
    Math.PI / 2,          // bottom (flow)
    Math.PI,              // left (linguistic)
  ];

  const points = axes.map((v, i) => {
    const r = Math.max(v, 0.08) * maxR; // minimum radius so shape is always visible
    return {
      x: cx + r * Math.cos(angles[i]),
      y: cy + r * Math.sin(angles[i]),
    };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";

  // Grid lines at 33%, 66%, 100%
  const gridLevels = [0.33, 0.66, 1];
  const { fill, stroke } = getColor(overall || (speech + timing + flow + linguistic));

  return (
    <svg width={size} height={size} className="flex-shrink-0">
      {/* Grid */}
      {gridLevels.map((level) => {
        const r = level * maxR;
        const gridPoints = angles
          .map((a) => `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`)
          .join(" ");
        return (
          <polygon
            key={level}
            points={gridPoints}
            fill="none"
            className="stroke-border"
            strokeWidth={0.5}
            opacity={0.5}
          />
        );
      })}
      {/* Axis lines */}
      {angles.map((a, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={cx + maxR * Math.cos(a)}
          y2={cy + maxR * Math.sin(a)}
          className="stroke-border"
          strokeWidth={0.5}
          opacity={0.3}
        />
      ))}
      {/* Data shape */}
      <path
        d={pathD}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2} fill={stroke} />
      ))}
    </svg>
  );
};
