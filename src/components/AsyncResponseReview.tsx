import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreGauge } from "@/components/ScoreGauge";
import { Loader2, MessageSquare, Video, BarChart } from "lucide-react";

interface AsyncResponseReviewProps {
  interviewId: string;
}

interface Question {
  _id: Id<"interview_questions">;
  text: string;
  category: string;
}

interface Response {
  _id: Id<"candidate_responses">;
  questionId: Id<"interview_questions">;
  videoUrl?: string;
  transcriptText?: string;
  authenticityScore?: number;
  flagCount?: number;
  duration?: number;
  timestamp: number;
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    behavioral: "bg-blue-100 text-blue-800",
    technical: "bg-purple-100 text-purple-800",
    "culture-fit": "bg-green-100 text-green-800",
    situational: "bg-yellow-100 text-yellow-800",
    general: "bg-gray-100 text-gray-800",
  };
  return colors[category] || colors.general;
};

const formatDuration = (seconds?: number) => {
  if (!seconds) return "N/A";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const AsyncResponseReview = ({ interviewId }: AsyncResponseReviewProps) => {
  const [selectedResponseId, setSelectedResponseId] = useState<Id<"candidate_responses"> | null>(null);

  // Fetch all responses for this interview
  const responses = useQuery(api.queries.getResponsesByInterview, { interviewId }) as Response[] | undefined;

  // Fetch all questions (we'll need to match them)
  const companyId = responses?.[0]?.companyId;
  const questions = useQuery(
    api.queries.getQuestionsByCompany,
    companyId ? { companyId, activeOnly: false } : "skip"
  ) as Question[] | undefined;

  if (!responses || !questions) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          <p>No responses recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  // Create a map of questionId to question details
  const questionMap = new Map<Id<"interview_questions">, Question>();
  questions.forEach((q) => questionMap.set(q._id, q));

  // Enrich responses with question details
  const enrichedResponses = responses
    .map((response) => ({
      ...response,
      question: questionMap.get(response.questionId),
    }))
    .filter((r) => r.question); // Filter out responses with no matching question

  const selectedResponse = selectedResponseId
    ? enrichedResponses.find((r) => r._id === selectedResponseId)
    : enrichedResponses[0];

  // Calculate average score
  const scoresWithData = enrichedResponses.filter((r) => r.authenticityScore !== undefined);
  const averageScore = scoresWithData.length > 0
    ? scoresWithData.reduce((sum, r) => sum + (r.authenticityScore || 0), 0) / scoresWithData.length
    : undefined;

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold">{enrichedResponses.length}</p>
            <p className="text-sm text-muted-foreground">Questions Answered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold">
              {enrichedResponses.reduce((sum, r) => sum + (r.duration || 0), 0)}s
            </p>
            <p className="text-sm text-muted-foreground">Total Duration</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            {averageScore !== undefined ? (
              <>
                <p className="text-3xl font-bold">{Math.round(averageScore)}</p>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-muted-foreground">-</p>
                <p className="text-sm text-muted-foreground">Not Analyzed</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold">
              {enrichedResponses.reduce((sum, r) => sum + (r.flagCount || 0), 0)}
            </p>
            <p className="text-sm text-muted-foreground">Total Flags</p>
          </CardContent>
        </Card>
      </div>

      {/* Response list and detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Response list */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Responses</CardTitle>
            <CardDescription>Select a response to review</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {enrichedResponses.map((response, index) => (
              <button
                key={response._id}
                onClick={() => setSelectedResponseId(response._id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedResponse?._id === response._id
                    ? "bg-primary/10 border border-primary"
                    : "bg-muted/30 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Question {index + 1}</span>
                  <Badge className={getCategoryColor(response.question!.category)}>
                    {response.question!.category}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {response.question!.text}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(response.duration)}
                  </span>
                  {response.authenticityScore !== undefined && (
                    <span className="text-xs font-medium">{Math.round(response.authenticityScore)}/100</span>
                  )}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Response detail */}
        {selectedResponse && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Response Detail</CardTitle>
                  <CardDescription>{selectedResponse.question!.text}</CardDescription>
                </div>
                <Badge className={getCategoryColor(selectedResponse.question!.category)}>
                  {selectedResponse.question!.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="video">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="video">
                    <Video className="h-4 w-4 mr-2" />
                    Video
                  </TabsTrigger>
                  <TabsTrigger value="transcript">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Transcript
                  </TabsTrigger>
                  <TabsTrigger value="analysis">
                    <BarChart className="h-4 w-4 mr-2" />
                    Analysis
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="video" className="space-y-4">
                  {selectedResponse.videoUrl ? (
                    <div className="rounded-lg overflow-hidden bg-black aspect-video">
                      <video src={selectedResponse.videoUrl} controls className="w-full h-full" />
                    </div>
                  ) : (
                    <div className="rounded-lg bg-muted/30 aspect-video flex items-center justify-center">
                      <p className="text-muted-foreground">No video available</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{formatDuration(selectedResponse.duration)}</span>
                  </div>
                </TabsContent>

                <TabsContent value="transcript" className="space-y-4">
                  {selectedResponse.transcriptText ? (
                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedResponse.transcriptText}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-muted/30 rounded-lg p-12 text-center">
                      <p className="text-muted-foreground">Transcript not yet generated</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="analysis" className="space-y-4">
                  {selectedResponse.authenticityScore !== undefined ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-center">
                        <ScoreGauge score={selectedResponse.authenticityScore} size={160} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/30 rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold">{selectedResponse.flagCount || 0}</p>
                          <p className="text-sm text-muted-foreground">Flags Detected</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold">{formatDuration(selectedResponse.duration)}</p>
                          <p className="text-sm text-muted-foreground">Response Time</p>
                        </div>
                      </div>
                      {selectedResponse.analysisDetails && (
                        <div className="bg-muted/30 rounded-lg p-4">
                          <p className="text-sm font-medium mb-2">Analysis Details</p>
                          <pre className="text-xs overflow-auto">
                            {JSON.stringify(selectedResponse.analysisDetails, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-muted/30 rounded-lg p-12 text-center">
                      <p className="text-muted-foreground">Analysis not yet complete</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
