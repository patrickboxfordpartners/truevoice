import { motion } from "framer-motion";
import { Activity, Brain, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Real-Time Analysis",
    description: "Instant authenticity scoring during interviews. Speech patterns are analyzed live with updates every 30 seconds.",
  },
  {
    icon: Brain,
    title: "Speech Pattern Recognition",
    description: "Detect reading cadence, scripted responses, and AI-assisted answers through advanced audio pattern analysis.",
  },
  {
    icon: BarChart3,
    title: "Decision Support",
    description: "Objective data across 4 scoring dimensions gives you confidence to make informed hiring decisions.",
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
            Interview Intelligence, Redefined
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Four scoring dimensions work together to give you a complete picture of candidate authenticity.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
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
