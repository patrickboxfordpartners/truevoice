# EmailThreadView Component

Gmail-style email thread viewer for TrueVoice Joan AI candidate pipeline integration.

## Features

✅ **Real-time Updates** - Subscribes to Convex email_threads with automatic reactivity  
✅ **Thread Grouping** - Groups emails by threadId to show conversations  
✅ **Unread Indicators** - Visual badges for unread emails  
✅ **Action Flags** - Highlights emails that require action (Joan's analysis)  
✅ **Email Type Badges** - Color-coded badges for scheduling, follow-up, reference, offer, etc.  
✅ **Expandable UI** - Click to expand threads and individual emails  
✅ **Mobile Responsive** - Tailwind-based responsive design  
✅ **HTML Email Support** - Renders bodyHtml with safe sanitization  
✅ **Joan Integration** - Shows suggested action items from Joan's analysis  

## Usage

```tsx
import { EmailThreadView } from "@/components/EmailThreadView";

<EmailThreadView candidateId="hiring_pipeline._id" />
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `candidateId` | `string` | Yes | The hiring_pipeline._id to filter emails |
| `className` | `string` | No | Additional Tailwind classes |

## Data Structure

Subscribes to `api.queries.getEmailThreadsByCandidate`:

```typescript
{
  candidateId: string;    // hiring_pipeline._id
  from: string;           // Email sender
  subject: string;        // Email subject
  body: string;           // Plain text body
  bodyHtml?: string;      // HTML body (rendered with prose)
  threadId: string;       // Groups related emails
  emailType?: string;     // scheduling | follow_up | reference | offer | rejection | question | other
  requiresAction: boolean; // Joan flagged for action
  suggestedActionItem?: string; // Joan's suggested task
  read: boolean;          // Unread indicator
  replied: boolean;       // Reply status
  receivedAt: number;     // Unix timestamp
}
```

## UI States

### Loading
Shows centered spinner with "Loading email threads..."

### Empty
Shows empty state with Mail icon when no emails exist.

### Thread List
- Thread headers show: subject, sender, time ago, message count
- Unread threads have primary border-left and bold text
- Action-required threads show red badge
- Email type badges are color-coded

### Expanded Thread
- Shows all emails in chronological order
- Individual emails can be expanded to show full body
- Unread emails show blue dot indicator
- Replied emails show green checkmark
- Action-required emails show red alert icon

## Email Type Colors

| Type | Badge Color |
|------|-------------|
| scheduling | Blue |
| follow_up | Purple |
| reference | Green |
| offer | Emerald |
| rejection | Red |
| question | Amber |
| other | Gray |

## Integration with Joan

Joan AI analyzes incoming emails and:
1. Routes them to the correct candidate via `candidateId`
2. Classifies the `emailType` (scheduling, follow-up, etc.)
3. Flags `requiresAction` for emails needing attention
4. Suggests `suggestedActionItem` text for task creation

## Mobile Responsive

- Uses `ScrollArea` with max height for contained scrolling
- Truncates long text with `line-clamp` utilities
- Badge sizes scale down on mobile
- Touch-friendly click targets

## Styling

Built with:
- Tailwind CSS utilities
- shadcn/ui components (Badge, Card, ScrollArea, Separator)
- Framer Motion animations
- lucide-react icons

## Performance

- Real-time Convex subscriptions (auto-resubscribes on reconnect)
- Memoized thread grouping and sorting
- Optimistic UI updates via Convex mutations (future)

## Future Enhancements

- [ ] Mark as read/unread actions
- [ ] Reply inline
- [ ] Create action item from email
- [ ] Email search/filter
- [ ] Bulk operations (archive, mark read)
- [ ] Email composition
