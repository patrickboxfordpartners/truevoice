import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/ScoreBadge";
import { cn } from "@/lib/utils";

interface Interview {
  id: string;
  candidate: string;
  position: string;
  date: string;
  duration: string;
  score: number;
}

interface InterviewCalendarProps {
  interviews: Interview[];
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const InterviewCalendar = ({ interviews }: InterviewCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1, 1)); // Feb 2026 to match mock data
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const interviewsByDate = useMemo(() => {
    const map = new Map<string, Interview[]>();
    interviews.forEach((iv) => {
      const key = format(new Date(iv.date), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(iv);
    });
    return map;
  }, [interviews]);

  const selectedInterviews = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return (interviewsByDate.get(key) || []).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [selectedDate, interviewsByDate]);

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth((m) => subMonths(m, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setCurrentMonth(new Date(2026, 1, 1))}>
            Today
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth((m) => addMonths(m, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px rounded-lg overflow-hidden border border-border bg-border">
        {/* Header */}
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-muted px-2 py-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}

        {/* Days */}
        {calendarDays.map((day, i) => {
          const key = format(day, "yyyy-MM-dd");
          const dayInterviews = interviewsByDate.get(key) || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date(2026, 1, 10)); // mock "today"

          return (
            <div
              key={i}
              onClick={() => setSelectedDate(day)}
              className={cn(
                "bg-card min-h-[80px] p-1.5 cursor-pointer transition-colors hover:bg-muted/50 relative",
                !isCurrentMonth && "opacity-40",
                isSelected && "ring-2 ring-primary ring-inset"
              )}
            >
              <span
                className={cn(
                  "text-xs font-medium inline-flex items-center justify-center h-6 w-6 rounded-full",
                  isToday && "bg-primary text-primary-foreground"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {dayInterviews.slice(0, 2).map((iv) => (
                  <div
                    key={iv.id}
                    className={cn(
                      "text-[10px] leading-tight px-1 py-0.5 rounded truncate",
                      iv.score >= 80
                        ? "bg-success/10 text-success"
                        : iv.score >= 50
                        ? "bg-warning/10 text-warning"
                        : "bg-destructive/10 text-destructive"
                    )}
                  >
                    {format(new Date(iv.date), "h:mm a")} {iv.candidate.split(" ")[0]}
                  </div>
                ))}
                {dayInterviews.length > 2 && (
                  <span className="text-[10px] text-muted-foreground px-1">
                    +{dayInterviews.length - 2} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected day detail */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            key={format(selectedDate, "yyyy-MM-dd")}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass-card rounded-xl p-4"
          >
            <h4 className="text-sm font-semibold mb-3">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
              <span className="ml-2 text-muted-foreground font-normal">
                ({selectedInterviews.length} interview{selectedInterviews.length !== 1 ? "s" : ""})
              </span>
            </h4>
            {selectedInterviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No interviews scheduled for this day.</p>
            ) : (
              <div className="space-y-2">
                {selectedInterviews.map((iv) => (
                  <div key={iv.id} className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 w-[70px]">
                        <Clock className="h-3 w-3" />
                        {format(new Date(iv.date), "h:mm a")}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{iv.candidate}</p>
                        <p className="text-xs text-muted-foreground truncate">{iv.position}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <ScoreBadge score={iv.score} />
                      <Link to={`/report/${iv.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs">View</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
