import { useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, AlertCircle, Lightbulb, TrendingUp,
  Package, Users, Loader2, Tag, Clock, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useReport } from "@/hooks/useReport";
import { useFieldMoments } from "@/hooks/useFieldMoments";

const emotionColors: Record<string, string> = {
  frustration: "text-red-600 bg-red-50 dark:bg-red-950/30",
  excitement: "text-green-600 bg-green-50 dark:bg-green-950/30",
  confusion: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
  satisfaction: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
};

const tagColors: Record<string, string> = {
  pain_point: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  competitor_mention: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  workaround: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  insight: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  environment: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  high_priority: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

export const FieldReport = () => {
  const { id } = useParams();
  const { data, isLoading, error } = useReport(id);
  const { data: moments = [], isLoading: momentsLoading } = useFieldMoments(id);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredMoments = useMemo(() => {
    if (!selectedTag) return moments;
    return moments.filter(m => m.tags?.includes(selectedTag));
  }, [moments, selectedTag]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    moments.forEach(m => m.tags?.forEach((t: string) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [moments]);

  const highPriorityMoments = useMemo(() => {
    return moments
      .filter(m => m.significance_score >= 70)
      .sort((a, b) => b.significance_score - a.significance_score);
  }, [moments]);

  if (isLoading || momentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data || !data.interview) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Field session not found.</p>
        <Link to="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const interview = data.interview;

  // Map Field mode scores (stored as speech/timing/flow/linguistic) to Field labels
  const scores = {
    context: data.report?.speech_score ?? 0,
    engagement: data.report?.timing_score ?? 0,
    insights: data.report?.flow_score ?? 0,
    clarity: data.report?.linguistic_score ?? 0,
  };

  const overall = scores.context + scores.engagement + scores.insights + scores.clarity;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div className="text-center">
              <h1 className="text-lg font-semibold">{interview.candidate_name}</h1>
              <p className="text-sm text-muted-foreground">{interview.position}</p>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
        {/* Overall Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-6 border border-border"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Field Session Quality</h2>
            <Badge variant="outline">{moments.length} Moments Captured</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Context</p>
              <Progress value={(scores.context / 25) * 100} className="h-2 mb-1" />
              <p className="text-2xl font-bold">{scores.context}/25</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Engagement</p>
              <Progress value={(scores.engagement / 25) * 100} className="h-2 mb-1" />
              <p className="text-2xl font-bold">{scores.engagement}/25</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Insights</p>
              <Progress value={(scores.insights / 25) * 100} className="h-2 mb-1" />
              <p className="text-2xl font-bold">{scores.insights}/25</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Clarity</p>
              <Progress value={(scores.clarity / 25) * 100} className="h-2 mb-1" />
              <p className="text-2xl font-bold">{scores.clarity}/25</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overall Quality Score</span>
              <span className="text-2xl font-bold">{overall}/100</span>
            </div>
          </div>
        </motion.div>

        {/* High Priority Insights */}
        {highPriorityMoments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl p-6 border border-border"
          >
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-semibold">High Priority Insights</h2>
            </div>
            <div className="space-y-3">
              {highPriorityMoments.map((moment) => (
                <div
                  key={moment.id}
                  className="p-4 rounded-lg bg-muted/30 border border-border"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {Math.floor(moment.elapsed_seconds / 60)}:{String(moment.elapsed_seconds % 60).padStart(2, "0")}
                    </div>
                    <Badge variant="outline" className="text-amber-600 border-amber-600">
                      {moment.significance_score}/100
                    </Badge>
                  </div>
                  {moment.quote && (
                    <p className="text-sm mb-2 italic">"{moment.quote}"</p>
                  )}
                  {moment.emotional_cue && (
                    <Badge className={emotionColors[moment.emotional_cue] || ""}>
                      {moment.emotional_cue}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl p-6 border border-border"
          >
            <div className="flex items-center gap-2 mb-4">
              <Tag className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Filter by Tag</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedTag === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(null)}
              >
                All ({moments.length})
              </Button>
              {allTags.map(tag => {
                const count = moments.filter(m => m.tags?.includes(tag)).length;
                return (
                  <Button
                    key={tag}
                    variant={selectedTag === tag ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTag(tag)}
                    className={selectedTag === tag ? tagColors[tag] : ""}
                  >
                    {tag.replace(/_/g, " ")} ({count})
                  </Button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Moments Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl p-6 border border-border"
        >
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5" />
            <h2 className="text-xl font-semibold">
              Session Timeline ({filteredMoments.length} moments)
            </h2>
          </div>
          <div className="space-y-4">
            {filteredMoments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No moments captured yet
              </p>
            ) : (
              filteredMoments.map((moment) => (
                <div
                  key={moment.id}
                  className="relative pl-8 pb-4 border-l-2 border-border last:border-l-0 last:pb-0"
                >
                  <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {Math.floor(moment.elapsed_seconds / 60)}:{String(moment.elapsed_seconds % 60).padStart(2, "0")}
                      </span>
                      {moment.significance_score && (
                        <Badge variant="outline">
                          {moment.significance_score}/100
                        </Badge>
                      )}
                    </div>
                    {moment.scene_description && (
                      <p className="text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 inline mr-1" />
                        {moment.scene_description}
                      </p>
                    )}
                    {moment.quote && (
                      <p className="text-sm italic">"{moment.quote}"</p>
                    )}
                    {moment.emotional_cue && (
                      <Badge className={`${emotionColors[moment.emotional_cue] || ""} text-xs`}>
                        {moment.emotional_cue}
                      </Badge>
                    )}
                    {moment.tags && moment.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {moment.tags.map((tag: string) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className={`text-xs ${tagColors[tag] || ""}`}
                          >
                            {tag.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {moment.detected_objects && Array.isArray(moment.detected_objects) && moment.detected_objects.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Package className="h-3 w-3" />
                        {moment.detected_objects.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
