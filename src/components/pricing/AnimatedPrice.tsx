import { useEffect, useRef, useState } from "react";

interface AnimatedPriceProps {
  value: number;
  duration?: number;
}

const AnimatedPrice = ({ value, duration = 400 }: AnimatedPriceProps) => {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = value;
    if (from === to) return;

    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>${display}</>;
};

export default AnimatedPrice;
