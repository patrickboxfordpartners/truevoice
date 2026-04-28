import { motion, useReducedMotion } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";

const ease = [0.16, 1, 0.3, 1];

const steps = [
  { num: "01", title: "Schedule", description: "Create an interview link in seconds. Share it with your candidate via email." },
  { num: "02", title: "Interview", description: "Run a normal video interview while our engine analyzes speech, visual, and browser behavior in real time." },
  { num: "03", title: "Review", description: "Get a detailed authenticity report with score breakdowns and flagged moments, immediately after." },
];

const StepCard = ({ step, index }: { step: typeof steps[0]; index: number }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <ScrollReveal delay={index * 0.15}>
      <motion.div
        className="relative text-center lg:text-left group cursor-default"
        whileHover={prefersReducedMotion ? {} : { y: -4, transition: { duration: 0.2, ease } }}
      >
        <motion.span
          className="text-7xl sm:text-8xl font-extrabold text-border/50 leading-none select-none block"
          whileHover={prefersReducedMotion ? {} : { color: "hsl(160, 84%, 39%)", transition: { duration: 0.3 } }}
        >
          {step.num}
        </motion.span>
        <h3 className="text-xl font-semibold text-foreground mt-3 mb-2 group-hover:text-accent transition-colors duration-300">{step.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto lg:mx-0">{step.description}</p>
      </motion.div>
    </ScrollReveal>
  );
};

const HowItWorks = () => (
  <section id="how-it-works" className="py-24 sm:py-28 px-4 sm:px-6">
    <div className="max-w-5xl mx-auto">
      <ScrollReveal className="text-center lg:text-left mb-16 sm:mb-20">
        <p className="text-sm font-medium tracking-wide text-accent uppercase mb-3">Process</p>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">How it works</h2>
        <p className="text-muted-foreground text-lg mt-4">Three steps. No setup complexity.</p>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 items-start relative">
        <div className="hidden md:block absolute top-12 left-[16.66%] right-[16.66%] h-px bg-border" />
        {steps.map((step, i) => (
          <StepCard key={step.num} step={step} index={i} />
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
