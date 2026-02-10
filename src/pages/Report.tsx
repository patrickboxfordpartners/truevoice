import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Share2, Calendar, AlertTriangle, Clock, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreGauge } from "@/components/ScoreGauge";
import { Progress } from "@/components/ui/progress";

const mockReport = {
  candidate: "Sarah Chen",
  position: "Senior Frontend Engineer",
  date: "Feb 10, 2026 at 2:00 PM",
  duration: "42:15",
  interviewer: "John Doe",
  overall: 87,
  speech: 22,
  timing: 20,
  flow: 23,
  linguistic: 22,
  flags: [
    { time: "12:45", pattern: "Slight reading cadence detected", severity: "medium" as const },
    { time: "28:10", pattern: "Fast response to complex question (<1.5s)", severity: "low" as const },
  ],
  notes: "Strong candidate overall. Very natural conversational style. Deep technical knowledge demonstrated through follow-up questions.",
};

const ScoreCard = ({ title, score, max, description, findings }: {
  title: string; score: number; max: number; description: string; findings: string[];
}) => (
  <div className="glass-card rounded-xl p-6">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold">{title}</h3>
      <span className="text-sm font-bold">{score}/{max}</span>
    </div>
    <Progress value={(score / max) * 100} className="h-2 mb-3" />
    <p className="text-xs text-muted-foreground mb-3">{description}</p>
    <ul className="space-y-1.5">
      {findings.map((f, i) => (
        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
          <span className="text-primary mt-0.5">•</span>{f}
        </li>
      ))}
    </ul>
  </div>
);

const Report = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">{mockReport.candidate}</h1>
              <p className="text-muted-foreground">{mockReport.position}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{mockReport.date}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{mockReport.duration}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" />PDF</Button>
              <Button variant="outline" size="sm" className="gap-1.5"><Share2 className="h-3.5 w-3.5" />Share</Button>
            </div>
          </div>
        </motion.div>

        {/* Main Score */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-8 mb-8 text-center">
          <ScoreGauge score={mockReport.overall} size={160} strokeWidth={10} />
          <p className="text-muted-foreground mt-4 max-w-md mx-auto text-sm">
            Natural, conversational responses detected throughout interview. Candidate demonstrated genuine engagement.
          </p>
        </motion.div>

        {/* Score Breakdown */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-lg font-semibold mb-4">Score Breakdown</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <ScoreCard
              title="Speech Patterns"
              score={mockReport.speech}
              max={25}
              description="Natural speech vs. reading cadence"
              findings={["Filler words detected: Yes (natural)", "Self-corrections: 4 instances", "Vocal variety: High"]}
            />
            <ScoreCard
              title="Response Timing"
              score={mockReport.timing}
              max={25}
              description="Thinking time vs. instant responses"
              findings={["Avg response delay: 3.2s", "Suspicious instant replies: 1", "Timing consistency: Natural"]}
            />
            <ScoreCard
              title="Conversational Flow"
              score={mockReport.flow}
              max={25}
              description="Natural dialogue vs. monologue delivery"
              findings={["Clarifying questions: Yes (3)", "Natural overlaps: Yes", "Engagement level: High"]}
            />
            <ScoreCard
              title="Linguistic Authenticity"
              score={mockReport.linguistic}
              max={25}
              description="Spoken language vs. written language"
              findings={["Grammar: Natural imperfections", "Sentence structure: Spoken-style", "Contractions used: Yes"]}
            />
          </div>
        </motion.div>

        {/* Flags */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Detected Patterns
          </h2>
          {mockReport.flags.length > 0 ? (
            <div className="space-y-3">
              {mockReport.flags.map((flag, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <span className="text-xs font-mono text-muted-foreground mt-0.5 shrink-0">{flag.time}</span>
                  <span className={flag.severity === "medium" ? "text-warning" : "text-muted-foreground"}>⚠️</span>
                  <span className="text-sm">{flag.pattern}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No significant patterns detected.</p>
          )}
        </motion.div>

        {/* Notes */}
        {mockReport.notes && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold mb-3">Interview Notes</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{mockReport.notes}</p>
          </motion.div>
        )}

        {/* Recommendations */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Suggested Next Steps
          </h2>
          <ul className="space-y-2">
            <li className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-success">✓</span> Candidate demonstrated strong authenticity markers</li>
            <li className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-success">✓</span> Proceed with standard evaluation process</li>
            <li className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-success">✓</span> Consider for next interview round</li>
          </ul>
          <div className="flex gap-3 mt-6">
            <Button className="gap-2"><Calendar className="h-4 w-4" />Schedule Follow-Up</Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Report;
