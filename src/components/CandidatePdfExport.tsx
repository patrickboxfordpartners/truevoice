import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CandidatePdfExportProps {
  candidate: {
    candidateName: string;
    candidateEmail: string;
    position: string;
    stage: string;
    overallScore?: number;
    flagCount: number;
    skills?: string[];
    experience?: string;
  };
  className?: string;
}

const STAGE_COLORS: Record<string, string> = {
  screening: "#3b82f6",
  technical: "#a855f7",
  final: "#f59e0b",
  offer: "#22c55e",
  hired: "#0fba81",
  rejected: "#ef4444",
};

function scoreColor(score: number): string {
  if (score >= 80) return "#16a34a";
  if (score >= 60) return "#3b82f6";
  if (score >= 40) return "#d97706";
  return "#dc2626";
}

function buildDossierHtml(candidate: CandidatePdfExportProps["candidate"]): string {
  const stageColor = STAGE_COLORS[candidate.stage] || "#6b7280";
  const stageLabel = candidate.stage.charAt(0).toUpperCase() + candidate.stage.slice(1);
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const scoreHtml =
    candidate.overallScore != null
      ? `<div style="display:flex;align-items:center;gap:24px;margin-bottom:24px;">
          <div style="width:80px;height:80px;border-radius:50%;border:4px solid ${scoreColor(candidate.overallScore)};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <span style="font-size:28px;font-weight:700;color:${scoreColor(candidate.overallScore)};">${candidate.overallScore}</span>
          </div>
          <div>
            <p style="margin:0;font-size:13px;color:#6b7280;">Overall Authenticity Score</p>
            <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#111;">
              ${candidate.overallScore >= 80 ? "Excellent" : candidate.overallScore >= 60 ? "Good" : candidate.overallScore >= 40 ? "Fair" : "Needs Review"}
            </p>
          </div>
        </div>`
      : "";

  const skillsHtml =
    candidate.skills && candidate.skills.length > 0
      ? `<h2 style="font-size:16px;margin:24px 0 8px;color:#111;border-bottom:1px solid #e5e7eb;padding-bottom:4px;">Skills</h2>
         <div style="display:flex;flex-wrap:wrap;gap:6px;">
           ${candidate.skills.map((s) => `<span style="display:inline-block;padding:4px 12px;background:#f0fdf4;color:#166534;border-radius:12px;font-size:12px;font-weight:500;border:1px solid #bbf7d0;">${s}</span>`).join("")}
         </div>`
      : "";

  const experienceHtml = candidate.experience
    ? `<h2 style="font-size:16px;margin:24px 0 8px;color:#111;border-bottom:1px solid #e5e7eb;padding-bottom:4px;">Experience</h2>
       <p style="font-size:14px;color:#374151;line-height:1.6;">${candidate.experience}</p>`
    : "";

  const flagsHtml =
    candidate.flagCount > 0
      ? `<div style="margin-top:24px;padding:12px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;">
          <p style="margin:0;font-size:13px;font-weight:600;color:#dc2626;">${candidate.flagCount} Flag${candidate.flagCount !== 1 ? "s" : ""} Detected</p>
          <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">Review recommended before advancing.</p>
        </div>`
      : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Candidate Dossier - ${candidate.candidateName}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      max-width: 700px;
      margin: 40px auto;
      padding: 0 24px;
      color: #111;
      line-height: 1.6;
    }
    .header { margin-bottom: 28px; }
    .logo { font-size: 14px; font-weight: 700; color: #0fba81; letter-spacing: 0.5px; margin-bottom: 20px; }
    h1 { font-size: 24px; margin: 0 0 4px; }
    .email { font-size: 13px; color: #6b7280; margin: 0 0 12px; }
    .meta-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .stage-badge { display: inline-block; padding: 4px 14px; border-radius: 6px; font-weight: 700; font-size: 13px; color: white; }
    .position-badge { display: inline-block; padding: 4px 14px; border-radius: 6px; font-weight: 500; font-size: 13px; color: #374151; background: #f3f4f6; border: 1px solid #e5e7eb; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">TRUEVOICE HQ</div>
    <h1>${candidate.candidateName}</h1>
    <p class="email">${candidate.candidateEmail}</p>
    <div class="meta-row">
      <span class="stage-badge" style="background:${stageColor};">${stageLabel}</span>
      <span class="position-badge">${candidate.position}</span>
    </div>
  </div>

  ${scoreHtml}
  ${skillsHtml}
  ${experienceHtml}
  ${flagsHtml}

  <div class="footer">
    Generated by TrueVoice HQ &middot; ${dateStr}
  </div>
</body>
</html>`;
}

export function CandidatePdfExport({ candidate, className = "" }: CandidatePdfExportProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = () => {
    setLoading(true);
    try {
      const html = buildDossierHtml(candidate);
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        setLoading(false);
        return;
      }
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        setLoading(false);
      };
      setTimeout(() => setLoading(false), 3000);
    } catch {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
      className={`gap-1.5 ${className}`}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <FileDown className="h-3.5 w-3.5" />
      )}
      Export PDF
    </Button>
  );
}

export default CandidatePdfExport;
