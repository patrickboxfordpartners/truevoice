import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, MessageSquare, Send, AlertTriangle, Flag, HelpCircle,
  CheckCircle, ChevronDown, ChevronUp, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ScoreGauge } from "@/components/ScoreGauge";
import { Progress } from "@/components/ui/progress";
import {
  useLiveSessions,
  useSharedNotes,
  useInterviewScores,
  useCollaborationSession,
  useCreateSharedNote,
} from "@/hooks/useCollaboration";
import { useAuth } from "@/contexts/AuthContext";
import { SCORE_LABELS } from "@/lib/scoreLabels";
import { formatDistanceToNow } from "date-fns";

interface CollaborationPanelProps {
  interviewId: string;
  companyId: string;
}

const NOTE_TYPE_CONFIG = {
  note: { icon: MessageSquare, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", label: "Note" },
  flag: { icon: Flag, color: "bg-red-500/10 text-red-600 dark:text-red-400", label: "Flag" },
  question: { icon: HelpCircle, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", label: "Question" },
  decision: { icon: CheckCircle, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", label: "Decision" },
};

export const CollaborationPanel = ({ interviewId, companyId }: CollaborationPanelProps) => {
  const { profile } = useAuth();
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState<"note" | "flag" | "question" | "decision">("note");
  const [scoresExpanded, setScoresExpanded] = useState(true);
  const [notesExpanded, setNotesExpanded] = useState(true);

  // Real-time collaboration hooks
  useCollaborationSession(interviewId, companyId);
  const liveSessions = useLiveSessions(interviewId);
  const sharedNotes = useSharedNotes(interviewId);
  const scores = useInterviewScores(interviewId);
  const createNote = useCreateSharedNote(interviewId, companyId);

  // Extract @mentions from note content
  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  const handleSendNote = async () => {
    if (!noteContent.trim()) return;

    const mentions = extractMentions(noteContent);
    await createNote(noteContent, noteType, mentions);
    setNoteContent("");
    setNoteType("note");
  };

  // Filter out current user from presence list
  const otherViewers = useMemo(() => {
    if (!liveSessions || !profile) return [];
    return liveSessions.filter((session: any) => session.userId !== profile.id);
  }, [liveSessions, profile]);

  // Group notes by type for better organization
  const notesByType = useMemo(() => {
    if (!sharedNotes) return { note: [], flag: [], question: [], decision: [] };
    return (sharedNotes as any[]).reduce((acc, note) => {
      const type = note.type || "note";
      if (!acc[type]) acc[type] = [];
      acc[type].push(note);
      return acc;
    }, { note: [], flag: [], question: [], decision: [] });
  }, [sharedNotes]);

  const scoreCategories = [
    { label: SCORE_LABELS.speech, score: scores?.speechScore ?? 0, max: 25 },
    { label: SCORE_LABELS.timing, score: scores?.timingScore ?? 0, max: 25 },
    { label: SCORE_LABELS.flow, score: scores?.flowScore ?? 0, max: 25 },
    { label: SCORE_LABELS.linguistic, score: scores?.linguisticScore ?? 0, max: 25 },
  ];

  return (
    <div className="flex flex-col h-full bg-card/50 border-l border-border">
      {/* Header - Presence Indicators */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Live Viewers
          </h3>
          <Badge variant="secondary" className="tabular-nums">
            {(liveSessions?.length ?? 0)}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {liveSessions && liveSessions.length > 0 ? (
            liveSessions.map((session: any) => {
              const initials = session.userName
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              const isCurrentUser = profile?.id === session.userId;

              return (
                <motion.div
                  key={session._id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="relative group"
                  title={`${session.userName}${isCurrentUser ? " (You)" : ""}`}
                >
                  {session.userAvatar ? (
                    <img
                      src={session.userAvatar}
                      alt={initials}
                      className={`h-9 w-9 rounded-full object-cover border-2 ${
                        isCurrentUser ? "border-primary" : "border-border"
                      }`}
                    />
                  ) : (
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                        isCurrentUser
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-muted border-border text-muted-foreground"
                      }`}
                    >
                      {initials}
                    </div>
                  )}
                  {/* Active indicator */}
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-card" />
                  {/* Tooltip */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover border border-border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {session.userName}{isCurrentUser && " (You)"}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <p className="text-xs text-muted-foreground">No viewers yet</p>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Live Authenticity Score */}
          <div>
            <button
              onClick={() => setScoresExpanded(!scoresExpanded)}
              className="w-full flex items-center justify-between mb-3 group"
            >
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Live Authenticity Score
              </h3>
              {scoresExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              )}
            </button>

            <AnimatePresence>
              {scoresExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  {/* Main score gauge */}
                  <div className="flex justify-center py-2">
                    <ScoreGauge
                      score={scores?.overallScore ?? 0}
                      size={110}
                      strokeWidth={8}
                      showLabel={true}
                      animated={true}
                    />
                  </div>

                  {/* Sub-scores */}
                  <div className="space-y-2.5">
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

                  {/* Additional metrics */}
                  {scores && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="bg-muted/50 rounded-lg p-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Engagement</p>
                        <p className="text-lg font-bold">{scores.engagement}%</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Confidence</p>
                        <p className="text-lg font-bold">{scores.confidence}%</p>
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-muted-foreground text-center">
                    Updates in real-time
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Separator />

          {/* Shared Notes & Chat */}
          <div>
            <button
              onClick={() => setNotesExpanded(!notesExpanded)}
              className="w-full flex items-center justify-between mb-3 group"
            >
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Shared Notes
                {sharedNotes && sharedNotes.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {sharedNotes.length}
                  </Badge>
                )}
              </h3>
              {notesExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              )}
            </button>

            <AnimatePresence>
              {notesExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  {/* Note input */}
                  <div className="space-y-2">
                    <div className="flex gap-1.5">
                      {(Object.keys(NOTE_TYPE_CONFIG) as Array<keyof typeof NOTE_TYPE_CONFIG>).map((type) => {
                        const config = NOTE_TYPE_CONFIG[type];
                        const Icon = config.icon;
                        return (
                          <button
                            key={type}
                            onClick={() => setNoteType(type)}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                              noteType === type
                                ? config.color
                                : "bg-muted/50 text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            <Icon className="h-3 w-3" />
                            {config.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Add a note or use @name to mention..."
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            handleSendNote();
                          }
                        }}
                        className="min-h-[60px] text-sm resize-none"
                      />
                      <Button
                        size="sm"
                        onClick={handleSendNote}
                        disabled={!noteContent.trim()}
                        className="shrink-0"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Use @name to mention • Cmd/Ctrl+Enter to send
                    </p>
                  </div>

                  {/* Notes list */}
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {sharedNotes && sharedNotes.length > 0 ? (
                      <>
                        {(sharedNotes as any[]).map((note) => {
                          const config = NOTE_TYPE_CONFIG[note.type as keyof typeof NOTE_TYPE_CONFIG] || NOTE_TYPE_CONFIG.note;
                          const Icon = config.icon;
                          const isOwnNote = profile?.id === note.authorId;

                          return (
                            <motion.div
                              key={note._id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={`p-3 rounded-lg border ${config.color} ${
                                isOwnNote ? "ring-1 ring-primary/20" : ""
                              }`}
                            >
                              <div className="flex items-start gap-2 mb-1.5">
                                <Icon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="text-xs font-semibold truncate">
                                      {note.authorName}
                                      {isOwnNote && <span className="text-muted-foreground ml-1">(You)</span>}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                      {formatDistanceToNow(note.createdAt, { addSuffix: true })}
                                    </span>
                                  </div>
                                  <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                                    {note.content}
                                  </p>
                                  {note.transcriptTimestamp && (
                                    <div className="mt-1.5 flex items-center gap-1">
                                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                                        @ {note.transcriptTimestamp}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">
                          No notes yet. Start collaborating!
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
