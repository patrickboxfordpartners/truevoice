import { motion } from "framer-motion";
import { Activity, Brain, BarChart3, Eye, Keyboard, Camera } from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Real-Time Speech Scoring",
    description: "Four scoring dimensions analyze speech patterns, response timing, conversational flow, and linguistic authenticity every 20 seconds.",
  },
  {
    icon: Camera,
    title: "Visual Behavior Analysis",
    description: "Periodic webcam analysis detects screen-reading, off-camera gaze, secondary devices, and unauthorized assistance.",
  },
  {
    icon: Keyboard,
    title: "Browser Monitoring",
    description: "Detects tab switching, window focus loss, and clipboard paste events. Included in every plan at zero extra cost.",
  },
  {
    icon: Brain,
    title: "AI-Powered Detection",
    description: "Purpose-built to catch AI-assisted interview responses. Detects scripted cadence, unnatural fluency, and rehearsed patterns.",
  },
  {
    icon: Eye,
    title: "Full Transparency",
    description: "Candidates are informed at every step. Disclosure in emails, consent checkboxes, and persistent monitoring notices during the session.",
  },
  {
    icon: BarChart3,
    title: "Actionable Reports",
    description: "Post-interview reports with score breakdowns, flagged moments, behavioral timeline, and hiring recommendations.",
  },
];

export const Features = () => {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Three layers of authenticity detection
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Audio analysis, visual monitoring, and browser-level behavioral tracking
            work together to give you a complete picture.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl p-8 hover-lift"
            >
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
