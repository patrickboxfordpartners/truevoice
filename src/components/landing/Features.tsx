import { useState } from "react";
import { Mic, Eye, Monitor, Brain, Users, BarChart3, type LucideIcon } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

type Category = "all" | "audio" | "visual" | "browser";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  category: Category;
}

const features: Feature[] = [
  { icon: Mic, title: "Real-Time Speech Scoring", description: "Four scoring dimensions analyze speech patterns, response timing, conversational flow, and linguistic authenticity every 20 seconds.", category: "audio" },
  { icon: Brain, title: "AI-Powered Detection", description: "Purpose-built to catch AI-assisted interview responses. Detects scripted cadence, unnatural fluency, and rehearsed patterns.", category: "audio" },
  { icon: Eye, title: "Visual Behavior Analysis", description: "Periodic webcam analysis detects screen-reading, off-camera gaze, secondary devices, and unauthorized assistance.", category: "visual" },
  { icon: Users, title: "Full Transparency", description: "Candidates are informed at every step. Disclosure in emails, consent checkboxes, and persistent monitoring notices.", category: "visual" },
  { icon: Monitor, title: "Browser Monitoring", description: "Detects tab switching, window focus loss, and clipboard paste events. Included in every plan at zero extra cost.", category: "browser" },
  { icon: BarChart3, title: "Actionable Reports", description: "Post-interview reports with score breakdowns, flagged moments, behavioral timeline, and hiring recommendations.", category: "browser" },
];

const tabs: { label: string; value: Category }[] = [
  { label: "All Features", value: "all" },
  { label: "Audio", value: "audio" },
  { label: "Visual", value: "visual" },
  { label: "Browser", value: "browser" },
];

const Features = () => {
  const [active, setActive] = useState<Category>("all");
  const filtered = active === "all" ? features : features.filter((f) => f.category === active);

  return (
    <section id="features" className="py-28 px-6" style={{ background: "var(--section-gradient-2)" }}>
      <div className="max-w-6xl mx-auto">
        <ScrollReveal className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Three layers of <span className="text-gradient">authenticity detection</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Audio analysis, visual monitoring, and browser-level behavioral tracking work together to give you a complete picture.
          </p>
        </ScrollReveal>

        {/* Interactive tabs */}
        <div className="flex justify-center mb-14">
          <div className="inline-flex items-center gap-1 bg-secondary rounded-full p-1">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActive(tab.value)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  active === tab.value
                    ? "bg-background shadow-soft text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 0.06}>
              <div className="group relative rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:shadow-elevated hover:-translate-y-1.5 h-full overflow-hidden">
                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.06),transparent_70%)]" />
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-5 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                    <f.icon size={22} className="text-primary transition-transform duration-300 group-hover:rotate-[-8deg]" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
