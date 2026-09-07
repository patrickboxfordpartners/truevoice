# Joan AI Assistant Components

Professional AI hiring coordinator components for TrueVoice HQ. Joan monitors interviews, extracts action items, routes emails, and manages your hiring pipeline.

## Components

### 1. JoanAvatar

Circular avatar with "J" initial or AI icon, featuring subtle pulse animations and active status indicator.

**Props:**
- `size?: "sm" | "md" | "lg"` - Avatar size (default: "md")
- `showPulse?: boolean` - Enable pulse animation (default: true)
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
import { JoanAvatar } from "@/components/joan";

// In sidebar
<JoanAvatar size="sm" />

// In header
<JoanAvatar size="lg" />

// Inactive state
<JoanAvatar showPulse={false} />
```

**Features:**
- Gradient background (accent to accent/80)
- Animated pulse ring when active
- Green status indicator dot
- Hover scale effect
- Bot icon (can be swapped for "J" initial)

---

### 2. JoanActivityFeed

Real-time activity feed showing Joan's recent actions with Convex subscription.

**Props:**
- `companyId: string` - Company ID to fetch activities for (required)
- `limit?: number` - Number of activities to show (default: 20)

**Usage:**
```tsx
import { JoanActivityFeed } from "@/components/joan";

<JoanActivityFeed 
  companyId={companyId} 
  limit={20} 
/>
```

**Features:**
- Real-time updates via Convex `useQuery`
- Subscribes to `api.queries.getJoanActivity`
- Icon-coded action types
- Color-coded by action category
- Success/error state handling
- Human-readable timestamps (e.g., "2 minutes ago")
- Scrollable list with max height
- Loading and empty states

**Action Types & Icons:**
| Action | Icon | Color |
|--------|------|-------|
| `extracted_action_items` | CheckCircle2 | Success |
| `routed_email` | Mail | Accent |
| `moved_pipeline_stage` | ArrowRight | Primary |
| `sent_reminder` | Bell | Warning |
| `enriched_candidate` | UserPlus | Accent |
| `flagged_risk` | AlertTriangle | Destructive |
| `created_note` | StickyNote | Muted |

---

### 3. JoanSettings

Configuration panel for Joan's automation behavior.

**Props:**
- `companyId: string` - Company ID for settings (required)

**Usage:**
```tsx
import { JoanSettings } from "@/components/joan";

<JoanSettings companyId={companyId} />
```

**Settings:**

**Automation:**
- Auto-route emails - Automatically match incoming emails to candidates
- Extract action items - Auto-extract tasks from interview transcripts
- Auto-move pipeline stages - Move candidates based on completed actions

**Reminders:**
- Reminder timing - When Joan sends reminders (immediate / 1 hour / 3 hours / 1 day before due)

**Notifications:**
- Notification level - How often Joan notifies you (all / important only / none)

**Features:**
- Local state management (ready for Convex mutation)
- Change tracking with "Save Changes" button
- Reset to defaults option
- Disabled state handling
- Info footer explaining Joan's role

**To persist settings:**
```typescript
// Add this mutation to convex/mutations.ts
export const updateJoanSettings = mutation({
  args: { 
    companyId: v.string(), 
    settings: v.any() // Define proper validator
  },
  handler: async (ctx, args) => {
    // Save to new joan_settings table
  }
});
```

---

## Integration Examples

### Dashboard Sidebar
```tsx
<div className="flex items-center gap-3 p-4">
  <JoanAvatar size="sm" />
  <div>
    <p className="text-sm font-medium">Joan</p>
    <p className="text-xs text-muted-foreground">AI Assistant</p>
  </div>
</div>
```

### Activity Panel
```tsx
<Card>
  <CardHeader>
    <CardTitle>Recent Activity</CardTitle>
  </CardHeader>
  <CardContent>
    <JoanActivityFeed companyId={companyId} limit={10} />
  </CardContent>
</Card>
```

### Settings Page
```tsx
<Tabs defaultValue="general">
  <TabsList>
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="joan">Joan Assistant</TabsTrigger>
  </TabsList>
  <TabsContent value="joan">
    <JoanSettings companyId={companyId} />
  </TabsContent>
</Tabs>
```

---

## Design System

**Colors:**
- Primary action: `accent` (green #10B981)
- Success states: `success` (green)
- Warning states: `warning` (amber)
- Error states: `destructive` (red)
- Avatar gradient: `from-accent to-accent/80`

**Icons:**
Uses Lucide React icons throughout. All icons are 16-20px for consistency.

**Typography:**
- Headers: `text-sm font-semibold`
- Body: `text-sm text-foreground`
- Metadata: `text-xs text-muted-foreground`

**Spacing:**
Follows Tailwind spacing scale (4px increments).

---

## Data Flow

### Activity Feed
```
Convex joan_activity table
    ↓
api.queries.getJoanActivity (real-time subscription)
    ↓
JoanActivityFeed component
    ↓
User sees live updates
```

### Settings
```
User changes setting
    ↓
Local state update
    ↓
User clicks "Save Changes"
    ↓
api.mutations.updateJoanSettings (to be implemented)
    ↓
Persisted to Convex
```

---

## Schema Reference

**joan_activity table:**
```typescript
{
  companyId: string;
  interviewId?: string;
  candidateId?: string;
  action: "extracted_action_items" | "routed_email" | ...;
  description: string; // Human-readable
  details?: any; // Flexible JSON
  success: boolean;
  errorMessage?: string;
  timestamp: number;
}
```

**Indexes:**
- `by_company` - For company-wide feeds
- `by_interview` - For interview-specific feeds
- `by_action` - For filtering by action type
- `by_timestamp` - For chronological ordering

---

## Demo Page

Visit `/joan-demo` (protected route) to see all components in action:
- Avatar size variants
- Live activity feed
- Settings panel
- Usage examples
- Integration notes

---

## Personality

Joan is designed to feel:
- **Professional** - Clean, organized, trustworthy
- **Approachable** - Friendly colors, clear language
- **Active** - Pulse animations, real-time updates
- **Helpful** - Descriptive messages, clear actions

The accent color (green) makes Joan stand out while staying within TrueVoice's design system.

---

## TODO

- [ ] Add `updateJoanSettings` mutation to persist settings
- [ ] Add `joan_settings` table to schema
- [ ] Implement notification preferences
- [ ] Add activity filtering (by action type, date range)
- [ ] Add "Mark as read" functionality for activities
- [ ] Add activity search
- [ ] Implement activity detail modal
- [ ] Add activity export (CSV/JSON)
- [ ] Add Joan onboarding tour
- [ ] Add Joan analytics dashboard

---

## Dependencies

- `convex` - Real-time data subscriptions
- `lucide-react` - Icons
- `date-fns` - Timestamp formatting
- `@radix-ui/*` - UI primitives (via shadcn/ui)
- `tailwindcss` - Styling

---

## File Structure

```
src/components/
├── joan/
│   ├── index.ts          # Exports all Joan components
│   └── README.md         # This file
├── JoanAvatar.tsx        # Avatar component
├── JoanActivityFeed.tsx  # Activity feed component
└── JoanSettings.tsx      # Settings panel component

src/pages/
└── JoanDemo.tsx          # Demo page showing all components

convex/
├── schema.ts             # joan_activity table definition
└── queries.ts            # getJoanActivity query
```

---

## Questions?

See the demo page at `/joan-demo` or check the inline component documentation.
