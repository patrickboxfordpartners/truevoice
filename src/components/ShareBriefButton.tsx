import { useState } from "react";
import { Share2, Check, Loader2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Id } from "../../convex/_generated/dataModel";

interface ShareBriefButtonProps {
  briefId: Id<"intelligence_briefs">;
  candidateId: Id<"hiring_pipeline">;
}

export function ShareBriefButton({ briefId, candidateId }: ShareBriefButtonProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const createSharedBrief = useMutation(api.mutations.createSharedBrief);
  const { toast } = useToast();

  const handleShare = async () => {
    setLoading(true);
    try {
      const token = await createSharedBrief({ briefId, candidateId });
      const url = `${window.location.origin}/brief/${token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Brief link copied",
        description: "Anyone with this link can view the intelligence brief.",
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast({ title: "Failed to generate link", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      disabled={loading}
      className="gap-1.5"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : copied ? (
        <Check className="h-3.5 w-3.5 text-success" />
      ) : (
        <Share2 className="h-3.5 w-3.5" />
      )}
      {copied ? "Copied!" : "Share Brief"}
    </Button>
  );
}
