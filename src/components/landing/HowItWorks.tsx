import { motion } from "framer-motion";
import { CalendarPlus, Video, ClipboardCheck } from "lucide-react";

const steps = [
  {
    icon: CalendarPlus,
    step: "01",
    title: "Schedule Interview",
    description: "Create an interview link in seconds. Share it with your candidate via email.",
  },
  {
    icon: Video,
    step: "02",
    title: "Conduct Interview",
    description: "Run a normal video interview while our engine analyzes speech patterns in real-time.",
  },
  {
    icon: ClipboardCheck,
    step: "03",
    title: "Review Score",
    description: "Get a detailed authenticity report with actionable insights immediately after.",
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Three simple steps to more authentic interviews.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center relative"
            >
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px border-t-2 border-dashed border-border" />
              )}
              <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 relative">
                <step.icon className="h-10 w-10 text-primary" />
                <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {step.step}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
