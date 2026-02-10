import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Mic, MicOff, Video, VideoOff, Settings, Maximize, PhoneOff,
  Shield, AlertTriangle, Clock, PanelRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScoreGauge } from "@/components/ScoreGauge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

// ─── Mock data helpers ──────────────────────────────────────────────
type Flag = { time: string; text: string; severity: "low" | "medium" | "high" };

const initialFlags: Flag[] = [
  { time: "3:45", text: "Reading cadence detected", severity: "medium" },
  { time: "7:22", text: "Unusually fast response (<1s)", severity: "high" },
];

const possibleFlags: Flag[] = [
  { text: "Monotone delivery pattern", severity: "medium", time: "" },
  { text: "Zero filler words (5 min segment)", severity: "medium", time: "" },
  { text: "Overly formal language detected", severity: "low", time: "" },
  { text: "Perfect grammar throughout segment", severity: "low", time: "" },
  { text: "Instant response to complex question", severity: "high", time: "" },
];

function formatElapsed(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

// ─── Sub-score card ─────────────────────────────────────────────────
const SubScore = ({ label, score, max }: { label: string; score: number; max: number }) => (
  <div>
    <div className="flex items-center justify-between text-xs mb-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{score}/{max}</span>
    </div>
    <Progress value={(score / max) * 100} className="h-1.5" />
  </div>
);

// ─── Severity colors ────────────────────────────────────────────────
const severityIcon = (s: string) =>
  s === "high" ? "🔴" : s === "medium" ? "⚠️" : "ℹ️";

// ─── Main component ─────────────────────────────────────────────────
const InterviewRoom = () => {
  const [elapsed, setElapsed] = useState(465);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [notes, setNotes] = useState("");
  const [showEnd, setShowEnd] = useState(false);
  const [flags, setFlags] = useState(initialFlags);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // live scores that drift over time
  const [scores, setScores] = useState({ speech: 20, timing: 18, flow: 21, linguistic: 22 });
  const overall = scores.speech + scores.timing + scores.flow + scores.linguistic;

  // Timer
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Simulate score drift + new flags every ~20s
  useEffect(() => {
    const t = setInterval(() => {
      setScores((prev) => ({
        speech: Math.min(25, Math.max(0, prev.speech + Math.round((Math.random() - 0.45) * 2))),
        timing: Math.min(25, Math.max(0, prev.timing + Math.round((Math.random() - 0.45) * 2))),
        flow: Math.min(25, Math.max(0, prev.flow + Math.round((Math.random() - 0.45) * 2))),
        linguistic: Math.min(25, Math.max(0, prev.linguistic + Math.round((Math.random() - 0.45) * 2))),
      }));

      if (Math.random() > 0.6) {
        const newFlag = possibleFlags[Math.floor(Math.random() * possibleFlags.length)];
        setFlags((f) => [
          { time: formatElapsed(elapsed), text: newFlag.text, severity: newFlag.severity },
          ...f,
        ]);
      }
    }, 8000);
    return () => clearInterval(t);
  }, [elapsed]);

  return (
    <div className="h-screen flex flex-col bg-foreground/[0.03]">
      {/* ─── Top Bar ──────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 h-14 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">AuthentiView</span>
        </div>
        <span className="text-sm text-muted-foreground hidden sm:block">
          Acme Corp Interview — Senior Frontend Engineer
        </span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-sm font-mono tabular-nums text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {formatElapsed(elapsed)}
          </span>
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowEnd(true)}
          >
            <PhoneOff className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">End</span>
          </Button>
        </div>
      </header>

      {/* ─── Body ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: video feeds + controls */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-3 p-4">
            {/* Interviewer Video */}
            <div className="relative rounded-xl bg-foreground/5 flex items-center justify-center overflow-hidden">
              <div className="text-muted-foreground text-sm">Interviewer Camera</div>
              <span className="absolute bottom-3 left-3 bg-card/80 backdrop-blur text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success" />
                John Doe
              </span>
            </div>
            {/* Candidate Video */}
            <div className="relative rounded-xl bg-foreground/5 flex items-center justify-center overflow-hidden">
              <div className="text-muted-foreground text-sm">Candidate Camera</div>
              <span className="absolute bottom-3 left-3 bg-card/80 backdrop-blur text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success" />
                Sarah Chen
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 py-3 border-t border-border bg-card shrink-0">
            <Button
              variant={micOn ? "outline" : "destructive"}
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => setMicOn(!micOn)}
            >
              {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
            <Button
              variant={camOn ? "outline" : "destructive"}
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => setCamOn(!camOn)}
            >
              {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full">
              <Maximize className="h-4 w-4" />
            </Button>
            {/* Drawer toggle — visible only below lg */}
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full lg:hidden"
              onClick={() => setDrawerOpen(true)}
            >
              <PanelRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ─── Right Sidebar (desktop) ────────────────────────────── */}
        <aside className="hidden lg:flex w-[320px] border-l border-border bg-card flex-col shrink-0">
          <SidebarContent
            overall={overall}
            scores={scores}
            flags={flags}
            notes={notes}
            setNotes={setNotes}
          />
        </aside>
      </div>

      {/* ─── Drawer Sidebar (tablet / mobile) ─────────────────────── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-[340px] sm:w-[360px] p-0 overflow-y-auto">
          <SheetHeader className="px-5 pt-5 pb-0">
            <SheetTitle className="text-sm">Live Analysis</SheetTitle>
          </SheetHeader>
          <SidebarContent
            overall={overall}
            scores={scores}
            flags={flags}
            notes={notes}
            setNotes={setNotes}
          />
        </SheetContent>
      </Sheet>

      {/* ─── End Interview Confirmation ───────────────────────────── */}
      <Dialog open={showEnd} onOpenChange={setShowEnd}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>End Interview?</DialogTitle>
            <DialogDescription>
              This will end the session and generate the authenticity report.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="outline" onClick={() => setShowEnd(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowEnd(false);
                window.location.href = "/report/1";
              }}
            >
              End Interview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InterviewRoom;
