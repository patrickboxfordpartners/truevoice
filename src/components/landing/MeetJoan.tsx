import { Brain, Mail, ClipboardCheck, TrendingUp, Users, Bell } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { JoanAvatar } from "@/components/JoanAvatar";

const capabilities = [
  {
    icon: ClipboardCheck,
    title: "Manages your pipeline",
    description: "Tracks every candidate from screening to offer, moves stages based on scores and signals.",
  },
  {
    icon: Mail,
    title: "Routes your email",
    description: "Reads incoming hiring email, files it to the right candidate, extracts action items.",
  },
  {
    icon: TrendingUp,
    title: "Scores authenticity",
    description: "Analyzes speech, timing, flow, and linguistic patterns in real time during every interview.",
  },
  {
    icon: Users,
    title: "Compares candidates",
    description: "Side-by-side score breakdowns so your team makes decisions on substance, not gut feel.",
  },
  {
    icon: Bell,
    title: "Keeps you on track",
    description: "Deadline reminders, stale-candidate alerts, and daily digests so nothing falls through.",
  },
  {
    icon: Brain,
    title: "Learns your process",
    description: "Configurable thresholds, auto-advance rules, and stage-specific question banks.",
  },
];

const MeetJoan = () => (
  <section className="py-16 sm:py-20 px-4 sm:px-6 bg-card border-t border-border">
    <div className="max-w-5xl mx-auto">
      <ScrollReveal className="text-center mb-14">
        <div className="flex items-center justify-center gap-3 mb-4">
          <JoanAvatar size={40} />
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Your AI Hiring Coordinator</p>
        </div>
        <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-foreground mb-4">
          Meet Joan
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          She exists to take the operational weight off your hiring team.
          Joan watches every interview, manages your pipeline, and surfaces
          what matters so you can focus on the human side of hiring.
        </p>
      </ScrollReveal>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {capabilities.map((cap) => (
          <ScrollReveal key={cap.title}>
            <div className="p-6 rounded-xl border border-border bg-background hover:shadow-soft transition-shadow duration-200">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <cap.icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-base font-medium text-foreground mb-2">{cap.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{cap.description}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  </section>
);

export default MeetJoan;
