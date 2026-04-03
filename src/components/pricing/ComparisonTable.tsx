import { Check, X, HelpCircle } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ComparisonFeature {
  name: string;
  tooltip: string;
  starter: boolean | string;
  pro: boolean | string;
  scale: boolean | string;
}

const comparisonFeatures: ComparisonFeature[] = [
  {
    name: "Speech pattern scoring",
    tooltip: "Analyzes cadence, pacing, and naturalness of speech in real-time across 4 dimensions.",
    starter: true, pro: true, scale: true,
  },
  {
    name: "Response timing analysis",
    tooltip: "Measures pause duration and response latency to detect rehearsed or AI-generated answers.",
    starter: true, pro: true, scale: true,
  },
  {
    name: "Conversational flow detection",
    tooltip: "Tracks how naturally a candidate transitions between topics and follows conversational cues.",
    starter: true, pro: true, scale: true,
  },
  {
    name: "Linguistic authenticity scoring",
    tooltip: "Identifies unnaturally perfect grammar, vocabulary shifts, and AI-typical phrasing patterns.",
    starter: true, pro: true, scale: true,
  },
  {
    name: "Tab & window monitoring",
    tooltip: "Detects when a candidate switches browser tabs or loses window focus during the interview.",
    starter: true, pro: true, scale: true,
  },
  {
    name: "Clipboard paste detection",
    tooltip: "Flags when text is pasted into the interview window, indicating possible external assistance.",
    starter: true, pro: true, scale: true,
  },
  {
    name: "Post-interview reports",
    tooltip: "Detailed PDF reports with score breakdowns, flagged moments, and hiring recommendations.",
    starter: true, pro: true, scale: true,
  },
  {
    name: "Webcam gaze analysis",
    tooltip: "Tracks eye movement to detect off-screen reading, secondary monitors, or teleprompter use.",
    starter: false, pro: true, scale: true,
  },
  {
    name: "Screen-reading detection",
    tooltip: "Identifies characteristic eye patterns of reading from a screen vs. natural conversation.",
    starter: false, pro: true, scale: true,
  },
  {
    name: "Multi-face detection",
    tooltip: "Alerts when additional faces appear in the webcam frame, indicating off-camera coaching.",
    starter: false, pro: true, scale: true,
  },
  {
    name: "Phone/device detection",
    tooltip: "Detects when a candidate is using a phone or secondary device during the interview.",
    starter: false, pro: true, scale: true,
  },
  {
    name: "Visual behavior timeline",
    tooltip: "A visual chronological map of all detected behavioral events throughout the interview.",
    starter: false, pro: true, scale: true,
  },
  {
    name: "Team members",
    tooltip: "Number of team members who can access the dashboard and review interview results.",
    starter: "1", pro: "3", scale: "10",
  },
  {
    name: "Interviews per month",
    tooltip: "Number of candidate interviews included in your plan before overage charges apply.",
    starter: "30", pro: "30", scale: "100",
  },
  {
    name: "Shared dashboard",
    tooltip: "Collaborative workspace where team members can review, comment on, and compare interview results.",
    starter: false, pro: false, scale: true,
  },
  {
    name: "Team analytics & trends",
    tooltip: "Aggregate analytics across all interviews showing patterns, trends, and hiring funnel metrics.",
    starter: false, pro: false, scale: true,
  },
  {
    name: "Bulk candidate import",
    tooltip: "Upload a CSV file to invite hundreds of candidates at once with personalized interview links.",
    starter: false, pro: false, scale: true,
  },
  {
    name: "API access",
    tooltip: "RESTful API for integrating TrueVoice data into your ATS, HRIS, or custom workflows.",
    starter: false, pro: false, scale: true,
  },
  {
    name: "Priority support",
    tooltip: "Dedicated support channel with faster response times and direct access to engineering.",
    starter: false, pro: true, scale: true,
  },
  {
    name: "Dedicated onboarding",
    tooltip: "A personal onboarding call with a specialist to set up your team and optimize your workflow.",
    starter: false, pro: false, scale: true,
  },
];

const CellValue = ({ value }: { value: boolean | string }) => {
  if (typeof value === "string") {
    return <span className="text-sm font-semibold text-card-foreground">{value}</span>;
  }
  return value ? (
    <Check size={18} className="text-primary mx-auto" />
  ) : (
    <X size={18} className="text-muted-foreground/30 mx-auto" />
  );
};

const ComparisonTable = () => (
  <section className="py-28 px-6" style={{ background: "var(--section-gradient-3)" }}>
    <div className="max-w-5xl mx-auto">
      <ScrollReveal className="text-center mb-14">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
          Compare <span className="text-gradient">every feature</span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          See exactly what's included in each plan. Hover any feature for details.
        </p>
      </ScrollReveal>

      {/* Mobile: stacked cards per feature */}
      <div className="md:hidden space-y-3">
        {comparisonFeatures.map((feature) => (
          <ScrollReveal key={feature.name}>
            <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-primary/[0.03]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-card-foreground">{feature.name}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                      <HelpCircle size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                    {feature.tooltip}
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["starter", "pro", "scale"] as const).map((plan) => (
                  <div
                    key={plan}
                    className={`flex flex-col items-center gap-1 rounded-lg py-2 ${
                      plan === "pro" ? "bg-primary/5" : "bg-secondary/50"
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {plan}
                    </span>
                    <CellValue value={feature[plan]} />
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* Desktop: full table */}
      <ScrollReveal className="hidden md:block">
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
          {/* Header */}
          <div className="grid grid-cols-4 border-b border-border bg-secondary/50">
            <div className="p-5 text-sm font-semibold text-muted-foreground">Features</div>
            <div className="p-5 text-center text-sm font-bold text-card-foreground">Starter</div>
            <div className="p-5 text-center text-sm font-bold text-primary relative">
              Pro
              <span className="absolute -top-0 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-semibold px-2.5 py-0.5 rounded-b-md">
                Popular
              </span>
            </div>
            <div className="p-5 text-center text-sm font-bold text-card-foreground">Scale</div>
          </div>

          {/* Rows */}
          {comparisonFeatures.map((feature, i) => (
            <div
              key={feature.name}
              className={`grid grid-cols-4 transition-colors duration-200 hover:bg-primary/[0.03] ${
                i < comparisonFeatures.length - 1 ? "border-b border-border/50" : ""
              }`}
            >
              <div className="p-4 flex items-center gap-2">
                <span className="text-sm text-card-foreground">{feature.name}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                      <HelpCircle size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs text-xs leading-relaxed">
                    {feature.tooltip}
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="p-4 flex items-center justify-center">
                <CellValue value={feature.starter} />
              </div>
              <div className="p-4 flex items-center justify-center bg-primary/[0.02]">
                <CellValue value={feature.pro} />
              </div>
              <div className="p-4 flex items-center justify-center">
                <CellValue value={feature.scale} />
              </div>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </div>
  </section>
);

export default ComparisonTable;
