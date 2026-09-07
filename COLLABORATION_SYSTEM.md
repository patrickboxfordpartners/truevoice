# Real-Time Collaboration System for TrueVoice Interviews

This document describes the real-time collaboration dashboard that enables multiple observers to watch and annotate interviews together.

## Architecture

The collaboration system consists of:

1. **Convex Backend** - Real-time data synchronization
2. **React Hooks** - Data fetching and session management
3. **CollaborationPanel Component** - UI for observers

## Files Created

```
src/
├── hooks/
│   └── useCollaboration.ts          # Custom hooks for Convex queries/mutations
├── components/
│   ├── CollaborationPanel.tsx       # Main collaboration UI component
│   └── CollaborationPanel.example.tsx # Integration examples
└── App.tsx                           # ConvexProvider setup (already configured)

convex/
├── schema.ts                         # Tables: live_sessions, shared_notes, interview_scores
├── queries.ts                        # Real-time queries
└── mutations.ts                      # Session and note mutations
```

## Database Schema (Convex)

### live_sessions
Tracks active viewers in real-time.

```typescript
{
  interviewId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  companyId: string;
  status: "active" | "idle" | "disconnected";
  lastHeartbeat: number;  // Unix timestamp
  joinedAt: number;
  leftAt?: number;
}
```

### shared_notes
Collaborative annotations with @mentions.

```typescript
{
  interviewId: string;
  authorId: string;
  authorName: string;
  companyId: string;
  content: string;
  type: "note" | "flag" | "question" | "decision";
  parentNoteId?: Id<"shared_notes">;  // For threading
  mentions: string[];  // Extracted @mentions
  transcriptTimestamp?: string;  // e.g., "12:34"
  videoTimestamp?: number;
  pinned: boolean;
  resolved: boolean;
  createdAt: number;
  updatedAt: number;
}
```

### interview_scores
Real-time authenticity scores.

```typescript
{
  interviewId: string;
  candidateId?: Id<"hiring_pipeline">;
  companyId: string;
  overallScore: number;  // 0-100
  speechScore: number;
  timingScore: number;
  flowScore: number;
  linguisticScore: number;
  engagement: number;
  confidence: number;
  flagCount: number;
  criticalFlags: number;
  lastUpdated: number;
  updateSource: "realtime" | "batch" | "manual";
  createdAt: number;
}
```

## Custom Hooks

### useCollaborationSession
Manages viewer presence and heartbeat.

```typescript
const { sessionId } = useCollaborationSession(interviewId, companyId);
```

**Behavior:**
- Joins session on mount
- Sends heartbeat every 10 seconds
- Leaves session on unmount
- Cleans up interval automatically

### useLiveSessions
Subscribes to active viewers.

```typescript
const liveSessions = useLiveSessions(interviewId);
// Returns array of active sessions (heartbeat <30s old)
```

### useSharedNotes
Subscribes to collaborative notes.

```typescript
const sharedNotes = useSharedNotes(interviewId);
// Returns array of all notes, sorted by creation time
```

### useInterviewScores
Subscribes to real-time score updates.

```typescript
const scores = useInterviewScores(interviewId);
// Returns latest scores or null
```

### useCreateSharedNote
Creates a new shared note.

```typescript
const createNote = useCreateSharedNote(interviewId, companyId);

await createNote(
  "Great answer to that question!",
  "note",
  ["john", "sarah"]  // @mentions
);
```

## CollaborationPanel Component

### Props

```typescript
interface CollaborationPanelProps {
  interviewId: string;
  companyId: string;
}
```

### Features

#### 1. Presence Indicators
- Shows avatars of all active viewers
- Real-time join/leave updates
- Current user highlighted with primary border
- Active status indicator (green dot)
- Hover tooltips with names

#### 2. Live Authenticity Score Gauge
- Animated circular gauge (0-100)
- 4 sub-scores with progress bars:
  - Speech Pattern Analysis
  - Response Timing
  - Conversation Flow
  - Linguistic Complexity
- Engagement and confidence metrics
- Updates in real-time via Convex subscription

#### 3. Shared Notes Panel
- 4 note types: Note, Flag, Question, Decision
- Color-coded by type
- @mention support (auto-extracted)
- Timestamp display (relative)
- Own notes highlighted
- Keyboard shortcut: Cmd/Ctrl+Enter to send

#### 4. Expandable Sections
- Scores section (collapsible)
- Notes section (collapsible)
- Smooth animations

## Integration Example

```tsx
import { CollaborationPanel } from "@/components/CollaborationPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "react-router-dom";

export function InterviewRoom() {
  const { id } = useParams<{ id: string }>();
  const { company } = useAuth();

  return (
    <div className="flex h-screen">
      {/* Main content */}
      <div className="flex-1">
        {/* Interview UI */}
      </div>

      {/* Collaboration sidebar */}
      <div className="w-[360px]">
        <CollaborationPanel
          interviewId={id!}
          companyId={company?.id || ""}
        />
      </div>
    </div>
  );
}
```

## Real-Time Updates

All data updates happen automatically via Convex subscriptions:

1. **Presence**: Updates when viewers join/leave or heartbeat changes
2. **Scores**: Updates when scores are recalculated (every ~20s during interview)
3. **Notes**: Updates instantly when any viewer posts a note

No polling required - Convex pushes updates to all connected clients.

## Session Management

### Join Flow
1. User opens interview room
2. `useCollaborationSession` hook runs
3. Creates `live_sessions` entry with status "active"
4. Starts heartbeat interval (10s)
5. User appears in presence indicators

### Heartbeat Flow
1. Every 10 seconds, `updateHeartbeat` mutation runs
2. Updates `lastHeartbeat` timestamp
3. Sessions with `lastHeartbeat > 30s` old are filtered out

### Leave Flow
1. User closes tab or navigates away
2. `useEffect` cleanup runs
3. Clears heartbeat interval
4. Calls `leaveLiveSession` mutation
5. Marks session as "disconnected"
6. User removed from presence indicators

## Styling

The component uses:
- **Tailwind CSS** for utility classes
- **shadcn/ui** components (Button, Textarea, Badge, ScrollArea, etc.)
- **Framer Motion** for smooth animations
- **TrueVoice design system** (matches existing interview room)

Color scheme:
- Notes: Blue
- Flags: Red
- Questions: Amber
- Decisions: Emerald

## Performance Considerations

1. **Convex subscriptions** are efficient (WebSocket-based)
2. **Heartbeat interval** cleared on unmount (no memory leaks)
3. **useMemo** for filtering and grouping notes
4. **ScrollArea** for long note lists
5. **Stale sessions** auto-filtered (>30s old)

## Mobile Responsiveness

Current implementation is desktop-first (360px width). For mobile:

1. Use a drawer/modal instead of fixed sidebar
2. Implement tab navigation (Viewers | Scores | Notes)
3. Collapse sections by default
4. Add a floating action button to toggle panel

## Security

1. **CompanyId validation**: All queries scoped to company
2. **UserId from auth**: Author IDs come from authenticated profile
3. **Convex auth**: Can add auth middleware to mutations/queries
4. **No XSS**: Text content properly escaped by React

## Testing Checklist

- [ ] Multiple viewers can join the same interview
- [ ] Presence updates when viewers join/leave
- [ ] Scores update in real-time
- [ ] Notes appear for all viewers instantly
- [ ] @mentions are extracted correctly
- [ ] Session cleans up on unmount
- [ ] Heartbeat keeps session alive
- [ ] Own notes are highlighted
- [ ] Timestamps display correctly
- [ ] Collapsible sections work smoothly

## Future Enhancements

1. **Reactions** - Add emoji reactions to notes (👍 👀 ⚠️)
2. **Threading** - Use `parentNoteId` for note replies
3. **Pinning** - Pin important notes to top
4. **Resolution** - Mark questions/flags as resolved
5. **Video sync** - Jump to `videoTimestamp` when clicking note
6. **Notifications** - Alert when @mentioned
7. **Note editing** - Edit own notes after posting
8. **Search** - Search through notes
9. **Export** - Export notes to PDF/Markdown
10. **Audio sync** - Link notes to exact transcript moments

## Deployment

1. Ensure `VITE_CONVEX_URL` is set in `.env.local`
2. Deploy Convex functions: `npx convex deploy`
3. Build frontend: `npm run build`
4. Deploy to Vercel/Netlify/etc.

## Support

For issues or questions about the collaboration system:
1. Check Convex dashboard: https://dashboard.convex.dev
2. Review Convex logs for errors
3. Check browser console for client-side errors
4. Verify WebSocket connection is established
