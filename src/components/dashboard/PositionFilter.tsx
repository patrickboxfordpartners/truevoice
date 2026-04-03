import { cn } from "@/lib/utils";

interface PositionFilterProps {
  positions: string[];
  selected: string;
  onChange: (position: string) => void;
}

export const PositionFilter = ({ positions, selected, onChange }: PositionFilterProps) => {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        onClick={() => onChange("all")}
        className={cn(
          "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
          selected === "all"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        All
      </button>
      {positions.map((pos) => (
        <button
          key={pos}
          onClick={() => onChange(pos)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
            selected === pos
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {pos}
        </button>
      ))}
    </div>
  );
};
