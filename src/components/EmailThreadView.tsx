import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { format, formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  MailOpen,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface EmailThreadViewProps {
  candidateId: string;
  className?: string;
}

interface EmailThread {
  _id: string;
  _creationTime: number;
  candidateId?: string;
  companyId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  threadId: string;
  messageId: string;
  inReplyTo?: string;
  routedBy: string;
  routingConfidence: number;
  routingReason: string;
  emailType?: "scheduling" | "follow_up" | "reference" | "offer" | "rejection" | "question" | "other";
  requiresAction: boolean;
  suggestedActionItem?: string;
  read: boolean;
  replied: boolean;
  repliedAt?: number;
  receivedAt: number;
  createdAt: number;
}

const EMAIL_TYPE_COLORS = {
  scheduling: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  follow_up: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  reference: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  offer: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  rejection: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  question: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

const EMAIL_TYPE_LABELS = {
  scheduling: "Scheduling",
  follow_up: "Follow-up",
  reference: "Reference",
  offer: "Offer",
  rejection: "Rejection",
  question: "Question",
  other: "Other",
};

export const EmailThreadView = ({ candidateId, className }: EmailThreadViewProps) => {
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

  // Real-time subscription to email threads
  const emails = useQuery(api.queries.getEmailThreadsByCandidate, {
    candidateId,
  }) as EmailThread[] | undefined;

  // Group emails by threadId
  const emailThreads = useMemo(() => {
    if (!emails) return new Map<string, EmailThread[]>();

    const threads = new Map<string, EmailThread[]>();
    emails.forEach((email) => {
      if (!threads.has(email.threadId)) {
        threads.set(email.threadId, []);
      }
      threads.get(email.threadId)!.push(email);
    });

    // Sort emails within each thread by received time
    threads.forEach((thread) => {
      thread.sort((a, b) => a.receivedAt - b.receivedAt);
    });

    return threads;
  }, [emails]);

  // Sort threads by most recent email
  const sortedThreads = useMemo(() => {
    return Array.from(emailThreads.entries())
      .map(([threadId, threadEmails]) => ({
        threadId,
        emails: threadEmails,
        latestEmail: threadEmails[threadEmails.length - 1],
        hasUnread: threadEmails.some((e) => !e.read),
        hasAction: threadEmails.some((e) => e.requiresAction),
      }))
      .sort((a, b) => b.latestEmail.receivedAt - a.latestEmail.receivedAt);
  }, [emailThreads]);

  const toggleThread = (threadId: string) => {
    const newExpanded = new Set(expandedThreads);
    if (newExpanded.has(threadId)) {
      newExpanded.delete(threadId);
    } else {
      newExpanded.add(threadId);
    }
    setExpandedThreads(newExpanded);
  };

  const toggleEmail = (emailId: string) => {
    setExpandedEmailId(expandedEmailId === emailId ? null : emailId);
  };

  if (!emails) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="text-center">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">Loading email threads...</p>
        </div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="text-center">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No emails yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Joan will route candidate emails here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">
          Email Threads ({sortedThreads.length})
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {emails.filter((e) => !e.read).length} unread
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {emails.filter((e) => e.requiresAction).length} need action
          </span>
        </div>
      </div>

      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-2">
          {sortedThreads.map(({ threadId, emails: threadEmails, latestEmail, hasUnread, hasAction }) => {
            const isThreadExpanded = expandedThreads.has(threadId);
            const emailCount = threadEmails.length;

            return (
              <Card key={threadId} className={cn(
                "overflow-hidden transition-colors",
                hasUnread && "border-l-4 border-l-primary"
              )}>
                {/* Thread Header */}
                <button
                  onClick={() => toggleThread(threadId)}
                  className="w-full px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="shrink-0 mt-1">
                    {isThreadExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  <div className="shrink-0 mt-0.5">
                    {hasUnread ? (
                      <Mail className="h-5 w-5 text-primary" />
                    ) : (
                      <MailOpen className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={cn(
                        "text-sm truncate",
                        hasUnread ? "font-semibold" : "font-medium text-muted-foreground"
                      )}>
                        {latestEmail.subject}
                      </h4>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(latestEmail.receivedAt, { addSuffix: true })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {latestEmail.from}
                      </span>
                      {emailCount > 1 && (
                        <>
                          <Separator orientation="vertical" className="h-3" />
                          <span className="text-xs text-muted-foreground">
                            {emailCount} messages
                          </span>
                        </>
                      )}
                      {latestEmail.emailType && (
                        <>
                          <Separator orientation="vertical" className="h-3" />
                          <Badge
                            variant="secondary"
                            className={cn("text-xs h-5", EMAIL_TYPE_COLORS[latestEmail.emailType])}
                          >
                            {EMAIL_TYPE_LABELS[latestEmail.emailType]}
                          </Badge>
                        </>
                      )}
                      {hasAction && (
                        <>
                          <Separator orientation="vertical" className="h-3" />
                          <Badge variant="destructive" className="text-xs h-5">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Action needed
                          </Badge>
                        </>
                      )}
                    </div>

                    {!isThreadExpanded && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {latestEmail.body}
                      </p>
                    )}
                  </div>
                </button>

                {/* Thread Emails */}
                <AnimatePresence>
                  {isThreadExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <Separator />
                      <div className="space-y-0">
                        {threadEmails.map((email, index) => {
                          const isExpanded = expandedEmailId === email._id;
                          const isLatest = index === threadEmails.length - 1;

                          return (
                            <div key={email._id} className="border-b border-border last:border-0">
                              <button
                                onClick={() => toggleEmail(email._id)}
                                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left"
                              >
                                <div className="shrink-0 mt-0.5">
                                  {email.requiresAction ? (
                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                  ) : email.replied ? (
                                    <CheckCircle2 className="h-4 w-4 text-success" />
                                  ) : (
                                    <div className={cn(
                                      "h-2 w-2 rounded-full mt-1",
                                      !email.read ? "bg-primary" : "bg-muted"
                                    )} />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className={cn(
                                      "text-sm",
                                      !email.read || isLatest ? "font-medium" : "text-muted-foreground"
                                    )}>
                                      {email.from.split("<")[0].trim() || email.from}
                                    </span>
                                    <span className="text-xs text-muted-foreground shrink-0">
                                      {format(email.receivedAt, "MMM d, h:mm a")}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {email.emailType && (
                                      <Badge
                                        variant="secondary"
                                        className={cn("text-[10px] h-4 px-1.5", EMAIL_TYPE_COLORS[email.emailType])}
                                      >
                                        {EMAIL_TYPE_LABELS[email.emailType]}
                                      </Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      to {email.to}
                                    </span>
                                  </div>

                                  {!isExpanded && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                      {email.body}
                                    </p>
                                  )}
                                </div>
                              </button>

                              {/* Email Body */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="px-4 pb-4 pl-11"
                                  >
                                    <div className="rounded-lg bg-muted/30 p-3">
                                      <div className="text-sm whitespace-pre-wrap break-words">
                                        {email.bodyHtml ? (
                                          <div
                                            dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
                                            className="prose prose-sm dark:prose-invert max-w-none"
                                          />
                                        ) : (
                                          email.body
                                        )}
                                      </div>

                                      {email.suggestedActionItem && (
                                        <div className="mt-3 pt-3 border-t border-border">
                                          <p className="text-xs font-medium text-muted-foreground mb-1">
                                            Joan suggests:
                                          </p>
                                          <p className="text-xs text-foreground">
                                            {email.suggestedActionItem}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
