/**
 * CollaborationPanel Integration Example
 *
 * This shows how to integrate the real-time collaboration panel
 * into an interview room page.
 */

import { CollaborationPanel } from "@/components/CollaborationPanel";
import { useAuth } from "@/contexts/AuthContext";

export function InterviewRoomWithCollaboration() {
  const { company } = useAuth();
  const interviewId = "your-interview-id"; // from route params or props

  return (
    <div className="flex h-screen">
      {/* Main interview content */}
      <div className="flex-1">
        <h1>Interview Room Content</h1>
        {/* Your existing interview UI */}
      </div>

      {/* Collaboration panel - fixed width sidebar */}
      <div className="w-[360px] h-screen">
        <CollaborationPanel
          interviewId={interviewId}
          companyId={company?.id || ""}
        />
      </div>
    </div>
  );
}

/**
 * Features included:
 *
 * 1. Presence Indicators
 *    - Shows all active viewers with avatars
 *    - Real-time updates when viewers join/leave
 *    - Current user highlighted
 *    - Active status indicator (green dot)
 *
 * 2. Live Authenticity Score Gauge
 *    - Overall score with animated gauge
 *    - Sub-scores (speech, timing, flow, linguistic)
 *    - Engagement and confidence metrics
 *    - Real-time updates via Convex subscription
 *
 * 3. Shared Notes Panel
 *    - Create notes with 4 types: note, flag, question, decision
 *    - @mention support (e.g., @john)
 *    - Real-time updates when others post
 *    - Timestamp display (relative)
 *    - Keyboard shortcut: Cmd/Ctrl+Enter to send
 *
 * 4. Real-time Chat/Reactions
 *    - Notes are color-coded by type
 *    - Own notes highlighted with ring
 *    - Smooth animations on new messages
 *
 * 5. Heartbeat System
 *    - Automatic heartbeat every 10 seconds
 *    - Session management handled by useCollaborationSession hook
 *    - Stale sessions (>30s) filtered out automatically
 *
 * 6. Clean up on unmount
 *    - Session marked as disconnected
 *    - Heartbeat interval cleared
 *    - Cleanup handled in useEffect return
 */

/**
 * Mobile Responsive Notes:
 *
 * The panel is designed for desktop (width: 360px).
 * For mobile, consider:
 * - Hiding panel by default, show via modal/drawer
 * - Using a tab layout (Viewers | Scores | Notes)
 * - Collapsing sections by default
 */

/**
 * Customization Options:
 *
 * 1. Width: Change w-[360px] to your preferred width
 * 2. Position: Use as right sidebar (current) or left sidebar
 * 3. Collapsible: Wrap in a collapsible container
 * 4. Theme: Inherits from TailwindCSS theme system
 * 5. Note types: Add/remove in NOTE_TYPE_CONFIG
 */
