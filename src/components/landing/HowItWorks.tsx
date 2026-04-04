import { CalendarPlus, Video, FileCheck } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const steps = [
  { num: "01", icon: CalendarPlus, title: "Schedule Interview", description: "Create an interview link in seconds. Share it with your candidate via email." },
  { num: "02", icon: Video, title: "Conduct Interview", description: "Run a normal video interview while our engine analyzes speech patterns in real-time." },
  { num: "03", icon: FileCheck, title: "Review Score", description: "Get a detailed authenticity report with actionable insights immediately after." },
];

const HowItWorks = () => (
  <section id="how-it-works" className="py-28 px-6 bg-white">
    <div className="max-w-5xl mx-auto">
      <ScrollReveal className="text-center mb-20">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-gray-900">How It Works</h2>
        <p className="text-gray-600 text-lg">Three simple steps to more authentic interviews.</p>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {steps.map((s, i) => (
          <ScrollReveal key={s.num} delay={i * 0.12} className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-background shadow-soft mb-6 transition-all duration-300 group-hover:shadow-elevated group-hover:scale-105">
              <s.icon size={28} className="text-gray-700 icon-hover-float" />
            </div>
            <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-2">Step {s.num}</p>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{s.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{s.description}</p>
          </ScrollReveal>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
