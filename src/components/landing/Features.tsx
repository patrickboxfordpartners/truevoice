import { motion } from "framer-motion";
import { BarChart3, ArrowLeftRight, Shield, CheckCircle2 } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const ease = [0.16, 1, 0.3, 1];

interface FeatureBlock {
  label: string;
  headline: string;
  description: string;
  bullets: string[];
  icon: React.ElementType;
}

const blocks: FeatureBlock[] = [
  {
    label: "Scoring",
    headline: "Structured data, every time",
    description: "Every interview scored across the same four dimensions — so you're comparing apples to apples, not gut feelings to gut feelings.",
    icon: BarChart3,
    bullets: [
      "Communication quality",
      "Thinking & engagement",
      "Interview presence",
      "Response authenticity",
    ],
  },
  {
    label: "Comparison",
    headline: "Compare candidates side by side",
    description: "Radar charts and score timelines make it immediately clear who performed strongest across every dimension.",
    icon: ArrowLeftRight,
    bullets: [
      "Visual radar chart per candidate",
      "Score timeline across the call",
      "Dimension-by-dimension breakdown",
      "Instant side-by-side view",
    ],
  },
  {
    label: "Reporting",
    headline: "Defend every decision",
    description: "Every hire backed by objective, timestamped data. Full report available to your whole team the moment the call ends.",
    icon: Shield,
    bullets: [
      "Timestamped scoring record",
      "Shareable team report",
      "Available instantly post-call",
      "Audit-ready documentation",
    ],
  },
];

const FeatureVisual = ({ block, index }: { block: FeatureBlock; index: number }) => {
  const Icon = block.icon;

  return (
    <motion.div
      className="w-full max-w-sm mx-auto bg-background border border-border rounded-xl p-8 shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1, ease }}
    >
      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-6">
        <Icon size={22} className="text-accent" />
      </div>
      <ul className="space-y-3">
        {block.bullets.map((bullet, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
            <CheckCircle2 size={15} className="text-accent shrink-0" />
            {bullet}
          </li>
        ))}
      </ul>
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
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-4">
                    {block.headline}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
                    {block.description}
                  </p>
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
