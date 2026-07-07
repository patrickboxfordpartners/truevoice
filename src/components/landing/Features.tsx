import { motion, useReducedMotion } from "framer-motion";
import { BarChart3, ArrowLeftRight, Shield } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const ease = [0.16, 1, 0.3, 1];

interface FeatureBlock {
  label: string;
  headline: string;
  points: string[];
  icon: React.ElementType;
}

const blocks: FeatureBlock[] = [
  {
    label: "Scoring",
    headline: "Structured data, every time",
    icon: BarChart3,
    points: [
      "Every interview scored across four dimensions — communication quality, thinking & engagement, interview presence, and response authenticity. Same framework, every candidate.",
    ],
  },
  {
    label: "Comparison",
    headline: "Compare candidates side by side",
    icon: ArrowLeftRight,
    points: [
      "See who was most engaged, most consistent, most present. Radar charts and score timelines make the comparison visual and defensible.",
    ],
  },
  {
    label: "Reporting",
    headline: "Defend every decision",
    icon: Shield,
    points: [
      "Every hire backed by objective, timestamped data. Full report available to your whole hiring team the moment the call ends.",
    ],
  },
];

const FeatureVisual = ({ block, index }: { block: FeatureBlock; index: number }) => {
  const Icon = block.icon;
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="w-full max-w-sm mx-auto bg-card border border-border rounded-xl p-8 shadow-soft transition-shadow duration-300 hover:shadow-elevated"
      whileHover={prefersReducedMotion ? {} : { y: -4, transition: { duration: 0.2 } }}
    >
      <motion.div
        className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-6"
        whileHover={prefersReducedMotion ? {} : { scale: 1.1, rotate: -5, transition: { duration: 0.2 } }}
      >
        <Icon size={24} className="text-accent" />
      </motion.div>
      <div className="space-y-3">
        {block.points.map((point, i) => (
          <motion.div
            key={i}
            className="flex items-start gap-3"
            initial={prefersReducedMotion ? undefined : { opacity: 0, x: 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 * i + index * 0.15, ease }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-accent/40 mt-2 shrink-0"
              whileInView={prefersReducedMotion ? {} : { scale: [0, 1.3, 1] }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 * i + index * 0.15 + 0.2 }}
            />
            <p className="text-sm text-muted-foreground leading-relaxed">{point}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const Features = () => (
  <section id="features" className="py-24 sm:py-28 px-4 sm:px-6 bg-card">
    <div className="max-w-6xl mx-auto">
      <ScrollReveal className="text-center lg:text-left mb-16 sm:mb-20">
        <p className="text-sm font-medium tracking-wide text-accent uppercase mb-3">Interview Intelligence</p>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground max-w-xl mx-auto lg:mx-0">
          Structure, compare, and defend every hire
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto lg:mx-0 mt-4">
          Consistent scoring across every interview gives hiring teams the data they need to make confident, defensible decisions.
        </p>
      </ScrollReveal>

      <div className="space-y-20 sm:space-y-24">
        {blocks.map((block, i) => {
          const flipped = i % 2 === 1;
          return (
            <div key={block.label} className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 items-center">
              <div className={`text-center lg:text-left ${flipped ? "lg:order-2" : ""}`}>
                <ScrollReveal direction={flipped ? "right" : "left"}>
                  <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-3">
                    {block.label}
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-6">
                    {block.headline}
                  </h3>
                  <div className="space-y-4">
                    {block.points.map((point, j) => (
                      <p key={j} className="text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
                        {point}
                      </p>
                    ))}
                  </div>
                </ScrollReveal>
              </div>
              <div className={flipped ? "lg:order-1" : ""}>
                <ScrollReveal direction={flipped ? "left" : "right"}>
                  <FeatureVisual block={block} index={i} />
                </ScrollReveal>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default Features;
