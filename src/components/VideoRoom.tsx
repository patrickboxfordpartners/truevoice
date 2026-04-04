import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { getLiveKitToken, getLiveKitUrl } from "@/lib/livekit";
import { Loader2 } from "lucide-react";

interface VideoRoomProps {
  roomName: string;
  participantName: string;
  participantIdentity: string;
  isHost?: boolean;
  onDisconnected?: () => void;
  children?: React.ReactNode;
}

export function VideoRoom({
  roomName,
  participantName,
  participantIdentity,
  isHost = false,
  onDisconnected,
  children,
}: VideoRoomProps) {
  const [token, setToken] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    console.log("[VideoRoom] Getting token for:", { roomName, participantName, participantIdentity, isHost });

    getLiveKitToken(roomName, participantName, participantIdentity, isHost)
      .then((response) => {
        console.log("[VideoRoom] Got token response:", response);
        if (mounted) {
          setToken(response.token);
        }
      })
      .catch((err) => {
        console.error("[VideoRoom] Token error:", err);
        if (mounted) {
          setError(err.message || "Failed to join video room");
        }
      });

    return () => {
      mounted = false;
    };
  }, [roomName, participantName, participantIdentity, isHost]);

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
  onDisconnected,
  analysisPanel,
}: VideoRoomProps & { analysisPanel?: React.ReactNode }) {
  const [token, setToken] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    console.log("[VideoRoom] Getting token for:", { roomName, participantName, participantIdentity, isHost });

    getLiveKitToken(roomName, participantName, participantIdentity, isHost)
      .then((response) => {
        console.log("[VideoRoom] Got token response:", response);
        if (mounted) {
          setToken(response.token);
        }
      })
      .catch((err) => {
        console.error("[VideoRoom] Token error:", err);
        if (mounted) {
          setError(err.message || "Failed to join video room");
        }
      });

    return () => {
      mounted = false;
    };
  }, [roomName, participantName, participantIdentity, isHost]);

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
