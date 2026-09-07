import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { Id } from "../../convex/_generated/dataModel";

export function useLiveSessions(interviewId: string | undefined) {
  return useQuery(
    api.queries.getLiveSessionsByInterview,
    interviewId ? { interviewId } : "skip"
  );
}

export function useSharedNotes(interviewId: string | undefined) {
  return useQuery(
    api.queries.getSharedNotesByInterview,
    interviewId ? { interviewId } : "skip"
  );
}

export function useInterviewScores(interviewId: string | undefined) {
  return useQuery(
    api.queries.getInterviewScores,
    interviewId ? { interviewId } : "skip"
  );
}

export function useCollaborationSession(interviewId: string | undefined, companyId: string | undefined) {
  const { profile } = useAuth();
  const joinSession = useMutation(api.mutations.joinLiveSession);
  const leaveSession = useMutation(api.mutations.leaveLiveSession);
  const updateHeartbeat = useMutation(api.mutations.updateHeartbeat);

  const sessionIdRef = useRef<Id<"live_sessions"> | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!interviewId || !companyId || !profile) return;

    // Join session on mount
    const join = async () => {
      try {
        const sessionId = await joinSession({
          interviewId,
          userId: profile.id,
          userName: profile.full_name || profile.email,
          userAvatar: profile.avatar_url,
          companyId,
        });
        sessionIdRef.current = sessionId;

        // Start heartbeat every 10 seconds
        heartbeatIntervalRef.current = setInterval(() => {
          if (sessionIdRef.current) {
            updateHeartbeat({ sessionId: sessionIdRef.current });
          }
        }, 10000);
      } catch (error) {
        console.error("Failed to join collaboration session:", error);
      }
    };

    join();

    // Cleanup on unmount
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (sessionIdRef.current) {
        leaveSession({ sessionId: sessionIdRef.current });
      }
    };
  }, [interviewId, companyId, profile, joinSession, leaveSession, updateHeartbeat]);

  return { sessionId: sessionIdRef.current };
}

export function useCreateSharedNote(interviewId: string | undefined, companyId: string | undefined) {
  const { profile } = useAuth();
  const createNote = useMutation(api.mutations.createSharedNote);

  return async (content: string, type: "note" | "flag" | "question" | "decision", mentions: string[] = []) => {
    if (!interviewId || !companyId || !profile) return;

    return await createNote({
      interviewId,
      authorId: profile.id,
      authorName: profile.full_name || profile.email,
      companyId,
      content,
      type,
      mentions,
    });
  };
}
