import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ArrowLeft, Loader2, Mail, CheckCircle2, Clock, AlertTriangle, User, Briefcase, Brain, Zap, RefreshCw, Shield, FileText, Plus, ChevronDown, ChevronUp, Save } from "lucide-react";
import { ShareBriefButton } from "@/components/ShareBriefButton";
import { BriefPdfExport } from "@/components/BriefPdfExport";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { EmailThreadView } from "@/components/EmailThreadView";
import { AISummaryPanel } from "@/components/AISummaryPanel";
import { SocialLinks } from "@/components/SocialLinks";
import { ResumeCrossReference } from "@/components/ResumeCrossReference";
import { PeerReviews } from "@/components/PeerReviews";
import { CandidateTimeline } from "@/components/CandidateTimeline";
import { CandidateNotes } from "@/components/CandidateNotes";
import { RadarScoreChart } from "@/components/RadarScoreChart";
import { InterviewScheduleCard } from "@/components/InterviewScheduleCard";
import { CandidateTags } from "@/components/CandidateTags";
import { InterviewFeedbackForm } from "@/components/InterviewFeedbackForm";
import { ApprovalGate } from "@/components/ApprovalGate";
import { AutoStageRecommendations } from "@/components/AutoStageRecommendations";
import { SmartCandidateMatching } from "@/components/SmartCandidateMatching";
import { QuestionGenerator } from "@/components/QuestionGenerator";
import { CandidatePdfExport } from "@/components/CandidatePdfExport";
import { SentimentBadges } from "@/components/SentimentBadges";
import { Id } from "../../convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";

const STAGE_LABELS = {
  screening: "Screening",
  technical: "Technical",
  final: "Final Round",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

const STAGE_COLORS = {
  screening: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  technical: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  final: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  offer: "bg-green-500/10 text-green-600 border-green-500/20",
  hired: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

function getScoreColor(score?: number): string {
  if (!score) return "text-muted-foreground";
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-destructive";
}

export default function JoanCandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch candidate data
  const candidate = useQuery(
    api.queries.getCandidateByInterview,
    id ? { interviewId: id } : "skip"
  );

  // Fetch interview scores
  const scores = useQuery(
    api.queries.getInterviewScores,
    id ? { interviewId: id } : "skip"
  );

  // Fetch action items
  const actionItems = useQuery(
    api.queries.getActionItemsByCandidate,
    candidate?._id ? { candidateId: candidate._id } : "skip"
  );

  // Fetch intelligence brief
  const brief = useQuery(
    api.queries.getBriefByCandidate,
    candidate?._id ? { candidateId: candidate._id } : "skip"
  );

  // Fetch Joan activity for this candidate
  const joanActivity = useQuery(
    api.queries.getJoanActivity,
    candidate ? { companyId: candidate.companyId, limit: 50 } : "skip"
  );

  // Re-run pipeline action
  const runPipeline = useAction(api.actions.intelligencePipeline.rerunIntelligencePipeline);
  const [rerunning, setRerunning] = useState(false);

  // Stage transition
  const moveStage = useMutation(api.mutations.moveCandidateStage);

  // Save question to bank
  const createQuestion = useMutation(api.mutations.createInterviewQuestion);
  const [savedQuestions, setSavedQuestions] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  // Resume upload
  const updateResume = useMutation(api.mutations.updateCandidateResume);
  const [showResumeEditor, setShowResumeEditor] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [savingResume, setSavingResume] = useState(false);
  const [resumeExpanded, setResumeExpanded] = useState(false);

  if (candidate === undefined || scores === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">Candidate not found</p>
        <Link to="/joan-pipeline">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pipeline
          </Button>
        </Link>
      </div>
    );
  }

  const scoreColor = getScoreColor(candidate.overallScore);
  const stageColor = STAGE_COLORS[candidate.stage as keyof typeof STAGE_COLORS];

  // Filter Joan activity for this candidate
  const candidateActivity = joanActivity?.filter(
    (a) => a.candidateId === candidate._id
  ) || [];

  const pendingItems = actionItems?.filter((item) => item.status === "pending") || [];
  const completedItems = actionItems?.filter((item) => item.status === "completed") || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile notice */}
      <div className="sm:hidden bg-muted/50 border-b border-border px-4 py-2 text-center">
        <p className="text-xs text-muted-foreground">For the best experience, use a tablet or computer</p>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between gap-2 min-h-[4rem] py-2">
          <Link to="/joan-pipeline" className="shrink-0">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Back to Pipeline</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {candidate && (
              <CandidatePdfExport
                candidate={{
                  candidateName: candidate.candidateName,
                  candidateEmail: candidate.candidateEmail,
                  position: candidate.position,
                  stage: candidate.stage,
                  overallScore: candidate.overallScore,
                  flagCount: candidate.flagCount,
                  skills: candidate.skills,
                }}
              />
            )}
            {brief && brief.status === "complete" && candidate && (
              <>
                <BriefPdfExport
                  candidateName={candidate.candidateName}
                  position={candidate.position}
                  brief={brief}
                />
                <ShareBriefButton briefId={brief._id} candidateId={candidate._id} />
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Candidate Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Candidate Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{candidate.candidateName}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Briefcase className="h-3 w-3" />
                        {candidate.position}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Email */}
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${candidate.candidateEmail}`} className="text-primary hover:underline">
                    {candidate.candidateEmail}
                  </a>
                </div>

                {/* Stage */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Current Stage</p>
                  <Badge variant="outline" className={`${stageColor} border`}>
                    {STAGE_LABELS[candidate.stage as keyof typeof STAGE_LABELS]}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    Updated {formatDistanceToNow(candidate.stageChangedAt, { addSuffix: true })}
                  </p>
                </div>

                {/* Overall Score */}
                {candidate.overallScore !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Authenticity Score</p>
                    <div className="flex items-center gap-3">
                      <span className={`text-3xl font-bold ${scoreColor}`}>
                        {candidate.overallScore}
                      </span>
                      <div className="flex-1">
                        <Progress value={candidate.overallScore} className="h-2" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sentiment Badges */}
                <SentimentBadges interviewId={id} className="pt-1" />

                {/* Flags */}
                {candidate.flagCount > 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium text-destructive">
                      {candidate.flagCount} fraud {candidate.flagCount === 1 ? "flag" : "flags"}
                    </span>
                  </div>
                )}

                {/* Action Items Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">Action Items</p>
                    <span className="text-xs font-medium">
                      {candidate.actionItemsComplete} / {candidate.actionItemsTotal}
                    </span>
                  </div>
                  <Progress
                    value={candidate.actionItemsTotal > 0 ? (candidate.actionItemsComplete / candidate.actionItemsTotal) * 100 : 0}
                    className="h-2"
                  />
                </div>

                {/* Social Profiles */}
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Social Profiles</p>
                  <SocialLinks
                    linkedinUrl={candidate.linkedinUrl}
                    githubUrl={candidate.githubUrl}
                    twitterUrl={candidate.twitterUrl}
                    mediumUrl={candidate.mediumUrl}
                    substackUrl={candidate.substackUrl}
                    facebookUrl={candidate.facebookUrl}
                    instagramUrl={candidate.instagramUrl}
                  />
                </div>

                {/* Skills */}
                {candidate.skills && candidate.skills.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs text-muted-foreground">Skills (via Firecrawl)</p>
                    <div className="flex flex-wrap gap-1">
                      {candidate.skills.map((skill, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Tags</p>
                  <CandidateTags candidateId={candidate._id} companyId={candidate.companyId} />
                </div>
              </CardContent>
            </Card>

            {/* Resume */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Resume
                  </CardTitle>
                  {candidate.resumeText ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setResumeExpanded(!resumeExpanded)}
                      className="h-7 px-2"
                    >
                      {resumeExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                {candidate.resumeText ? (
                  <>
                    <p className={`text-xs text-muted-foreground whitespace-pre-line ${resumeExpanded ? "" : "line-clamp-4"}`}>
                      {candidate.resumeText}
                    </p>
                    {!resumeExpanded && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setResumeExpanded(true)}
                        className="px-0 h-6 text-xs mt-1"
                      >
                        Show more
                      </Button>
                    )}
                  </>
                ) : showResumeEditor ? (
                  <div className="space-y-3">
                    <textarea
                      className="w-full min-h-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="Paste resume text here..."
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        disabled={!resumeText.trim() || savingResume}
                        onClick={async () => {
                          setSavingResume(true);
                          try {
                            await updateResume({
                              candidateId: candidate._id,
                              resumeText: resumeText.trim(),
                            });
                            toast({ title: "Resume saved" });
                            setShowResumeEditor(false);
                            setResumeText("");
                          } catch {
                            toast({ title: "Failed to save resume", variant: "destructive" });
                          } finally {
                            setSavingResume(false);
                          }
                        }}
                      >
                        {savingResume ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                        Save
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setShowResumeEditor(false); setResumeText(""); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowResumeEditor(true)}
                    className="w-full"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add Resume
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Radar Score Breakdown */}
            <RadarScoreChart interviewId={id} />

            {/* Interview Scheduling */}
            <InterviewScheduleCard
              candidateId={candidate._id as string}
              candidateName={candidate.candidateName}
              position={candidate.position}
              stage={candidate.stage}
            />

            {/* Auto Stage Recommendations */}
            <AutoStageRecommendations
              candidateId={candidate._id}
              currentStage={candidate.stage}
              overallScore={candidate.overallScore}
              actionItemsComplete={candidate.actionItemsComplete}
              actionItemsTotal={candidate.actionItemsTotal}
              onApply={async (nextStage) => {
                await moveStage({ candidateId: candidate._id, newStage: nextStage });
                toast({ title: `Moved to ${nextStage}` });
              }}
            />

            {/* Smart Candidate Matching */}
            <SmartCandidateMatching
              candidateId={candidate._id}
              onSelectCandidate={(cId) => navigate(`/joan-candidate/${cId}`)}
            />
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2">
            {/* Approval Gate (only renders at offer stage) */}
            <ApprovalGate
              candidateId={candidate._id}
              candidateName={candidate.candidateName}
              position={candidate.position}
              stage={candidate.stage}
              overallScore={candidate.overallScore}
              onApprove={async () => {
                await moveStage({ candidateId: candidate._id, newStage: "hired" });
                toast({ title: `${candidate.candidateName} has been hired!` });
              }}
              onReject={async () => {
                await moveStage({ candidateId: candidate._id, newStage: "rejected" });
                toast({ title: `${candidate.candidateName} has been rejected` });
              }}
              className="mb-6"
            />

            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="flex w-full overflow-x-auto">
                <TabsTrigger value="intel">
                  Intel Brief
                </TabsTrigger>
                <TabsTrigger value="summary">
                  AI Summary
                </TabsTrigger>
                <TabsTrigger value="resume">
                  Resume Check
                </TabsTrigger>
                <TabsTrigger value="peer">
                  Peer Reviews
                </TabsTrigger>
                <TabsTrigger value="notes">
                  Notes
                </TabsTrigger>
                <TabsTrigger value="actions">
                  Actions ({actionItems?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="emails">
                  Emails
                </TabsTrigger>
                <TabsTrigger value="activity">
                  Activity ({candidateActivity.length})
                </TabsTrigger>
                <TabsTrigger value="feedback">
                  Feedback
                </TabsTrigger>
                <TabsTrigger value="questions">
                  Questions
                </TabsTrigger>
              </TabsList>

              {/* Intelligence Brief Tab */}
              <TabsContent value="intel" className="mt-4 space-y-4">
                {brief === undefined ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : brief === null ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Brain className="h-12 w-12 text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground mb-3">No intelligence brief yet</p>
                      <Button
                        onClick={async () => {
                          if (!candidate) return;
                          setRerunning(true);
                          try {
                            // Create brief via mutation then run pipeline
                            // For now, the pipeline was auto-triggered on candidate creation
                          } finally {
                            setRerunning(false);
                          }
                        }}
                        disabled={rerunning}
                        size="sm"
                      >
                        {rerunning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
                        Generate Intelligence Brief
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Status + metadata bar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            brief.status === "complete"
                              ? "bg-green-500/10 text-green-600 border-green-500/20"
                              : brief.status === "running"
                                ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                : brief.status === "failed"
                                  ? "bg-red-500/10 text-red-600 border-red-500/20"
                                  : "bg-muted text-muted-foreground"
                          }
                        >
                          {brief.status === "running" && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                          {brief.status}
                        </Badge>
                        {brief.sources?.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Zap className="h-3.5 w-3.5" />
                            {brief.sources.join(", ")}
                          </div>
                        )}
                        {brief.pipelineDurationMs > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {(brief.pipelineDurationMs / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!candidate || !brief) return;
                          setRerunning(true);
                          try {
                            await runPipeline({
                              candidateId: candidate._id,
                              briefId: brief._id,
                            });
                          } finally {
                            setRerunning(false);
                          }
                        }}
                        disabled={rerunning || brief.status === "running"}
                      >
                        {rerunning ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                        Re-run
                      </Button>
                    </div>

                    {/* Recommendation + confidence */}
                    {brief.synthesis && brief.status === "complete" && (
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Shield className="h-4 w-4 text-primary" />
                              Joan's Assessment
                            </CardTitle>
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="outline"
                                className={
                                  brief.synthesis.recommendation === "advance"
                                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                                    : brief.synthesis.recommendation === "reject"
                                      ? "bg-red-500/10 text-red-600 border-red-500/20"
                                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                }
                              >
                                {brief.synthesis.recommendation}
                              </Badge>
                              <div className="flex items-center gap-1 text-sm">
                                <Brain className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold tabular-nums">{brief.synthesis.confidenceScore}/100</span>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {brief.synthesis.summary}
                          </p>

                          {brief.synthesis.strengths?.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-green-600 mb-2">Strengths</p>
                              <ul className="space-y-1">
                                {brief.synthesis.strengths.map((s: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {brief.synthesis.risks?.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-red-600 mb-2">Risks</p>
                              <ul className="space-y-1">
                                {brief.synthesis.risks.map((r: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                    {r}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {brief.synthesis.customQuestions?.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-purple-600 mb-2">Suggested Interview Questions</p>
                              <div className="space-y-3">
                                {brief.synthesis.customQuestions.map((q: { question: string; rationale: string; targetGap: string }, i: number) => (
                                  <div key={i} className="rounded-lg bg-muted/50 p-3">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="text-sm font-medium">{q.question}</p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="shrink-0 h-7 px-2"
                                        disabled={savedQuestions.has(i)}
                                        onClick={async () => {
                                          try {
                                            await createQuestion({
                                              text: q.question,
                                              category: "behavioral" as const,
                                              position: 999,
                                              companyId: candidate.companyId,
                                              isActive: true,
                                            });
                                            setSavedQuestions((prev) => new Set(prev).add(i));
                                            toast({ title: "Question saved to bank" });
                                          } catch {
                                            toast({ title: "Failed to save question", variant: "destructive" });
                                          }
                                        }}
                                      >
                                        {savedQuestions.has(i) ? (
                                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                                        ) : (
                                          <Plus className="h-3.5 w-3.5" />
                                        )}
                                      </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 italic">{q.rationale}</p>
                                    <Badge variant="secondary" className="mt-1.5 text-xs">{q.targetGap}</Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Web presence */}
                    {brief.webPresence && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Web Presence</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {brief.webPresence.rawSkills?.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1.5">Skills detected</p>
                              <div className="flex flex-wrap gap-1">
                                {brief.webPresence.rawSkills.map((s: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {brief.webPresence.experience && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Experience</p>
                              <p className="text-sm">{brief.webPresence.experience}</p>
                            </div>
                          )}
                          {brief.webPresence.linkedinSummary && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">LinkedIn</p>
                              <p className="text-xs text-muted-foreground/80 line-clamp-4">{brief.webPresence.linkedinSummary.slice(0, 400)}</p>
                            </div>
                          )}
                          {brief.webPresence.githubSummary && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">GitHub</p>
                              <p className="text-xs text-muted-foreground/80 line-clamp-4">{brief.webPresence.githubSummary.slice(0, 400)}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Memory context */}
                    {brief.memoryContext && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Institutional Memory</CardTitle>
                          <CardDescription>Context from Mitosis -- past hiring patterns and decisions</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {brief.memoryContext.priorInteractions && (
                            <div>
                              <p className="text-xs font-medium mb-1">Prior Interactions</p>
                              <p className="text-sm text-muted-foreground">{brief.memoryContext.priorInteractions}</p>
                            </div>
                          )}
                          {brief.memoryContext.similarCandidates && (
                            <div>
                              <p className="text-xs font-medium mb-1">Similar Past Candidates</p>
                              <p className="text-sm text-muted-foreground">{brief.memoryContext.similarCandidates}</p>
                            </div>
                          )}
                          {brief.memoryContext.teamPreferences && (
                            <div>
                              <p className="text-xs font-medium mb-1">Team Preferences</p>
                              <p className="text-sm text-muted-foreground">{brief.memoryContext.teamPreferences}</p>
                            </div>
                          )}
                          {brief.memoryContext.relevantHistory && (
                            <div>
                              <p className="text-xs font-medium mb-1">Relevant History</p>
                              <p className="text-sm text-muted-foreground">{brief.memoryContext.relevantHistory}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Error state */}
                    {brief.status === "failed" && brief.errorMessage && (
                      <Card className="border-destructive/30">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-destructive">Pipeline failed</p>
                              <p className="text-xs text-muted-foreground mt-1">{brief.errorMessage}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>

              {/* AI Summary Tab */}
              <TabsContent value="summary" className="mt-4">
                <AISummaryPanel
                  interviewId={candidate.interviewId}
                  transcript="Sample interview transcript..." // TODO: Get real transcript
                  candidateName={candidate.candidateName}
                  position={candidate.position}
                  overallScore={scores?.overallScore}
                  speechScore={scores?.speechScore}
                  timingScore={scores?.timingScore}
                  flowScore={scores?.flowScore}
                  linguisticScore={scores?.linguisticScore}
                  flagCount={candidate.flagCount}
                />
              </TabsContent>

              {/* Resume Cross-Reference Tab */}
              <TabsContent value="resume" className="mt-4">
                <ResumeCrossReference
                  candidateId={candidate._id}
                  candidateName={candidate.candidateName}
                  resumeUrl={candidate.resumeUrl}
                  resumeText={candidate.resumeText}
                  transcript="Sample interview transcript..." // TODO: Get real transcript
                />
              </TabsContent>

              {/* Peer Reviews Tab */}
              <TabsContent value="peer" className="mt-4">
                <PeerReviews
                  candidateId={candidate._id}
                  candidateName={candidate.candidateName}
                />
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="mt-4">
                <CandidateNotes candidateId={candidate._id} companyId={candidate.companyId} />
              </TabsContent>

              {/* Action Items Tab */}
              <TabsContent value="actions" className="space-y-4 mt-4">
                {actionItems && actionItems.length > 0 ? (
                  <>
                    {pendingItems.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground">Pending</h3>
                        {pendingItems.map((item) => (
                          <Card key={item._id}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Clock className="h-5 w-5 text-warning mt-0.5" />
                                <div className="flex-1">
                                  <h4 className="font-medium">{item.title}</h4>
                                  {item.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {item.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline">{item.type.replace("_", " ")}</Badge>
                                    <Badge variant={item.priority === "urgent" ? "destructive" : "secondary"}>
                                      {item.priority}
                                    </Badge>
                                    {item.dueDate && (
                                      <span className="text-xs text-muted-foreground">
                                        Due {formatDistanceToNow(item.dueDate, { addSuffix: true })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {completedItems.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground">Completed</h3>
                        {completedItems.map((item) => (
                          <Card key={item._id} className="opacity-60">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                                <div className="flex-1">
                                  <h4 className="font-medium line-through">{item.title}</h4>
                                  <span className="text-xs text-muted-foreground">
                                    Completed {item.completedAt && formatDistanceToNow(item.completedAt, { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">No action items yet</p>
                  </div>
                )}
              </TabsContent>

              {/* Emails Tab */}
              <TabsContent value="emails" className="mt-4">
                <EmailThreadView candidateId={candidate._id} />
              </TabsContent>

              {/* Activity Timeline Tab */}
              <TabsContent value="activity" className="mt-4">
                <CandidateTimeline
                  candidateId={candidate._id}
                  activities={candidateActivity}
                />
              </TabsContent>

              {/* Interview Feedback Tab */}
              <TabsContent value="feedback" className="mt-4">
                <InterviewFeedbackForm
                  candidateId={candidate._id}
                  companyId={candidate.companyId}
                />
              </TabsContent>

              {/* Question Generator Tab */}
              <TabsContent value="questions" className="mt-4">
                <QuestionGenerator
                  candidateId={candidate._id}
                  position={candidate.position}
                  skills={candidate.skills}
                  stage={candidate.stage}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
