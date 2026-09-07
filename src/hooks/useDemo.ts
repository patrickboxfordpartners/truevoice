import { useState, useCallback, useRef, useEffect } from "react";

/**
 * State machine for the three-act landing page demo.
 *
 * Act 1: Interview simulation (transcript types out, scores animate)
 * Act 2: Intelligence pipeline (agents activate in sequence)
 * Act 3: Approval queue (interactive approve/reject/modify)
 */

export type DemoAct = "idle" | "interview" | "pipeline" | "approval" | "complete";

export interface TranscriptLine {
  speaker: "interviewer" | "candidate";
  text: string;
  timestamp: string;
}

export interface DemoScores {
  overall: number;
  speech: number;
  timing: number;
  flow: number;
  linguistic: number;
}

export interface PipelineStage {
  id: string;
  label: string;
  icon: string;
  status: "waiting" | "running" | "complete" | "skipped";
  duration?: number;
  detail?: string;
}

export interface DemoBrief {
  recommendation: "advance" | "review" | "reject";
  confidenceScore: number;
  summary: string;
  strengths: string[];
  risks: string[];
  questions: { question: string; gap: string }[];
  sources: string[];
}

export interface DemoCandidate {
  name: string;
  position: string;
  email: string;
  brief: DemoBrief;
  draftEmailSubject: string;
}

// ── Demo data ─────────────────────────────────────────────────────

const TRANSCRIPT: TranscriptLine[] = [
  { speaker: "interviewer", text: "Tell me about your experience leading cross-functional teams.", timestamp: "0:12" },
  { speaker: "candidate", text: "At my last role, I led a team of eight engineers and three designers through a full platform rewrite. We shipped in fourteen weeks, which was two weeks ahead of schedule.", timestamp: "0:18" },
  { speaker: "interviewer", text: "What was the biggest challenge?", timestamp: "0:34" },
  { speaker: "candidate", text: "Honestly, alignment. Engineering wanted to rebuild everything from scratch, but design had strong opinions about preserving the existing UX patterns. I set up weekly cross-team reviews where each side had to present the other's constraints.", timestamp: "0:38" },
  { speaker: "interviewer", text: "How did that land?", timestamp: "1:02" },
  { speaker: "candidate", text: "It worked well. By sprint three, the friction dropped significantly. We ended up with a hybrid approach that kept the best of both worlds.", timestamp: "1:05" },
];

const SCORE_KEYFRAMES: { time: number; scores: DemoScores; flag?: string }[] = [
  { time: 0, scores: { overall: 0, speech: 0, timing: 0, flow: 0, linguistic: 0 } },
  { time: 800, scores: { overall: 42, speech: 45, timing: 38, flow: 40, linguistic: 44 } },
  { time: 2000, scores: { overall: 61, speech: 64, timing: 55, flow: 62, linguistic: 63 } },
  { time: 3500, scores: { overall: 74, speech: 78, timing: 68, flow: 73, linguistic: 76 } },
  { time: 5000, scores: { overall: 82, speech: 86, timing: 76, flow: 81, linguistic: 84 } },
  { time: 6500, scores: { overall: 71, speech: 82, timing: 58, flow: 74, linguistic: 70 }, flag: "Unusual response latency detected at 1:02" },
  { time: 8000, scores: { overall: 79, speech: 85, timing: 68, flow: 78, linguistic: 83 } },
  { time: 9500, scores: { overall: 84, speech: 88, timing: 74, flow: 83, linguistic: 86 } },
];

const PIPELINE_STAGES: PipelineStage[] = [
  { id: "scores", label: "Interview Scores", icon: "chart", status: "waiting", detail: "84/100 authenticity" },
  { id: "firecrawl", label: "Firecrawl", icon: "globe", status: "waiting", detail: "LinkedIn + GitHub scraped" },
  { id: "mitosis", label: "Mitosis Memory", icon: "brain", status: "waiting", detail: "3 similar hires recalled" },
  { id: "openai", label: "OpenAI Synthesis", icon: "sparkles", status: "waiting", detail: "Brief generated" },
  { id: "cotal", label: "Cotal Broadcast", icon: "radio", status: "waiting", detail: "Team notified" },
];

const DEMO_CANDIDATES: DemoCandidate[] = [
  {
    name: "Jordan Nakamura",
    position: "Senior Engineering Manager",
    email: "jordan@example.com",
    brief: {
      recommendation: "advance",
      confidenceScore: 84,
      summary: "Strong leadership signal with evidence of shipping under pressure. Cross-functional alignment skills match the role's primary requirement.",
      strengths: [
        "Led 11-person team through platform rewrite, shipped 2 weeks early",
        "Demonstrated conflict resolution between engineering and design",
        "High authenticity scores across all dimensions (84/100)",
      ],
      risks: [
        "Response latency spike at 1:02 suggests possible rehearsed answer on challenges topic",
        "No evidence of budget ownership or P&L experience",
      ],
      questions: [
        { question: "Walk me through a time you had to make a build-vs-buy decision with real budget constraints.", gap: "Budget ownership" },
        { question: "Your response timing shifted when discussing challenges. Can you walk me through that moment in more detail?", gap: "Authenticity flag" },
      ],
      sources: ["interview_scores", "firecrawl", "mitosis", "openai"],
    },
    draftEmailSubject: "Next steps for your Senior Engineering Manager application",
  },
  {
    name: "Priya Sharma",
    position: "Product Designer",
    email: "priya@example.com",
    brief: {
      recommendation: "review",
      confidenceScore: 58,
      summary: "Portfolio shows strong visual craft but limited systems thinking. Interview scores suggest moderate confidence, and institutional memory flags similar candidates who struggled with the technical depth required.",
      strengths: [
        "Portfolio includes 3 shipped design systems",
        "Strong communication quality (78/100)",
      ],
      risks: [
        "Similar past hires struggled with engineering collaboration",
        "Limited evidence of data-informed design decisions",
        "Moderate interview authenticity (62/100)",
      ],
      questions: [
        { question: "Show me a design decision you reversed based on data.", gap: "Data-informed design" },
      ],
      sources: ["interview_scores", "firecrawl", "mitosis", "openai"],
    },
    draftEmailSubject: "Follow-up on your Product Designer application",
  },
  {
    name: "Marcus Chen",
    position: "Backend Engineer",
    email: "marcus@example.com",
    brief: {
      recommendation: "reject",
      confidenceScore: 31,
      summary: "Multiple critical flags during interview. GitHub shows 2 years of inactivity. Institutional memory shows the claimed previous employer has no record of employment.",
      strengths: [
        "Strong technical vocabulary in distributed systems",
      ],
      risks: [
        "3 critical fraud flags during interview (38/100 authenticity)",
        "GitHub inactive since 2024, contradicts claimed recent contributions",
        "Employment verification failed via institutional memory",
      ],
      questions: [
        { question: "Can you share your GitHub handle and walk me through a recent commit?", gap: "Verification" },
      ],
      sources: ["interview_scores", "firecrawl", "mitosis", "openai"],
    },
    draftEmailSubject: "Update on your Backend Engineer application",
  },
];

// ── Hook ──────────────────────────────────────────────────────────

export function useDemo() {
  const [act, setAct] = useState<DemoAct>("idle");
  const [transcriptIndex, setTranscriptIndex] = useState(0);
  const [scores, setScores] = useState<DemoScores>(SCORE_KEYFRAMES[0].scores);
  const [flags, setFlags] = useState<string[]>([]);
  const [scoreKeyIndex, setScoreKeyIndex] = useState(0);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>(PIPELINE_STAGES.map(s => ({ ...s })));
  const [candidates, setCandidates] = useState<(DemoCandidate & { resolved?: string })[]>(
    DEMO_CANDIDATES.map(c => ({ ...c }))
  );
  const [activeCandidateIndex, setActiveCandidateIndex] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
  }, []);

  const addTimer = useCallback((fn: () => void, ms: number) => {
    timerRef.current.push(setTimeout(fn, ms));
  }, []);

  // ── Act 1: Interview ─────────────────────────────────────────
  const startInterview = useCallback(() => {
    setAct("interview");
    setTranscriptIndex(0);
    setScoreKeyIndex(0);
    setScores(SCORE_KEYFRAMES[0].scores);
    setFlags([]);

    // Transcript lines appear at intervals
    TRANSCRIPT.forEach((_, i) => {
      if (i === 0) return;
      addTimer(() => setTranscriptIndex(i), i * 1600);
    });

    // Score keyframes
    SCORE_KEYFRAMES.forEach((kf, i) => {
      if (i === 0) return;
      addTimer(() => {
        setScores(kf.scores);
        setScoreKeyIndex(i);
        if (kf.flag) {
          setFlags(prev => [...prev, kf.flag!]);
        }
      }, kf.time);
    });

    // Auto-advance to pipeline after scores finish
    const lastTime = SCORE_KEYFRAMES[SCORE_KEYFRAMES.length - 1].time;
    addTimer(() => startPipeline(), lastTime + 1500);
  }, [addTimer]);

  // ── Act 2: Pipeline ──────────────────────────────────────────
  const startPipeline = useCallback(() => {
    setAct("pipeline");
    const stages = PIPELINE_STAGES.map(s => ({ ...s }));
    setPipelineStages(stages);

    const stageDelays = [0, 600, 1800, 3000, 4800];
    const stageDurations = [400, 900, 800, 1200, 600];

    stageDelays.forEach((delay, i) => {
      addTimer(() => {
        setPipelineStages(prev => prev.map((s, j) =>
          j === i ? { ...s, status: "running" as const } : s
        ));
      }, delay);

      addTimer(() => {
        setPipelineStages(prev => prev.map((s, j) =>
          j === i ? { ...s, status: "complete" as const, duration: stageDurations[i] } : s
        ));
      }, delay + stageDurations[i]);
    });

    // Auto-advance to approval
    const totalTime = stageDelays[stageDelays.length - 1] + stageDurations[stageDurations.length - 1];
    addTimer(() => setAct("approval"), totalTime + 1000);
  }, [addTimer]);

  // ── Act 3: Approval ──────────────────────────────────────────
  const resolveCandidate = useCallback((index: number, decision: string) => {
    setCandidates(prev => prev.map((c, i) =>
      i === index ? { ...c, resolved: decision } : c
    ));
    // Auto-focus next unresolved
    const nextIndex = candidates.findIndex((c, i) => i > index && !c.resolved);
    if (nextIndex !== -1) {
      setTimeout(() => setActiveCandidateIndex(nextIndex), 400);
    } else {
      setTimeout(() => setAct("complete"), 800);
    }
  }, [candidates]);

  // ── Controls ─────────────────────────────────────────────────
  const start = useCallback(() => {
    clearTimers();
    setCandidates(DEMO_CANDIDATES.map(c => ({ ...c })));
    setActiveCandidateIndex(0);
    startInterview();
  }, [clearTimers, startInterview]);

  const reset = useCallback(() => {
    clearTimers();
    setAct("idle");
    setTranscriptIndex(0);
    setScores(SCORE_KEYFRAMES[0].scores);
    setFlags([]);
    setScoreKeyIndex(0);
    setPipelineStages(PIPELINE_STAGES.map(s => ({ ...s })));
    setCandidates(DEMO_CANDIDATES.map(c => ({ ...c })));
    setActiveCandidateIndex(0);
  }, [clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  return {
    act,
    // Act 1
    transcript: TRANSCRIPT.slice(0, transcriptIndex + 1),
    scores,
    flags,
    scoreProgress: scoreKeyIndex / (SCORE_KEYFRAMES.length - 1),
    // Act 2
    pipelineStages,
    // Act 3
    candidates,
    activeCandidateIndex,
    setActiveCandidateIndex,
    resolveCandidate,
    // Controls
    start,
    reset,
  };
}
