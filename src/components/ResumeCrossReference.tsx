import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, MessageSquare, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ResumeCrossReferenceProps {
  candidateId: string;
  candidateName: string;
  resumeUrl?: string;
  resumeText?: string;
  transcript: string;
}

export const ResumeCrossReference = ({
  candidateId,
  candidateName,
  resumeUrl,
  resumeText,
  transcript,
}: ResumeCrossReferenceProps) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crossReference = useAction(api.actions.crossReferenceResume.crossReferenceResume);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await crossReference({
        candidateId: candidateId as any,
        candidateName,
        resumeText: resumeText || "",
        transcript,
      });

      if (result.success && result.result) {
        setAnalysis(result.result);
      } else {
        setError(result.error || "Failed to analyze resume");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (!resumeText) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">
              No resume uploaded for this candidate
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Resume Cross-Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-warning/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Verify interview claims against resume
            </p>
            <Button onClick={handleAnalyze} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? "Analyzing..." : "Cross-Reference Resume"}
            </Button>
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Consistency Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Resume Consistency
            </CardTitle>
            <Badge
              variant="outline"
              className={
                analysis.overallConsistency >= 80
                  ? "bg-green-100 text-green-800 border-green-200"
                  : analysis.overallConsistency >= 60
                  ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                  : "bg-red-100 text-red-800 border-red-200"
              }
            >
              {analysis.overallConsistency}% Match
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Cross-referenced {analysis.inconsistencies.length + analysis.verified.length} claims
            from interview against resume
          </p>
        </CardContent>
      </Card>

      {/* Side-by-Side View */}
      <Tabs defaultValue="inconsistencies" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inconsistencies" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Inconsistencies ({analysis.inconsistencies.length})
          </TabsTrigger>
          <TabsTrigger value="verified" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Verified ({analysis.verified.length})
          </TabsTrigger>
          <TabsTrigger value="missing" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Missing ({analysis.missing.length})
          </TabsTrigger>
        </TabsList>

        {/* Inconsistencies */}
        <TabsContent value="inconsistencies" className="space-y-4 mt-4">
          {analysis.inconsistencies.length > 0 ? (
            analysis.inconsistencies.map((item: any, i: number) => (
              <Card key={i} className="border-l-4 border-l-warning">
                <CardContent className="pt-6 pb-4">
                  <div className="flex items-start justify-between mb-6">
                    <h4 className="font-semibold text-base text-foreground">{item.claim}</h4>
                    <Badge variant="outline" className={getSeverityColor(item.severity)}>
                      {item.severity}
                    </Badge>
                  </div>

                  {/* Interview Claim */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                        Interview Claim
                      </span>
                    </div>
                    <div className="bg-purple-50 border-l-4 border-l-purple-500 p-4 rounded-r">
                      <p className="text-base font-medium text-purple-900 italic leading-relaxed">
                        "{item.interviewSays}"
                      </p>
                    </div>
                  </div>

                  {/* Resume Says */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                        Resume Says
                      </span>
                    </div>
                    <div className="bg-blue-50 border-l-4 border-l-blue-500 p-4 rounded-r">
                      <p className="text-base text-blue-900 leading-relaxed">
                        {item.resumeSays}
                      </p>
                    </div>
                  </div>

                  {/* Verdict */}
                  <Alert variant="destructive" className="border-l-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm font-medium">
                      {item.verdict}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-2" />
                <p className="text-muted-foreground">No inconsistencies found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Verified */}
        <TabsContent value="verified" className="space-y-3 mt-4">
          {analysis.verified.map((item: any, i: number) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <p className="font-medium text-sm mb-1">{item.claim}</p>
                    <p className="text-xs text-muted-foreground">{item.evidence}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Missing */}
        <TabsContent value="missing" className="space-y-3 mt-4">
          {analysis.missing.length > 0 ? (
            analysis.missing.map((item: any, i: number) => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium text-sm mb-1">{item.claim}</p>
                      <p className="text-xs text-muted-foreground">{item.note}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-2" />
                <p className="text-muted-foreground">All claims are documented</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Regenerate */}
      <div className="text-center">
        <Button variant="outline" onClick={handleAnalyze} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Re-analyze
        </Button>
      </div>
    </div>
  );
};
