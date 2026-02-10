export interface CandidateReport {
  id: string;
  candidate: string;
  position: string;
  date: string;
  duration: string;
  interviewer: string;
  overall: number;
  speech: number;
  timing: number;
  flow: number;
  linguistic: number;
  engagement: number;
  confidence: number;
  flags: { time: string; pattern: string; severity: "low" | "medium" | "high" }[];
  notes: string;
  timeline: { min: string; score: number }[];
  responseDelays: { question: string; delay: number; label: string }[];
}

export const candidateReports: Record<string, CandidateReport> = {
  "1": {
    id: "1",
    candidate: "Sarah Chen",
    position: "Senior Frontend Engineer",
    date: "Feb 10, 2026 at 2:00 PM",
    duration: "42:15",
    interviewer: "John Doe",
    overall: 87,
    speech: 22,
    timing: 20,
    flow: 23,
    linguistic: 22,
    engagement: 90,
    confidence: 85,
    flags: [
      { time: "12:45", pattern: "Slight reading cadence detected", severity: "medium" },
      { time: "28:10", pattern: "Fast response to complex question (<1.5s)", severity: "low" },
    ],
    notes: "Strong candidate overall. Very natural conversational style. Deep technical knowledge demonstrated through follow-up questions.",
    timeline: [
      { min: "0:00", score: 82 }, { min: "5:00", score: 85 }, { min: "10:00", score: 88 },
      { min: "15:00", score: 84 }, { min: "20:00", score: 78 }, { min: "25:00", score: 90 },
      { min: "30:00", score: 92 }, { min: "35:00", score: 88 }, { min: "40:00", score: 87 },
    ],
    responseDelays: [
      { question: "Q1", delay: 2.1, label: "Tell me about yourself" },
      { question: "Q2", delay: 3.8, label: "Technical challenge" },
      { question: "Q3", delay: 1.2, label: "System design" },
      { question: "Q4", delay: 4.1, label: "Team conflict" },
      { question: "Q5", delay: 2.9, label: "Career goals" },
      { question: "Q6", delay: 0.8, label: "CSS specificity" },
      { question: "Q7", delay: 3.4, label: "React patterns" },
      { question: "Q8", delay: 2.6, label: "Debugging approach" },
    ],
  },
  "3": {
    id: "3",
    candidate: "Emily Rodriguez",
    position: "UX Designer",
    date: "Feb 9, 2026 at 3:00 PM",
    duration: "45:10",
    interviewer: "John Doe",
    overall: 91,
    speech: 24,
    timing: 22,
    flow: 23,
    linguistic: 22,
    engagement: 95,
    confidence: 88,
    flags: [],
    notes: "Exceptional candidate. Deeply thoughtful answers with natural pauses. Portfolio discussion was highly authentic.",
    timeline: [
      { min: "0:00", score: 88 }, { min: "5:00", score: 90 }, { min: "10:00", score: 92 },
      { min: "15:00", score: 89 }, { min: "20:00", score: 93 }, { min: "25:00", score: 91 },
      { min: "30:00", score: 94 }, { min: "35:00", score: 90 }, { min: "40:00", score: 91 }, { min: "45:00", score: 92 },
    ],
    responseDelays: [
      { question: "Q1", delay: 3.2, label: "Tell me about yourself" },
      { question: "Q2", delay: 4.0, label: "Design process" },
      { question: "Q3", delay: 2.8, label: "User research" },
      { question: "Q4", delay: 3.5, label: "Stakeholder conflict" },
      { question: "Q5", delay: 2.4, label: "Career vision" },
      { question: "Q6", delay: 3.1, label: "Accessibility" },
    ],
  },
  "2": {
    id: "2",
    candidate: "James Wilson",
    position: "Product Manager",
    date: "Feb 10, 2026 at 10:30 AM",
    duration: "38:20",
    interviewer: "John Doe",
    overall: 62,
    speech: 16,
    timing: 14,
    flow: 18,
    linguistic: 14,
    engagement: 60,
    confidence: 55,
    flags: [
      { time: "5:20", pattern: "Reading cadence detected for ~30 seconds", severity: "high" },
      { time: "15:00", pattern: "Instant response to behavioral question (<0.5s)", severity: "medium" },
      { time: "22:40", pattern: "Overly polished language, possible scripted answer", severity: "medium" },
    ],
    notes: "Several authenticity concerns. Answers felt rehearsed at times. Follow-up questions revealed gaps in stated experience.",
    timeline: [
      { min: "0:00", score: 70 }, { min: "5:00", score: 55 }, { min: "10:00", score: 60 },
      { min: "15:00", score: 50 }, { min: "20:00", score: 65 }, { min: "25:00", score: 68 },
      { min: "30:00", score: 62 }, { min: "35:00", score: 60 },
    ],
    responseDelays: [
      { question: "Q1", delay: 0.4, label: "Tell me about yourself" },
      { question: "Q2", delay: 1.1, label: "Product strategy" },
      { question: "Q3", delay: 0.6, label: "Metrics & KPIs" },
      { question: "Q4", delay: 3.2, label: "Team leadership" },
      { question: "Q5", delay: 0.9, label: "Prioritization" },
      { question: "Q6", delay: 2.8, label: "Stakeholder mgmt" },
      { question: "Q7", delay: 1.5, label: "Roadmap planning" },
    ],
  },
  "4": {
    id: "4",
    candidate: "Michael Park",
    position: "Backend Developer",
    date: "Feb 9, 2026 at 11:00 AM",
    duration: "35:45",
    interviewer: "John Doe",
    overall: 34,
    speech: 8,
    timing: 7,
    flow: 10,
    linguistic: 9,
    engagement: 30,
    confidence: 25,
    flags: [
      { time: "2:00", pattern: "Consistent reading cadence throughout", severity: "high" },
      { time: "8:30", pattern: "Multiple instant responses (<0.3s)", severity: "high" },
      { time: "18:00", pattern: "Written-style language, no contractions", severity: "medium" },
      { time: "25:15", pattern: "Unable to elaborate when asked follow-ups", severity: "high" },
    ],
    notes: "Significant concerns about authenticity. Responses appeared heavily scripted or AI-assisted. Could not elaborate on technical answers.",
    timeline: [
      { min: "0:00", score: 45 }, { min: "5:00", score: 38 }, { min: "10:00", score: 30 },
      { min: "15:00", score: 28 }, { min: "20:00", score: 35 }, { min: "25:00", score: 25 },
      { min: "30:00", score: 32 }, { min: "35:00", score: 34 },
    ],
    responseDelays: [
      { question: "Q1", delay: 0.2, label: "Tell me about yourself" },
      { question: "Q2", delay: 0.3, label: "API design" },
      { question: "Q3", delay: 0.5, label: "Database scaling" },
      { question: "Q4", delay: 0.2, label: "System architecture" },
      { question: "Q5", delay: 3.0, label: "Debugging story" },
      { question: "Q6", delay: 0.4, label: "Concurrency" },
    ],
  },
};

// List for selectors
export const candidateList = Object.values(candidateReports).map(c => ({
  id: c.id,
  candidate: c.candidate,
  position: c.position,
  overall: c.overall,
}));
