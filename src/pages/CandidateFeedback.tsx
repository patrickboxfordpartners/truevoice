import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { getInterviewByToken } from "@/lib/api/interviews";

interface FeedbackReport {
  overall_score: number;
  speech_score: number;
  timing_score: number;
  flow_score: number;
  linguistic_score: number;
  engagement: number;
  confidence: number;
  summary: string | null;
}

interface InterviewData {
  id: string;
  candidate_name: string;
  position: string;
  company_id: string;
}

const DIMENSIONS = [
  { key: "speech_score" as const, label: "Speaking Naturally", desc: "How natural and authentic your speaking style came across" },
  { key: "timing_score" as const, label: "Response Flow", desc: "Your response timing and thinking patterns during the interview" },
  { key: "flow_score" as const, label: "Conversation Quality", desc: "How well you engaged in back-and-forth dialogue" },
  { key: "linguistic_score" as const, label: "Communication Style", desc: "The authenticity of your language and expression" },
];

function ScoreRing({ score, max = 100, size = 80 }: { score: number; max?: number; size?: number }) {
  const pct = Math.min(100, Math.max(0, (score / max) * 100));
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;
  const color = pct >= 70 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626";

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease-out" }}
      />
    </svg>
  );
}

const CandidateFeedback = () => {
  const { token } = useParams<{ token: string }>();
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [report, setReport] = useState<FeedbackReport | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [notReady, setNotReady] = useState(false);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    setNotReady(false);
    try {
      const interviewData = await getInterviewByToken(token);
      if (!interviewData) { setLoading(false); return; }
      setInterview(interviewData);

      // Fetch company name
      const { data: company } = await supabase
        .from("companies")
        .select("name")
        .eq("id", interviewData.company_id)
        .single();
      setCompanyName(company?.name || "");

      // Fetch report
      const { data: reportData } = await supabase
        .from("interview_reports")
        .select("*")
        .eq("interview_id", interviewData.id)
        .single();

      if (!reportData) {
        setNotReady(true);
      } else {
        setReport(reportData);
      }
    } catch {
      setNotReady(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Interview not found.</p>
      </div>
    );
  }

  if (notReady || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-7 w-7 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Results Being Processed</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your interview results are still being analyzed. This usually takes less than a minute.
          </p>
          <Button onClick={fetchData} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />Check Again
          </Button>
        </div>
      </div>
    );
  }

  const overallPct = Math.round((report.overall_score / 100) * 100);
  const scoreColor = overallPct >= 70 ? "text-green-600" : overallPct >= 50 ? "text-amber-600" : "text-red-600";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="h-12 w-12 rounded-xl bg-green-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Your Interview Results</h1>
          <p className="text-gray-500 text-sm">
            {interview.position}{companyName ? ` · ${companyName}` : ""}
          </p>
        </motion.div>

        {/* Overall score */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-6 text-center"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <ScoreRing score={report.overall_score} max={100} size={120} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold tabular-nums ${scoreColor}`}>
                  {report.overall_score}
                </span>
              </div>
            </div>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Overall Score</h2>
          <p className="text-sm text-gray-500">out of 100 points</p>
          {report.summary && (
            <p className="text-sm text-gray-600 mt-4 leading-relaxed max-w-md mx-auto">{report.summary}</p>
          )}
        </motion.div>

        {/* Dimension scores */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6"
        >
          <h2 className="text-base font-semibold text-gray-900 mb-5">Detailed Breakdown</h2>
          <div className="space-y-5">
            {DIMENSIONS.map((dim) => {
              const raw = report[dim.key];
              const pct = Math.round((raw / 25) * 100);
              const color = pct >= 70 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-600";
              return (
                <div key={dim.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-800">{dim.label}</span>
                    <span className={`text-sm font-bold tabular-nums ${color}`}>{raw}/25</span>
                  </div>
                  <Progress value={pct} className="h-2.5 mb-1" />
                  <p className="text-xs text-gray-400">{dim.desc}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Engagement & Confidence */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          {[
            { label: "Engagement", value: report.engagement },
            { label: "Confidence", value: report.confidence },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="relative">
                  <ScoreRing score={item.value} max={100} size={72} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-base font-bold text-gray-800 tabular-nums">{item.value}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-700">{item.label}</p>
            </div>
          ))}
        </motion.div>

        <p className="text-center text-xs text-gray-400 pb-6">
          Assessment generated by TrueVoice HQ · Results are confidential
        </p>
      </div>
    </div>
  );
};

export default CandidateFeedback;
