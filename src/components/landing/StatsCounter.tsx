import { useCountUp } from "@/hooks/useCountUp";

interface StatProps {
  value: number;
  suffix?: string;
  label: string;
}

const StatItem = ({ value, suffix = "", label }: StatProps) => {
  const { count, ref } = useCountUp(value);
  return (
    <div className="text-center">
      <p ref={ref as React.RefObject<HTMLParagraphElement>} className="text-4xl font-extrabold text-gradient">
        {count}{suffix}
      </p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
};

export default StatItem;
