import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield, Mic, MicOff, Settings2, AlertTriangle, Clock,
  ChevronLeft, MessageSquare, StopCircle, Monitor, Radio,
  ListChecks, ChevronDown, ChevronUp, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ScoreGauge } from "@/components/ScoreGauge";
import { MiniRadar } from "@/components/dashboard/MiniRadar";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLiveInterview } from "@/hooks/useLiveInterview";
import { usePanelists, useJoinAsPanel, useUpdatePanelistNotes } from "@/hooks/usePanelists";
import { supabase } from "@/lib/supabase";

interface ScriptQuestion {
  id: string;
  text: string;
  type: "behavioral" | "situational" | "technical" | "authenticity";
  suggested_follow_up: string;
}

const QUESTION_TYPE_COLORS: Record<string, string> = {
  behavioral: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  situational: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  technical: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  authenticity: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const severityDot = (s: string) =>
  s === "high" ? "bg-destructive" : s === "medium" ? "bg-warning" : "bg-muted-foreground";
const severityBg = (s: string) =>
  s === "high" ? "bg-destructive/10 border-destructive/20" : s === "medium" ? "bg-warning/10 border-warning/20" : "bg-muted/50 border-border";

const InterviewRoom = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [micMuted, setMicMuted] = useState(false);

  // Question script state
  const [scriptQuestions, setScriptQuestions] = useState<ScriptQuestion[]>([]);
  const [askedQuestions, setAskedQuestions] = useState<Set<string>>(new Set());
  const [scriptExpanded, setScriptExpanded] = useState(true);

  const [panelMode, setPanelMode] = useState(false);
  const [myNotes, setMyNotes] = useState("");
  const [myScore, setMyScore] = useState<string>("");
  const notesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoreDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const interview = useLiveInterview(id || "");

  const { data: panelists = [] } = usePanelists(id);
  const joinAsPanel = useJoinAsPanel(id);
  const updateNotes = useUpdatePanelistNotes(id);

  // Auto-join as panelist when entering the room
  useEffect(() => {
    if (id) {
      joinAsPanel.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Debounced save for panel notes (2 seconds)
  const handleMyNotesChange = useCallback((value: string) => {
    setMyNotes(value);
    if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
    notesDebounceRef.current = setTimeout(() => {
      updateNotes.mutate({ notes: value });
    }, 2000);
  }, [updateNotes]);

  // Debounced save for panel score (2 seconds)
  const handleMyScoreChange = useCallback((value: string) => {
    setMyScore(value);
    if (scoreDebounceRef.current) clearTimeout(scoreDebounceRef.current);
    const parsed = value === "" ? null : parseInt(value, 10);
    if (parsed === null || (!isNaN(parsed) && parsed >= 0 && parsed <= 100)) {
      scoreDebounceRef.current = setTimeout(() => {
        updateNotes.mutate({ score_override: parsed });
      }, 2000);
    }
  }, [updateNotes]);

  // Load saved questions from interview notes on mount
  useEffect(() => {
    if (!id) return;
    supabase
      .from("interviews")
      .select("notes")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (!data?.notes) return;
        try {
          const parsed = JSON.parse(data.notes);
          if (Array.isArray(parsed?.questions) && parsed.questions.length > 0) {
            setScriptQuestions(parsed.questions);
          }
        } catch {
          // notes is plain text — no questions to show
        }
      });
  }, [id]);

  const toggleAsked = (qId: string) => {
    setAskedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  };

  // Index of the first unanswered question (for "current" highlight)
  const currentQuestionIndex = scriptQuestions.findIndex((q) => !askedQuestions.has(q.id));

  const handleStart = async () => {
    try {
      await interview.start();
    } catch {
      // Error is already set in useLiveInterview hook
    }
  };

  const handleEnd = async () => {
    try {
      await interview.stop();
    } catch {
      // Stop may fail if edge functions aren't deployed yet
    }
    navigate("/dashboard");
  };

  // Mobile blocker
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
        <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Monitor className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold mb-2">Desktop Required</h1>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            The interview room requires a desktop or laptop for the best experience.
            Please switch to a larger screen to join.
          </p>
          <a href="/dashboard">
            <Button variant="outline" className="w-full">Back to Dashboard</Button>
          </a>
        </div>
      </div>
    );
  }

  const scoreCategories = [
    { label: "Speech Patterns", score: interview.scores.speech, max: 25 },
    { label: "Response Timing", score: interview.scores.timing, max: 25 },
    { label: "Conversational Flow", score: interview.scores.flow, max: 25 },
    { label: "Linguistic Auth.", score: interview.scores.linguistic, max: 25 },
  ];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-xl flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <img src="/truevoice-logo.jpg" alt="TrueVoice HQ" className="h-6 object-contain" />
          <span className="text-muted-foreground text-sm hidden sm:inline">&mdash; Live Analysis</span>
        </div>
        <div className="flex items-center gap-3">
          {interview.isActive && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
              <Radio className="h-3 w-3 animate-pulse" />
              Live
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm font-mono tabular-nums">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            {formatTime(interview.elapsedSeconds)}
          </div>
          {interview.isTranscribing && (
            <div className="flex items-center gap-1.5 text-xs text-success">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              Transcribing
            </div>
          )}
          {panelists.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {panelists.length} panelist{panelists.length !== 1 ? "s" : ""} watching
            </div>
          )}
          <Button
            variant={panelMode ? "secondary" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => setPanelMode(!panelMode)}
          >
            <Users className="h-3.5 w-3.5" />
            Panel Mode
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-1.5" disabled={!interview.isActive}>
                <StopCircle className="h-3.5 w-3.5" />
                End Interview
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End Interview?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will stop the recording, save the transcript, and generate the final authenticity report.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continue</AlertDialogCancel>
                <AlertDialogAction onClick={handleEnd}>End & Generate Report</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main area */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          {/* Pre-start state */}
          {!interview.isActive && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-xl p-10 max-w-md text-center"
              >
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Mic className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">Audio Overlay Mode</h2>
                <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                  TrueVoice HQ captures your microphone audio to analyze speech patterns in real-time.
                </p>
                <p className="text-xs text-muted-foreground mb-6">
                  Run this alongside your Zoom, Meet, or Teams call.
                </p>
                {interview.audioError && (
                  <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3 mb-4">
                    {interview.audioError}
                  </div>
                )}
                <Button onClick={handleStart} size="lg" className="gap-2 w-full">
                  <Mic className="h-5 w-5" />
                  Start Analysis
                </Button>
              </motion.div>
            </div>
          )}

          {/* Active state — live transcript */}
          {interview.isActive && (
            <>
              {/* Controls */}
              <div className="flex items-center gap-3 mb-4">
                <Button
                  variant={micMuted ? "destructive" : "outline"}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setMicMuted(!micMuted)}
                >
                  {micMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  {micMuted ? "Muted" : "Mic On"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  {sidebarOpen ? "Hide" : "Show"} Analysis
                </Button>
              </div>

              {/* Transcript panel */}
              <div className="flex-1 glass-card rounded-xl p-6 overflow-y-auto">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Live Transcript</h3>
                </div>
                <div className="space-y-2 text-sm leading-relaxed">
                  {interview.transcript ? (
                    <p>{interview.transcript}</p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      Listening for speech... Start your interview in Zoom/Meet.
                    </p>
                  )}
                  {interview.interimText && (
                    <p className="text-muted-foreground/60 italic">{interview.interimText}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar — Analysis panel */}
        {interview.isActive && sidebarOpen && (
          <motion.aside
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-[340px] border-l border-border bg-card/50 overflow-y-auto p-5 shrink-0 space-y-5"
          >
            {/* Score + Radar row */}
            <div className="flex items-center justify-center gap-4">
              <ScoreGauge score={interview.overallScore} size={100} strokeWidth={8} />
              <MiniRadar
                speech={interview.scores.speech}
                timing={interview.scores.timing}
                flow={interview.scores.flow}
                linguistic={interview.scores.linguistic}
                overall={interview.overallScore}
                size={90}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Updates every ~20 seconds
            </p>

            {/* Sub-scores */}
            <div className="space-y-3">
              {scoreCategories.map((cat) => (
                <div key={cat.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{cat.label}</span>
                    <span className="text-xs font-bold tabular-nums">{cat.score}/{cat.max}</span>
                  </div>
                  <Progress value={(cat.score / cat.max) * 100} className="h-1.5" />
                </div>
              ))}
            </div>

            {/* Flags */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Detected Patterns
                {interview.flags.length > 0 && (
                  <span className="text-xs font-normal text-muted-foreground">({interview.flags.length})</span>
                )}
              </h3>
              {interview.flags.length === 0 ? (
                <p className="text-xs text-muted-foreground">No flags detected yet</p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {interview.flags.map((flag, i) => (
                    <motion.div
                      key={flag.id || i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`text-xs p-2.5 rounded-lg border ${severityBg(flag.severity)}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className={`h-2 w-2 rounded-full flex-shrink-0 mt-1 ${severityDot(flag.severity)}`} />
                        <div className="min-w-0">
                          <p className="leading-relaxed">{flag.pattern}</p>
                          <p className="text-muted-foreground mt-0.5 font-mono">{flag.time}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Question Script */}
            {scriptQuestions.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setScriptExpanded(!scriptExpanded)}
                  className="w-full flex items-center justify-between mb-2"
                >
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-primary" />
                    Question Script
                    <span className="text-xs font-normal text-muted-foreground">
                      ({askedQuestions.size}/{scriptQuestions.length})
                    </span>
                  </h3>
                  {scriptExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
                {scriptExpanded && (
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {scriptQuestions.map((q, i) => {
                      const isAsked = askedQuestions.has(q.id);
                      const isCurrent = i === currentQuestionIndex;
                      return (
                        <motion.div
                          key={q.id}
                          layout
                          className={`flex gap-2.5 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                            isAsked
                              ? "border-border bg-muted/30 opacity-50"
                              : isCurrent
                              ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                              : "border-border bg-transparent"
                          }`}
                          onClick={() => toggleAsked(q.id)}
                        >
                          <Checkbox
                            checked={isAsked}
                            onCheckedChange={() => toggleAsked(q.id)}
                            className="mt-0.5 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className={`text-xs leading-relaxed ${isAsked ? "line-through text-muted-foreground" : ""}`}>
                              {q.text}
                            </p>
                            <span
                              className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                QUESTION_TYPE_COLORS[q.type] ?? "bg-muted text-muted-foreground"
                              }`}
                            >
                              {q.type}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Interview Notes</h3>
              <Textarea
                placeholder="Add notes during the interview..."
                value={interview.notes}
                onChange={(e) => interview.setNotes(e.target.value)}
                className="min-h-[100px] text-sm resize-none"
              />
            </div>

            {/* Panel Mode section */}
            {panelMode && (
              <div className="border-t border-border pt-4 space-y-3">
                {/* Panelist avatars */}
                {panelists.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Panelists
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {panelists.map((p) => {
                        const initials = (p.profile.full_name ?? p.profile.email)
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase();
                        return (
                          <div key={p.id} className="flex items-center gap-1.5" title={p.profile.full_name ?? p.profile.email}>
                            {p.profile.avatar_url ? (
                              <img
                                src={p.profile.avatar_url}
                                alt={initials}
                                className="h-7 w-7 rounded-full object-cover border border-border"
                              />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-primary/10 border border-border flex items-center justify-center text-[10px] font-bold text-primary">
                                {initials}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* My Notes */}
                <div>
                  <h3 className="text-sm font-semibold mb-1.5">My Notes</h3>
                  <Textarea
                    placeholder="Private notes visible only to you..."
                    value={myNotes}
                    onChange={(e) => handleMyNotesChange(e.target.value)}
                    className="min-h-[80px] text-sm resize-none"
                  />
                  {updateNotes.isPending && (
                    <p className="text-[10px] text-muted-foreground mt-1">Saving...</p>
                  )}
                </div>

                {/* My Score */}
                <div>
                  <h3 className="text-sm font-semibold mb-1.5">My Score <span className="font-normal text-muted-foreground">(0-100, optional)</span></h3>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="e.g. 72"
                    value={myScore}
                    onChange={(e) => handleMyScoreChange(e.target.value)}
                    className="h-8 text-sm w-28"
                  />
                </div>
              </div>
            )}
          </motion.aside>
        )}

        {/* Sidebar toggle */}
        {interview.isActive && !sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 border-l border-border bg-card/50 flex items-center justify-center hover:bg-muted transition-colors group"
            title="Show Analysis"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        )}
      </div>
    </div>
  );
};

export default InterviewRoom;
