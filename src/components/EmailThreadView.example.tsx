/**
 * Example usage of EmailThreadView component
 *
 * This component integrates with the candidate pipeline cards
 * and provides real-time email thread viewing for Joan AI.
 */

import { EmailThreadView } from "./EmailThreadView";

// Example: In a candidate card or detail view
export function CandidateEmailPanel({ candidateId }: { candidateId: string }) {
  return (
    <div className="glass-card rounded-xl p-6">
      <EmailThreadView candidateId={candidateId} />
    </div>
  );
}

// Example: In a modal or sidebar
export function EmailThreadModal({
  candidateId,
  open,
  onClose
}: {
  candidateId: string;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Email Threads</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-hidden p-6">
          <EmailThreadView candidateId={candidateId} />
        </div>
      </div>
    </div>
  );
}

// Example: Integrated with pipeline stage cards
export function PipelineStageCard({
  stage,
  candidates
}: {
  stage: string;
  candidates: Array<{ id: string; name: string; email: string }>;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{stage}</h3>
      {candidates.map((candidate) => (
        <div key={candidate.id} className="glass-card rounded-lg p-4">
          <div className="mb-3">
            <h4 className="font-medium">{candidate.name}</h4>
            <p className="text-sm text-muted-foreground">{candidate.email}</p>
          </div>
          <EmailThreadView candidateId={candidate.id} className="max-h-[400px]" />
        </div>
      ))}
    </div>
  );
}
