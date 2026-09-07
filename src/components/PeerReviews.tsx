import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, ThumbsUp, ThumbsDown, AlertCircle, CheckCircle2, X } from "lucide-react";

interface PeerReviewsProps {
  candidateId: Id<"hiring_pipeline">;
  candidateName: string;
}

export const PeerReviews = ({ candidateId, candidateName }: PeerReviewsProps) => {
  const reviews = useQuery(api.peerReviews.getPeerReviewsByCandidate, { candidateId });

  if (!reviews) {
    return <div>Loading peer reviews...</div>;
  }

  const pendingReviews = reviews.filter((r) => r.status === "pending");
  const completedReviews = reviews.filter((r) => r.status === "completed");
  const declinedReviews = reviews.filter((r) => r.status === "declined");

  return (
    <div className="space-y-6">
      {/* Header with Request Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Peer Reviews</h3>
          <p className="text-sm text-muted-foreground">
            Get second opinions from other hiring managers
          </p>
        </div>
        <RequestReviewDialog candidateId={candidateId} candidateName={candidateName} />
      </div>

      {/* Completed Reviews */}
      {completedReviews.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Completed ({completedReviews.length})
          </h4>
          {completedReviews.map((review) => (
            <CompletedReviewCard key={review._id} review={review} />
          ))}
        </div>
      )}

      {/* Pending Reviews */}
      {pendingReviews.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Pending ({pendingReviews.length})
          </h4>
          {pendingReviews.map((review) => (
            <PendingReviewCard key={review._id} review={review} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {reviews.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No peer reviews yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Request reviews from other managers for a second opinion
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

function RequestReviewDialog({
  candidateId,
  candidateName,
}: {
  candidateId: Id<"hiring_pipeline">;
  candidateName: string;
}) {
  const [open, setOpen] = useState(false);
  const [reviewerName, setReviewerName] = useState("");
  const requestReview = useMutation(api.peerReviews.requestPeerReview);

  const handleRequest = async () => {
    if (!reviewerName.trim()) return;

    // For demo: use name as ID (in production, you'd select from a user list)
    await requestReview({
      candidateId,
      reviewerId: reviewerName.toLowerCase().replace(/\s+/g, "-"),
      reviewerName: reviewerName.trim(),
      requestedBy: "demo-manager",
      requestedByName: "Demo Manager",
    });

    setReviewerName("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Request Review
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Peer Review</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label>Candidate</Label>
            <p className="text-sm font-medium mt-1">{candidateName}</p>
          </div>
          <div>
            <Label htmlFor="reviewer">Reviewer Name</Label>
            <input
              id="reviewer"
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="Enter manager name"
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
            <p className="text-xs text-muted-foreground mt-1">
              In production, you'd select from a list of managers
            </p>
          </div>
          <Button onClick={handleRequest} disabled={!reviewerName.trim()} className="w-full">
            Send Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PendingReviewCard({ review }: { review: any }) {
  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                Pending
              </Badge>
              <span className="text-sm font-medium">{review.reviewerName}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Requested by {review.requestedByName} •{" "}
              {new Date(review.requestedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CompletedReviewCard({ review }: { review: any }) {
  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case "strong_hire":
        return "bg-green-100 text-green-800 border-green-200";
      case "hire":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "no_hire":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "strong_no_hire":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRecommendationLabel = (rec: string) => {
    switch (rec) {
      case "strong_hire":
        return "Strong Hire";
      case "hire":
        return "Hire";
      case "no_hire":
        return "No Hire";
      case "strong_no_hire":
        return "Strong No Hire";
      default:
        return rec;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold">{review.reviewerName}</span>
              {review.agreeWithOriginal ? (
                <ThumbsUp className="h-4 w-4 text-green-600" title="Agrees with assessment" />
              ) : (
                <ThumbsDown className="h-4 w-4 text-orange-600" title="Disagrees with assessment" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getRecommendationColor(review.recommendation)}>
                {getRecommendationLabel(review.recommendation)}
              </Badge>
              <span className="text-xs text-muted-foreground">{review.confidence}% confidence</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Strengths */}
        {review.strengths && review.strengths.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Strengths</span>
            </div>
            <ul className="space-y-1">
              {review.strengths.map((strength: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground pl-6">
                  • {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Concerns */}
        {review.concerns && review.concerns.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Concerns</span>
            </div>
            <ul className="space-y-1">
              {review.concerns.map((concern: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground pl-6">
                  • {concern}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Additional Insights */}
        {review.additionalInsights && (
          <div className="mt-3 p-3 bg-muted rounded-md">
            <p className="text-sm">{review.additionalInsights}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
          Reviewed on {new Date(review.completedAt).toLocaleDateString()} •
          Requested by {review.requestedByName}
        </div>
      </CardContent>
    </Card>
  );
}
