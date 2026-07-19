// src/components/landing/Hero.tsx
import { motion, useReducedMotion, useMotionValue, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import { useRef } from "react"

const ease = [0.16, 1, 0.3, 1]

const PulsingDot = () => (
  <motion.div
    className="w-2 h-2 rounded-full bg-accent"
    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
  />
)

const MockPanel = ({
  title,
  children,
  className = "",
  delay = 0,
}: {
  title: string
  children: React.ReactNode
  className?: string
  delay?: number
}) => {
  const prefersReducedMotion = useReducedMotion()
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
  )
}

const ScoreRow = ({ label, value, pct, delay = 0 }: { label: string; value: string; pct: number; delay?: number }) => (
  <motion.div
    className="space-y-1"
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay, ease }}
  >
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-accent"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, delay: delay + 0.3, ease }}
      />
    </div>
  </motion.div>
)

const LogLine = ({ label, value, accent = false, delay = 0 }: { label: string; value: string; accent?: boolean; delay?: number }) => (
  <motion.div
    className="flex justify-between text-xs"
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay, ease }}
  >
    <span className="text-muted-foreground">{label}</span>
    <span className={`font-medium ${accent ? "text-accent" : "text-foreground"}`}>{value}</span>
  </motion.div>
)

const Hero = () => {
  const prefersReducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const panelRotateX = useTransform(mouseY, [-300, 300], [3, -3])
  const panelRotateY = useTransform(mouseX, [-300, 300], [-3, 3])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (prefersReducedMotion) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    mouseX.set(e.clientX - rect.left - rect.width / 2)
    mouseY.set(e.clientY - rect.top - rect.height / 2)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const anim = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease },
        }

  return (
    <section className="relative lg:min-h-[90vh] flex items-center overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-20">
      <div className="max-w-6xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="text-center lg:text-left">
          <motion.p
            className="text-sm font-medium tracking-wide text-muted-foreground uppercase mb-5"
            {...anim(0)}
          >
            Interview Intelligence Platform
          </motion.p>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] leading-[1.08] text-foreground mb-6"
            {...anim(0.1)}
          >
            Every interview,{" "}
            <span className="text-accent">analyzed.</span>
          </motion.h1>

          <motion.p
            className="text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8"
            {...anim(0.2)}
          >
            TrueVoice gives hiring teams structured, comparable data from every
            conversation — so decisions are easier to make and easier to defend.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4"
            {...anim(0.3)}
          >
            <Button
              size="lg"
              asChild
              className="rounded-md bg-foreground text-background hover:bg-accent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated"
            >
              <Link to="/demo">
                Book a Demo
                <ArrowRight size={16} className="ml-2" />
              </Link>
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
          <MockPanel title="Intelligence Score" className="relative z-10" delay={0.4}>
            <div className="flex items-center gap-4 mb-3">
              <div className="text-4xl font-bold text-accent tabular-nums">87</div>
              <div className="flex-1 space-y-2">
                <ScoreRow label="Communication Quality" value="22/25" pct={88} delay={0.8} />
                <ScoreRow label="Interview Presence" value="21/25" pct={84} delay={0.9} />
              </div>
            </div>
          </MockPanel>

          <MockPanel title="Behavioral Signals" className="relative z-20 -mt-3 ml-8" delay={0.55}>
            <div className="space-y-1.5">
              <LogLine label="Tab focus" value="Active" accent delay={1.0} />
              <LogLine label="Response timing" value="Natural" accent delay={1.1} />
              <LogLine label="Consistency" value="High" accent delay={1.2} />
            </div>
          </MockPanel>

          <MockPanel title="Candidate Comparison" className="relative z-10 -mt-3 mr-12" delay={0.7}>
            <div className="space-y-2">
              {[
                { name: "Jordan M.", score: 87 },
                { name: "Alex T.", score: 74 },
                { name: "Casey R.", score: 61 },
              ].map((c, i) => (
                <motion.div
                  key={c.name}
                  className="flex items-center gap-2 text-xs"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 1.2 + i * 0.1, ease }}
                >
                  <div className="h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center text-[9px] font-bold text-accent">
                    {c.name[0]}
                  </div>
                  <span className="flex-1 text-muted-foreground">{c.name}</span>
                  <span className="font-semibold text-foreground">{c.score}</span>
                </motion.div>
              ))}
            </div>
          </MockPanel>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero
