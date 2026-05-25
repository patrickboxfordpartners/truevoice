import { motion, useReducedMotion, useMotionValue, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef } from "react";

const ease = [0.16, 1, 0.3, 1];

const WaveformBar = ({ height, delay }: { height: number; delay: number }) => (
  <motion.div
    className="w-1 rounded-full bg-accent/40"
    style={{ height }}
    animate={{ scaleY: [1, 0.5, 1.2, 0.7, 1] }}
    transition={{ duration: 2.5, delay, repeat: Infinity, ease: "easeInOut" }}
  />
);

const AnimatedScore = ({ value, label }: { value: string; label: string }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs text-muted-foreground">{label}</span>
    <motion.span
      className="text-sm font-semibold text-foreground"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 1.2, ease }}
    >
      {value}
    </motion.span>
  </div>
);

const PulsingDot = () => (
  <motion.div
    className="w-2 h-2 rounded-full bg-accent"
    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
  />
);

const MockPanel = ({
  title,
  children,
  className = "",
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      className={`bg-card border border-border rounded-xl p-5 shadow-soft transition-shadow duration-300 hover:shadow-elevated ${className}`}
      initial={prefersReducedMotion ? undefined : { opacity: 0, x: 30, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.8, delay, ease }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">{title}</p>
        <PulsingDot />
      </div>
      {children}
    </motion.div>
  );
};

const LogLine = ({ label, value, accent = false, delay = 0 }: { label: string; value: string; accent?: boolean; delay?: number }) => (
  <motion.div
    className="flex justify-between"
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay, ease }}
  >
    <span className="text-muted-foreground">{label}</span>
    <span className={`font-medium ${accent ? "text-accent" : "text-foreground"}`}>{value}</span>
  </motion.div>
);

const Hero = () => {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const panelRotateX = useTransform(mouseY, [-300, 300], [3, -3]);
  const panelRotateY = useTransform(mouseX, [-300, 300], [-3, 3]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (prefersReducedMotion) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const anim = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease },
        };

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="text-center lg:text-left">
          <motion.p
            className="text-sm font-medium tracking-wide text-muted-foreground uppercase mb-5"
            {...anim(0)}
          >
            Interview Authenticity Platform
          </motion.p>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] leading-[1.08] text-foreground mb-6"
            {...anim(0.1)}
          >
            Know who you're{" "}
            <span className="text-accent">actually</span> hiring
          </motion.h1>

          <motion.p
            className="text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8"
            {...anim(0.2)}
          >
            Real-time speech, visual, and behavioral analysis detects scripted and
            AI-assisted interview responses. Make confident hiring decisions with
            objective authenticity data.
          </motion.p>

          <motion.div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4" {...anim(0.3)}>
            <Button size="lg" asChild className="rounded-md bg-foreground text-background hover:bg-accent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
              <Link to="/demo">
                Try demo
                <ArrowRight size={16} className="ml-2" />
              </Link>
            </Button>
            <Button variant="ghost" size="lg" asChild className="text-muted-foreground hover:text-foreground">
              <Link to="/pricing">View pricing</Link>
            </Button>
          </motion.div>
        </div>

        <motion.div
          ref={containerRef}
          className="relative hidden lg:block perspective-[1200px]"
          style={{ rotateX: panelRotateX, rotateY: panelRotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <MockPanel title="Speech Analysis" className="relative z-10" delay={0.4}>
            <div className="flex items-end gap-1 h-12 mb-3">
              {[28, 16, 32, 12, 24, 36, 20, 28, 14, 32, 18, 26, 30, 16, 22, 34, 20, 28, 14, 24].map((h, i) => (
                <WaveformBar key={i} height={h} delay={i * 0.08} />
              ))}
            </div>
            <div className="flex items-center justify-between">
              <AnimatedScore label="Authenticity" value="94%" />
              <AnimatedScore label="Flow" value="Natural" />
            </div>
          </MockPanel>

          <MockPanel title="Visual Monitoring" className="relative z-20 -mt-3 ml-8" delay={0.55}>
            <div className="bg-muted rounded-lg h-24 mb-3 flex items-center justify-center relative overflow-hidden">
              <motion.div
                className="w-10 h-10 rounded-full border-2 border-accent/50 flex items-center justify-center"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-2 h-2 rounded-full bg-accent" />
              </motion.div>
              <motion.div
                className="absolute top-2 right-2 text-[10px] font-mono text-accent flex items-center gap-1"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                LIVE
              </motion.div>
              <div className="absolute inset-0 border border-accent/10 rounded-lg pointer-events-none">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-accent/30 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-accent/30 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-accent/30 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-accent/30 rounded-br-lg" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <LogLine label="Gaze" value="Centered" delay={1.0} />
              <LogLine label="Devices" value="None" delay={1.1} />
            </div>
          </MockPanel>

          <MockPanel title="Browser Activity" className="relative z-10 -mt-3 mr-12" delay={0.7}>
            <div className="space-y-1.5 font-mono text-xs">
              <LogLine label="Tab focus" value="Active" accent delay={1.2} />
              <LogLine label="Clipboard" value="Clean" delay={1.3} />
              <LogLine label="Window" value="Primary" delay={1.4} />
            </div>
          </MockPanel>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
