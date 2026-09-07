import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, AlertTriangle, CheckCircle2, HelpCircle, TrendingUp, TrendingDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AISummaryPanelProps {
  interviewId: string;
  transcript: string;
  candidateName: string;
  position: string;
  overallScore?: number;
  speechScore?: number;
  timingScore?: number;
  flowScore?: number;
  linguisticScore?: number;
  flagCount?: number;
}

export const AISummaryPanel = ({
  interviewId,
  transcript,
  candidateName,
  position,
  overallScore,
  speechScore,
  timingScore,
  flowScore,
  linguisticScore,
  flagCount,
}: AISummaryPanelProps) => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = useAction(api.actions.generateInterviewSummary.generateInterviewSummary);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await generateSummary({
        interviewId,
        transcript,
        candidateName,
        position,
        overallScore,
        speechScore,
        timingScore,
        flowScore,
        linguisticScore,
        flagCount,
      });

      if (result.success && result.summary) {
        setSummary(result.summary);
      } else {
        setError(result.error || "Failed to generate summary");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case "strong_hire":
        return "bg-green-100 text-green-800 border-green-200";
      case "hire":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "maybe":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "no_hire":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRecommendationLabel = (rec: string) => {
    switch (rec) {
      case "strong_hire":
        return "Strong Hire";
      case "hire":
        return "Hire";
      case "maybe":
        return "Maybe";
      case "no_hire":
        return "No Hire";
      default:
        return rec;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600";
      case "high":
        return "text-orange-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Interview Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Generate an AI-powered briefing with Joan's intelligent analysis
            </p>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? "Generating..." : "Generate Summary"}
            </Button>
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Executive Summary
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getRecommendationColor(summary.recommendation)}>
                {getRecommendationLabel(summary.recommendation)}
              </Badge>
              <Badge variant="secondary">
                {summary.confidence}% confidence
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">{summary.executiveSummary}</p>
        </CardContent>
      </Card>

      {/* Strengths & Concerns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <TrendingUp className="h-5 w-5" />
              Strengths ({summary.strengths.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.strengths.map((strength: any, i: number) => (
              <div key={i} className="border-l-4 border-success pl-4">
                <p className="font-medium text-sm mb-1">{strength.point}</p>
                <p className="text-xs text-muted-foreground italic">"{strength.evidence}"</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Concerns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <TrendingDown className="h-5 w-5" />
              Concerns ({summary.concerns.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.concerns.map((concern: any, i: number) => (
              <div key={i} className="border-l-4 border-warning pl-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">{concern.point}</p>
                  <Badge variant="outline" className={`text-xs ${getSeverityColor(concern.severity)}`}>
                    {concern.severity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground italic">"{concern.evidence}"</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Red Flags */}
      {summary.redFlags && summary.redFlags.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Red Flags ({summary.redFlags.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.redFlags.map((flag: any, i: number) => (
              <Alert key={i} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{flag.flag}:</strong> {flag.description}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Follow-up Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Suggested Follow-up Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {summary.followUpQuestions.map((question: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary font-medium">{i + 1}.</span>
                <span className="text-foreground">{question}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Overall Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Detailed Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            {summary.overallAssessment.split('\n\n').map((paragraph: string, i: number) => (
              <p key={i} className="text-foreground mb-4 last:mb-0">{paragraph}</p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Regenerate Button */}
      <div className="text-center">
        <Button variant="outline" onClick={handleGenerate} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Regenerate Summary
        </Button>
      </div>
    </div>
  );
};
