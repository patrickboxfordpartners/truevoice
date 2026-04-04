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
      <p ref={ref as React.RefObject<HTMLParagraphElement>} className="text-4xl font-extrabold text-gray-900">
        {count}{suffix}
      </p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
};

export default StatItem;
