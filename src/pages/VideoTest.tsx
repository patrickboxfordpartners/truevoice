import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { VideoRoom } from "@/components/VideoRoom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Test page to verify LiveKit integration
 * Navigate to /video-test to use this
 */
export default function VideoTest() {
  const { user, loading } = useAuth();
  const [joined, setJoined] = useState(false);
  const [roomName, setRoomName] = useState("test-room-" + Date.now());
  const [userName, setUserName] = useState("Test User");
  const canJoin = Boolean(user) && roomName.startsWith("test-room-");

  useEffect(() => {
    console.log("[VideoTest] Environment check:", {
      VITE_CONVEX_URL: import.meta.env.VITE_CONVEX_URL ? "present" : "missing",
      VITE_LIVEKIT_URL: import.meta.env.VITE_LIVEKIT_URL ? "present" : "missing",
    });
  }, []);

  if (joined) {
    return (
      <div className="h-screen flex flex-col">
        <div className="h-14 border-b border-border bg-card px-4 flex items-center justify-between">
          <span className="font-semibold">LiveKit Test Room: {roomName}</span>
          <Button variant="outline" size="sm" onClick={() => setJoined(false)}>
            Leave
          </Button>
        </div>
        <div className="flex-1">
          <VideoRoom
            roomName={roomName}
            participantName={userName}
            participantIdentity={`user-${Date.now()}`}
            isHost={true}
            onDisconnected={() => setJoined(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">LiveKit Video Test</h1>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Room Name</label>
            <Input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="test-room-123"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Your Name</label>
            <Input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <Button className="w-full" disabled={!canJoin || loading} onClick={() => setJoined(true)}>
            Join Room
          </Button>
          {!loading && !user && (
            <p className="text-sm text-muted-foreground">
              <Link to="/login" className="underline">Sign in</Link> to request a test room token.
            </p>
          )}
        </div>
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs font-mono">
            Convex URL: {import.meta.env.VITE_CONVEX_URL ? "✓" : "✗"}<br/>
            LiveKit URL: {import.meta.env.VITE_LIVEKIT_URL ? "✓" : "✗"}
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Open this page in multiple tabs/browsers with the same room name to test video.
        </p>
      </Card>
    </div>
  );
}
