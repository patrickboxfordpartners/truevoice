import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, User, Plus, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type InterviewType = "screening" | "technical" | "final" | "behavioral";

interface ScheduledInterview {
  id: string;
  dateTime: string;
  interviewer: string;
  type: InterviewType;
  duration: number;
  notes: string;
}

interface InterviewScheduleCardProps {
  candidateId: string;
  candidateName: string;
  position: string;
  stage: string;
  className?: string;
}

const TYPE_COLORS: Record<InterviewType, string> = {
  screening: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  technical: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  final: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  behavioral: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
};

const TYPE_LABELS: Record<InterviewType, string> = {
  screening: "Screening",
  technical: "Technical",
  final: "Final Round",
  behavioral: "Behavioral",
};

export function InterviewScheduleCard({
  candidateName,
  position,
  stage,
  className = "",
}: InterviewScheduleCardProps) {
  const [interviews, setInterviews] = useState<ScheduledInterview[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    dateTime: "",
    interviewer: "",
    type: "screening" as InterviewType,
    duration: 45,
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dateTime || !formData.interviewer) return;

    const newInterview: ScheduledInterview = {
      id: crypto.randomUUID(),
      ...formData,
    };

    setInterviews((prev) =>
      [...prev, newInterview].sort(
        (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
      )
    );
    setFormData({ dateTime: "", interviewer: "", type: "screening", duration: 45, notes: "" });
    setShowForm(false);
  };

  const deleteInterview = (id: string) => {
    setInterviews((prev) => prev.filter((i) => i.id !== id));
  };

  const isUpcoming = (dateTime: string) => new Date(dateTime) > new Date();

  const formatDate = (dateTime: string) => {
    const d = new Date(dateTime);
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  };

  const formatTime = (dateTime: string) => {
    const d = new Date(dateTime);
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Interviews</h3>
          {interviews.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {interviews.filter((i) => isUpcoming(i.dateTime)).length} upcoming
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="h-7 gap-1 bg-accent text-accent-foreground hover:bg-accent/90 text-xs"
        >
          {showForm ? <ChevronDown className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          {showForm ? "Cancel" : "Schedule"}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
            onSubmit={handleSubmit}
          >
            <div className="border border-border/50 rounded-lg p-3 bg-card/50 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.dateTime}
                    onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Interviewer</label>
                  <input
                    type="text"
                    placeholder="Name"
                    value={formData.interviewer}
                    onChange={(e) => setFormData({ ...formData, interviewer: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as InterviewType })}
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                  >
                    <option value="screening">Screening</option>
                    <option value="technical">Technical</option>
                    <option value="final">Final Round</option>
                    <option value="behavioral">Behavioral</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                  >
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                <textarea
                  placeholder="Optional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs resize-none"
                />
              </div>
              <Button type="submit" size="sm" className="w-full h-7 text-xs bg-accent text-accent-foreground hover:bg-accent/90">
                Schedule Interview
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {interviews.length === 0 && !showForm && (
        <div className="border border-dashed border-border/50 rounded-lg p-6 flex flex-col items-center gap-2 text-muted-foreground">
          <Calendar className="h-8 w-8 opacity-40" />
          <p className="text-xs">No interviews scheduled</p>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {interviews.map((interview) => {
          const upcoming = isUpcoming(interview.dateTime);
          return (
            <motion.div
              key={interview.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className={`border border-border/50 rounded-lg p-3 bg-card/50 group ${
                upcoming ? "" : "opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-[10px] border ${TYPE_COLORS[interview.type]}`}>
                      {TYPE_LABELS[interview.type]}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${
                        upcoming
                          ? "bg-green-500/10 text-green-600 border-green-500/20"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {upcoming ? "Upcoming" : "Completed"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(interview.dateTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(interview.dateTime)} ({interview.duration}m)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-foreground">
                    <User className="h-3 w-3 text-muted-foreground" />
                    {interview.interviewer}
                  </div>
                  {interview.notes && (
                    <p className="text-xs text-muted-foreground truncate">{interview.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteInterview(interview.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default InterviewScheduleCard;
