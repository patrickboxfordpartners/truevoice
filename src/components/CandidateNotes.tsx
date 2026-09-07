import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pin,
  PinOff,
  Trash2,
  MessageSquare,
  Flag,
  HelpCircle,
  CheckCircle2,
  Send,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CandidateNotesProps {
  candidateId: Id<"hiring_pipeline">;
  companyId?: string;
}

type NoteType = "note" | "flag" | "question" | "decision";

const TYPE_CONFIG: Record<NoteType, { label: string; icon: typeof MessageSquare; color: string }> = {
  note: { label: "Note", icon: MessageSquare, color: "bg-muted text-muted-foreground" },
  flag: { label: "Flag", icon: Flag, color: "bg-red-500/10 text-red-600" },
  question: { label: "Question", icon: HelpCircle, color: "bg-blue-500/10 text-blue-600" },
  decision: { label: "Decision", icon: CheckCircle2, color: "bg-green-500/10 text-green-600" },
};

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function CandidateNotes({ candidateId, companyId = "demo-company" }: CandidateNotesProps) {
  const notes = useQuery(api.queries.getCandidateNotes, { candidateId });
  const addNote = useMutation(api.mutations.addCandidateNote);
  const togglePin = useMutation(api.mutations.togglePinNote);
  const deleteNote = useMutation(api.mutations.deleteCandidateNote);

  const [content, setContent] = useState("");
  const [type, setType] = useState<NoteType>("note");
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const sortedNotes = useMemo(() => {
    if (!notes) return [];
    const pinned = notes.filter((n) => n.isPinned);
    const unpinned = notes.filter((n) => !n.isPinned);
    return [...pinned, ...unpinned];
  }, [notes]);

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addNote({ candidateId, companyId, authorName: "You", content: content.trim(), type });
      setContent("");
      setType("note");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (noteId: Id<"candidate_notes">) => {
    if (confirmDelete !== noteId) {
      setConfirmDelete(noteId);
      return;
    }
    await deleteNote({ noteId });
    setConfirmDelete(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Add note form */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm rounded-lg p-3 border border-border/50">
        <textarea
          className="w-full bg-transparent border border-border/50 rounded-md p-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-accent/50 placeholder:text-muted-foreground/60"
          rows={3}
          placeholder="Add a note, flag, question, or decision..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey) handleSubmit();
          }}
        />
        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-1">
            {(Object.keys(TYPE_CONFIG) as NoteType[]).map((t) => {
              const cfg = TYPE_CONFIG[t];
              const Icon = cfg.icon;
              return (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                    type === t
                      ? cfg.color + " ring-1 ring-current/20"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon size={12} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            <span className="ml-1.5">Add</span>
          </Button>
        </div>
      </div>

      {/* Notes list */}
      {notes === undefined ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : sortedNotes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No notes yet. Be the first to add one.
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          <AnimatePresence mode="popLayout">
            {sortedNotes.map((note) => {
              const cfg = TYPE_CONFIG[note.type];
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={note._id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="py-3 first:pt-0"
                >
                  <div className="flex items-start gap-3">
                    {/* Author avatar */}
                    <div className="h-7 w-7 rounded-full bg-accent/15 flex items-center justify-center text-accent text-xs font-semibold shrink-0 mt-0.5">
                      {note.authorName.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium">{note.authorName}</span>
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${cfg.color}`}>
                          <Icon size={10} />
                          {cfg.label}
                        </span>
                        {note.isPinned && (
                          <Pin size={10} className="text-accent fill-accent" />
                        )}
                        <span className="text-[11px] text-muted-foreground ml-auto">
                          {relativeTime(note.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words">
                        {note.content}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => togglePin({ noteId: note._id })}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title={note.isPinned ? "Unpin" : "Pin"}
                      >
                        {note.isPinned ? <PinOff size={13} /> : <Pin size={13} />}
                      </button>
                      <button
                        onClick={() => handleDelete(note._id)}
                        className={`p-1 rounded transition-colors ${
                          confirmDelete === note._id
                            ? "bg-red-500/10 text-red-600"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                        title="Delete"
                      >
                        {confirmDelete === note._id ? (
                          <span className="text-[10px] font-medium px-0.5">confirm?</span>
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default CandidateNotes;
