import { useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import {
  Shield,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";

const ease = [0.16, 1, 0.3, 1];

export default function PublicBrief() {
  const { token } = useParams<{ token: string }>();

  const data = useQuery(
    api.queries.getSharedBrief,
    token ? { token } : "skip"
  );

  if (data === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <AlertTriangle
            className="h-10 w-10 text-muted-foreground mx-auto mb-4"
            strokeWidth={1.5}
          />
          <h1 className="text-xl font-semibold mb-2">Link not found</h1>
          <p className="text-muted-foreground text-sm">
            This brief link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  const { candidateName, position, synthesis, webPresence, createdAt } = data;

  const recColor =
    synthesis.recommendation === "advance"
      ? "bg-green-500/10 text-green-600 border-green-500/20"
      : synthesis.recommendation === "reject"
        ? "bg-red-500/10 text-red-600 border-red-500/20"
        : "bg-amber-500/10 text-amber-600 border-amber-500/20";

  const scoreColor =
    synthesis.confidenceScore >= 70
      ? "text-green-600"
      : synthesis.confidenceScore >= 40
        ? "text-amber-600"
        : "text-red-600";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" strokeWidth={1.8} />
          <span className="font-semibold text-sm tracking-tight">
            Joan Intelligence Brief
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          Generated {formatDistanceToNow(createdAt, { addSuffix: true })}
        </span>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Candidate + recommendation */}
        <motion.div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {candidateName}
            </h1>
            <p className="text-muted-foreground mt-0.5">{position}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={`${recColor} border text-sm`}>
              {synthesis.recommendation}
            </Badge>
            <div className="flex items-center gap-1.5">
              <Brain className="h-4 w-4 text-muted-foreground" />
              <span className={`text-lg font-bold tabular-nums ${scoreColor}`}>
                {synthesis.confidenceScore}
              </span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>
        </motion.div>

        {/* Confidence bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Confidence</span>
            <span className={`text-xs font-medium ${scoreColor}`}>
              {synthesis.confidenceScore}%
            </span>
          </div>
          <Progress value={synthesis.confidenceScore} className="h-2" />
        </div>

        {/* Summary */}
        {synthesis.summary && (
          <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-4">
            {synthesis.summary}
          </p>
        )}

        {/* Strengths + Risks side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {synthesis.strengths.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-green-600">
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {synthesis.strengths.map((s, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {synthesis.risks.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-red-600">Risks</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {synthesis.risks.map((r, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Suggested questions */}
        {synthesis.customQuestions.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Suggested Interview Questions
            </p>
            <div className="space-y-3">
              {synthesis.customQuestions.map((q, i) => (
                <div key={i} className="rounded-lg bg-muted/50 p-3">
                  <p className="text-sm font-medium">{q.question}</p>
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    {q.rationale}
                  </p>
                  <Badge variant="secondary" className="mt-1.5 text-xs">
                    {q.targetGap}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Web presence */}
        {webPresence && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                Web Presence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {webPresence.rawSkills && webPresence.rawSkills.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    Skills detected
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {webPresence.rawSkills.map((s, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {webPresence.experience && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Experience
                  </p>
                  <p className="text-sm">{webPresence.experience}</p>
                </div>
              )}
              {webPresence.linkedinSummary && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    LinkedIn
                  </p>
                  <p className="text-xs text-muted-foreground/80 line-clamp-4">
                    {webPresence.linkedinSummary.slice(0, 400)}
                  </p>
                </div>
              )}
              {webPresence.githubSummary && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">GitHub</p>
                  <p className="text-xs text-muted-foreground/80 line-clamp-4">
                    {webPresence.githubSummary.slice(0, 400)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Powered by{" "}
            <a
              href="https://truevoicehq.com"
              className="text-primary hover:underline"
            >
              TrueVoice HQ
            </a>{" "}
            · Joan AI Intelligence Brief
          </p>
        </div>
      </main>
    </div>
  );
}
