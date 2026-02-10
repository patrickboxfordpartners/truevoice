import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  getHours,
  getMinutes,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, GripVertical } from "lucide-react";
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
  onReschedule?: (interviewId: string, newDate: string) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MOCK_TODAY = new Date(2026, 1, 10);

// Time slots from 8 AM to 6 PM
const TIME_SLOTS = Array.from({ length: 11 }, (_, i) => i + 8);

const parseDurationMinutes = (dur: string): number => {
  const [m, s] = dur.split(":").map(Number);
  return m + (s > 0 ? 1 : 0);
};

export const InterviewCalendar = ({ interviews, onReschedule }: InterviewCalendarProps) => {
  const [calView, setCalView] = useState<"month" | "week">("month");
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1, 1));
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(MOCK_TODAY));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

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

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

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

  const navPrev = () => {
    if (calView === "month") setCurrentMonth((m) => subMonths(m, 1));
    else setCurrentWeekStart((w) => subWeeks(w, 1));
  };

  const navNext = () => {
    if (calView === "month") setCurrentMonth((m) => addMonths(m, 1));
    else setCurrentWeekStart((w) => addWeeks(w, 1));
  };

  const navToday = () => {
    if (calView === "month") setCurrentMonth(new Date(2026, 1, 1));
    else setCurrentWeekStart(startOfWeek(MOCK_TODAY));
  };

  const headerLabel =
    calView === "month"
      ? format(currentMonth, "MMMM yyyy")
      : `${format(currentWeekStart, "MMM d")} – ${format(addDays(currentWeekStart, 6), "MMM d, yyyy")}`;

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold">{headerLabel}</h3>
          <div className="flex items-center rounded-lg border border-border p-0.5">
            <Button
              variant={calView === "month" ? "default" : "ghost"}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setCalView("month")}
            >
              Month
            </Button>
            <Button
              variant={calView === "week" ? "default" : "ghost"}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setCalView("week")}
            >
              Week
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={navPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={navToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={navNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Month View */}
      {calView === "month" && (
        <>
          <div className="grid grid-cols-7 gap-px rounded-lg overflow-hidden border border-border bg-border">
            {WEEKDAYS.map((d) => (
              <div key={d} className="bg-muted px-2 py-2 text-center text-xs font-medium text-muted-foreground">
                {d}
              </div>
            ))}
            {calendarDays.map((day, i) => {
              const key = format(day, "yyyy-MM-dd");
              const dayInterviews = interviewsByDate.get(key) || [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, MOCK_TODAY);

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
                          iv.score >= 80 ? "bg-success/10 text-success"
                            : iv.score >= 50 ? "bg-warning/10 text-warning"
                            : "bg-destructive/10 text-destructive"
                        )}
                      >
                        {format(new Date(iv.date), "h:mm a")} {iv.candidate.split(" ")[0]}
                      </div>
                    ))}
                    {dayInterviews.length > 2 && (
                      <span className="text-[10px] text-muted-foreground px-1">+{dayInterviews.length - 2} more</span>
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
        </>
      )}

      {/* Week View */}
      {calView === "week" && (
        <div className="rounded-lg border border-border overflow-hidden">
          {/* Week header */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-muted border-b border-border">
            <div className="px-2 py-2 text-xs text-muted-foreground" />
            {weekDays.map((day, i) => {
              const isToday = isSameDay(day, MOCK_TODAY);
              return (
                <div key={i} className="px-2 py-2 text-center border-l border-border">
                  <span className="text-[10px] uppercase text-muted-foreground font-medium">
                    {format(day, "EEE")}
                  </span>
                  <span
                    className={cn(
                      "block text-sm font-semibold mt-0.5 mx-auto w-7 h-7 leading-7 rounded-full",
                      isToday && "bg-primary text-primary-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
            {TIME_SLOTS.map((hour) => (
              <div key={hour} className="contents">
                {/* Time label */}
                <div className="h-16 px-2 flex items-start justify-end pt-0.5 border-b border-border">
                  <span className="text-[10px] text-muted-foreground">
                    {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                  </span>
                </div>
                {/* Day cells */}
                {weekDays.map((day, di) => {
                  const key = format(day, "yyyy-MM-dd");
                  const dayInterviews = interviewsByDate.get(key) || [];
                  const slotInterviews = dayInterviews.filter((iv) => {
                    const d = new Date(iv.date);
                    return getHours(d) === hour;
                  });

                  return (
                    <div
                      key={di}
                      className="h-16 border-l border-b border-border bg-card relative hover:bg-muted/30 transition-colors"
                    >
                      {slotInterviews.map((iv) => {
                        const d = new Date(iv.date);
                        const mins = getMinutes(d);
                        const durationMins = parseDurationMinutes(iv.duration);
                        const topOffset = (mins / 60) * 100;
                        const heightPx = Math.max(24, (durationMins / 60) * 64);

                        return (
                          <Link
                            key={iv.id}
                            to={`/report/${iv.id}`}
                            className="absolute left-0.5 right-0.5 z-10 group"
                            style={{
                              top: `${topOffset}%`,
                              height: `${heightPx}px`,
                            }}
                          >
                            <div
                              className={cn(
                                "h-full rounded px-1.5 py-0.5 overflow-hidden text-[10px] leading-tight border-l-2 transition-shadow group-hover:shadow-md",
                                iv.score >= 80
                                  ? "bg-success/10 border-success text-success"
                                  : iv.score >= 50
                                  ? "bg-warning/10 border-warning text-warning"
                                  : "bg-destructive/10 border-destructive text-destructive"
                              )}
                            >
                              <p className="font-medium truncate">{iv.candidate}</p>
                              <p className="opacity-70 truncate">
                                {format(d, "h:mm a")} · {iv.duration}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
