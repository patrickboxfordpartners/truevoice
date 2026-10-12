import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getLiveKitUrl } from "@/lib/livekit";
import { Loader2 } from "lucide-react";

interface VideoRoomProps {
  roomName: string;
  participantName: string;
  participantIdentity: string;
  isHost?: boolean;
  interviewId?: string;
  candidateToken?: string;
  onDisconnected?: () => void;
  children?: React.ReactNode;
}

function useRoomToken({
  roomName,
  participantName,
  participantIdentity,
  isHost,
  interviewId,
  candidateToken,
}: {
  roomName: string;
  participantName: string;
  participantIdentity: string;
  isHost: boolean;
  interviewId?: string;
  candidateToken?: string;
}) {
  const generateToken = useAction(api.actions.livekitToken.generate);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    generateToken({
      roomName,
      participantName,
      participantIdentity,
      isHost,
      ...(interviewId ? { interviewId } : {}),
      ...(candidateToken ? { candidateToken } : {}),
    })
      .then((response) => {
        if (mounted) setToken(response.token);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to join video room";
        console.error("[VideoRoom] Token error:", message);
        if (mounted) setError(message);
      });
    return () => {
      mounted = false;
    };
  }, [generateToken, roomName, participantName, participantIdentity, isHost, interviewId, candidateToken]);

  return { token, error };
}

export function VideoRoom({
  roomName,
  participantName,
  participantIdentity,
  isHost = false,
  interviewId,
  candidateToken,
  onDisconnected,
  children,
}: VideoRoomProps) {
  const { token, error } = useRoomToken({
    roomName,
    participantName,
    participantIdentity,
    isHost,
    interviewId,
    candidateToken,
  });

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to connect</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={getLiveKitUrl()}
      connect={true}
      onDisconnected={onDisconnected}
      className="h-full"
    >
      {children || <VideoConference />}
    </LiveKitRoom>
  );
}

/**
 * Custom video layout with AI analysis overlay
 */
export function VideoRoomWithAnalysis({
  roomName,
  participantName,
  participantIdentity,
  isHost = false,
  interviewId,
  candidateToken,
  onDisconnected,
  analysisPanel,
}: VideoRoomProps & { analysisPanel?: React.ReactNode }) {
  const { token, error } = useRoomToken({
    roomName,
    participantName,
    participantIdentity,
    isHost,
    interviewId,
    candidateToken,
  });

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to connect</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={getLiveKitUrl()}
      connect={true}
      onDisconnected={onDisconnected}
      className="h-full"
    >
      <div className="flex h-full">
        <div className="flex-1 relative">
          <CustomVideoLayout />
          <RoomAudioRenderer />
        </div>
        {analysisPanel && (
          <div className="w-80 border-l border-border bg-card overflow-y-auto">
            {analysisPanel}
          </div>
        )}
      </div>
    </LiveKitRoom>
  );
}

/**
 * Custom video grid layout
 */
function CustomVideoLayout() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <GridLayout tracks={tracks} className="h-full">
      <ParticipantTile />
    </GridLayout>
  );
}
