import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Copy, Check, Plus, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Id } from "../../convex/_generated/dataModel";

interface QuestionGeneratorProps {
  candidateId: Id<"hiring_pipeline">;
  position: string;
  skills?: string[];
  stage: string;
  className?: string;
}

type Category = "behavioral" | "technical" | "culture-fit" | "situational";

interface GeneratedQuestion {
  id: string;
  text: string;
  category: Category;
  rationale: string;
}

const CATEGORY_COLORS: Record<Category, string> = {
  behavioral: "#3b82f6",
  technical: "#a855f7",
  "culture-fit": "#22c55e",
  situational: "#f59e0b",
};

const POSITION_QUESTIONS: Record<string, string[]> = {
  default: [
    "Walk me through a project where you had to learn a new domain quickly. What was your approach?",
    "Describe a time you disagreed with a technical decision. How did you handle it?",
  ],
  engineer: [
    "How do you approach designing systems that need to scale from 100 to 100,000 users?",
    "Tell me about a production incident you resolved. What did you learn from it?",
  ],
  designer: [
    "How do you balance user needs with business constraints in your design process?",
    "Walk me through how you would redesign a feature that has low engagement metrics.",
  ],
  manager: [
    "How do you handle a team member who is consistently underperforming?",
    "Describe your approach to setting team priorities when everything feels urgent.",
  ],
};

const STAGE_QUESTIONS: Record<string, { text: string; category: Category }> = {
  screening: {
    text: "What attracted you to this role and our company specifically?",
    category: "culture-fit",
  },
  technical: {
    text: "Can you walk me through the architecture of the most complex system you have built?",
    category: "technical",
  },
  final: {
    text: "Where do you see yourself contributing to our team's vision over the next 2-3 years?",
    category: "situational",
  },
  offer: {
    text: "What would make this role the best career move you have ever made?",
    category: "behavioral",
  },
};

const BEHAVIORAL_POOL = [
  "Tell me about a time you received critical feedback. How did you respond?",
  "Describe a situation where you had to influence without authority.",
  "Give me an example of when you took initiative on something outside your role.",
  "Tell me about a failure that shaped how you work today.",
  "Describe a time you had to make a decision with incomplete information.",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateQuestions(position: string, skills: string[], stage: string): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const posLower = position.toLowerCase();
  const posKey = posLower.includes("engineer") || posLower.includes("developer")
    ? "engineer"
    : posLower.includes("design")
      ? "designer"
      : posLower.includes("manager") || posLower.includes("lead")
        ? "manager"
        : "default";

  const posQuestions = POSITION_QUESTIONS[posKey] || POSITION_QUESTIONS.default;
  questions.push({
    id: crypto.randomUUID(),
    text: posQuestions[0],
    category: "technical",
    rationale: `Tailored for the ${position} role to assess core competency and depth of experience.`,
  });
  questions.push({
    id: crypto.randomUUID(),
    text: posQuestions[1],
    category: "situational",
    rationale: `Reveals how a ${position} candidate handles real-world challenges specific to their domain.`,
  });

  const stageQ = STAGE_QUESTIONS[stage] || STAGE_QUESTIONS.screening;
  questions.push({
    id: crypto.randomUUID(),
    text: stageQ.text,
    category: stageQ.category,
    rationale: `Appropriate for the ${stage} stage to gauge ${stage === "screening" ? "motivation and fit" : stage === "technical" ? "deep technical ability" : "long-term alignment"}.`,
  });

  if (skills.length > 0) {
    const skill = pickRandom(skills);
    questions.push({
      id: crypto.randomUUID(),
      text: `Tell me about your experience with ${skill}. What is the most challenging problem you have solved using it?`,
      category: "technical",
      rationale: `Probes depth in ${skill}, which is listed on their profile. Helps distinguish surface-level familiarity from real expertise.`,
    });
  } else {
    questions.push({
      id: crypto.randomUUID(),
      text: "What technical skill are you most proud of developing, and how have you applied it?",
      category: "technical",
      rationale: "No specific skills listed — this open-ended question lets the candidate highlight their strongest area.",
    });
  }

  questions.push({
    id: crypto.randomUUID(),
    text: pickRandom(BEHAVIORAL_POOL),
    category: "behavioral",
    rationale: "Behavioral questions reveal patterns of past behavior that predict future performance.",
  });

  return questions;
}

function QuestionCard({
  question,
  index,
}: {
  question: GeneratedQuestion;
  index: number;
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();
  const color = CATEGORY_COLORS[question.category];

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(question.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [question.text]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 300, damping: 25 }}
      className="border border-border rounded-lg p-4 bg-card hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-start gap-3">
        <span
          className="shrink-0 mt-0.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ color, backgroundColor: `${color}15` }}
        >
          {question.category}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed">{question.text}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 ml-0">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          Why this question
        </button>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={() => toast({ title: "Added to question bank" })}
        >
          <Plus className="h-3 w-3" />
          Add to Bank
        </Button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="text-xs text-muted-foreground mt-2 pl-1 border-l-2 border-border ml-1 py-1 px-2">
              {question.rationale}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function QuestionGenerator({
  position,
  skills = [],
  stage,
  className = "",
}: QuestionGeneratorProps) {
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = useCallback(() => {
    setLoading(true);
    setQuestions([]);
    setTimeout(() => {
      setQuestions(generateQuestions(position, skills, stage));
      setLoading(false);
    }, 1000);
  }, [position, skills, stage]);

  return (
    <div className={`glass-card rounded-xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h3 className="font-semibold text-sm">Question Generator</h3>
        </div>
        <Button
          size="sm"
          className="gap-2 bg-[hsl(160,84%,39%)] hover:bg-[hsl(160,84%,34%)] text-white"
          onClick={handleGenerate}
          disabled={loading}
        >
          {questions.length > 0 ? (
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          ) : (
            <Sparkles className={`h-3.5 w-3.5 ${loading ? "animate-pulse" : ""}`} />
          )}
          {loading ? "Generating..." : questions.length > 0 ? "Regenerate" : "Generate Questions"}
        </Button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border border-border rounded-lg p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="h-5 w-16 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && questions.length > 0 && (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <QuestionCard key={q.id} question={q} index={i} />
          ))}
        </div>
      )}

      {!loading && questions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Sparkles className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            Generate tailored interview questions based on this candidate's profile and stage.
          </p>
        </div>
      )}
    </div>
  );
}

export default QuestionGenerator;
