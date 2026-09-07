# Joan Components - Quick Start

## 30-Second Integration

### 1. Import
```tsx
import { JoanAvatar, JoanActivityFeed, JoanSettings } from "@/components/joan";
```

### 2. Use in Dashboard Sidebar
```tsx
<div className="flex items-center gap-3 p-4 border-b">
  <JoanAvatar size="sm" />
  <div>
    <p className="text-sm font-medium">Joan</p>
    <p className="text-xs text-muted-foreground">AI Assistant</p>
  </div>
</div>
```

### 3. Add Activity Panel
```tsx
<Card>
  <CardHeader>
    <CardTitle>Joan's Activity</CardTitle>
  </CardHeader>
  <CardContent>
    <JoanActivityFeed companyId={companyId} limit={10} />
  </CardContent>
</Card>
```

### 4. Add Settings Tab
```tsx
<TabsContent value="joan">
  <JoanSettings companyId={companyId} />
</TabsContent>
```

---

## Component Props Cheat Sheet

### JoanAvatar
```tsx
size?: "sm" | "md" | "lg"    // Default: "md"
showPulse?: boolean          // Default: true
className?: string           // Additional classes
```

### JoanActivityFeed
```tsx
companyId: string            // Required
limit?: number               // Default: 20
```

### JoanSettings
```tsx
companyId: string            // Required
```

---

## Common Patterns

### Dashboard Widget
```tsx
<div className="grid grid-cols-2 gap-4">
  <Card>
    <CardHeader className="flex flex-row items-center gap-2">
      <JoanAvatar size="sm" showPulse />
      <CardTitle className="text-base">Joan Activity</CardTitle>
    </CardHeader>
    <CardContent>
      <JoanActivityFeed companyId={companyId} limit={5} />
    </CardContent>
  </Card>
</div>
```

### Sidebar Item
```tsx
<SidebarMenuItem>
  <SidebarMenuButton asChild>
    <Link to="/joan-demo">
      <JoanAvatar size="sm" className="mr-2" />
      <span>Joan Assistant</span>
    </Link>
  </SidebarMenuButton>
</SidebarMenuItem>
```

### Header Notification
```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="icon" className="relative">
      <JoanAvatar size="sm" showPulse />
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-96">
    <JoanActivityFeed companyId={companyId} limit={5} />
  </PopoverContent>
</Popover>
```

---

## Demo Page

Visit `/joan-demo` to see all components with:
- Size variants
- Live activity feed
- Full settings panel
- Integration examples
- Usage snippets

---

## Need More?

📖 Full documentation: `/src/components/joan/README.md`
🎨 Design system: `/src/index.css`
🗄️ Schema: `/convex/schema.ts` (joan_activity table)
🔍 Queries: `/convex/queries.ts` (getJoanActivity)

---

**That's it!** Joan is ready to use. 🎉
