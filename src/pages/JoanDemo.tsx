import { useState } from "react";
import { JoanAvatar, JoanActivityFeed, JoanSettings } from "../components/joan";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

/**
 * Demo page showcasing Joan's AI assistant features
 *
 * This page demonstrates:
 * 1. JoanAvatar - Visual representation with animations
 * 2. JoanActivityFeed - Real-time activity stream
 * 3. JoanSettings - Configuration panel
 */
export default function JoanDemo() {
  // In production, get this from auth context
  const [companyId] = useState("demo-company-123");

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <JoanAvatar size="lg" />
          <div>
            <h1 className="text-3xl font-bold">Meet Joan</h1>
            <p className="text-muted-foreground">
              Your AI hiring coordinator assistant
            </p>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Avatar variants */}
          <Card>
            <CardHeader>
              <CardTitle>Avatar Variants</CardTitle>
              <CardDescription>
                Different sizes and states
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <JoanAvatar size="sm" />
                <div>
                  <p className="text-sm font-medium">Small</p>
                  <p className="text-xs text-muted-foreground">Sidebar / inline</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <JoanAvatar size="md" />
                <div>
                  <p className="text-sm font-medium">Medium</p>
                  <p className="text-xs text-muted-foreground">Default size</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <JoanAvatar size="lg" />
                <div>
                  <p className="text-sm font-medium">Large</p>
                  <p className="text-xs text-muted-foreground">Headers / emphasis</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <JoanAvatar size="md" showPulse={false} />
                <div>
                  <p className="text-sm font-medium">No pulse</p>
                  <p className="text-xs text-muted-foreground">Inactive state</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Middle column - Activity Feed */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Activity Feed</CardTitle>
              <CardDescription>
                Real-time updates from Joan (subscribes to Convex)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JoanActivityFeed companyId={companyId} limit={10} />
            </CardContent>
          </Card>
        </div>

        {/* Settings panel */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Control how Joan assists with your hiring process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="settings" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:w-auto">
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="usage">Usage Example</TabsTrigger>
              </TabsList>

              <TabsContent value="settings" className="mt-6">
                <JoanSettings companyId={companyId} />
              </TabsContent>

              <TabsContent value="usage" className="mt-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <h4 className="text-sm font-semibold mb-2">Usage in your app</h4>
                    <pre className="text-xs text-muted-foreground font-mono overflow-x-auto">
{`import { JoanAvatar, JoanActivityFeed, JoanSettings } from "@/components/joan";

// In your dashboard sidebar:
<JoanAvatar size="sm" />

// In your activity panel:
<JoanActivityFeed companyId={companyId} limit={20} />

// In your settings page:
<JoanSettings companyId={companyId} />`}
                    </pre>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <h4 className="text-sm font-semibold mb-2">Features</h4>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Real-time activity feed via Convex subscriptions</li>
                      <li>Animated avatar with pulse effect</li>
                      <li>Configurable automation settings</li>
                      <li>Success/error state handling</li>
                      <li>Responsive design with Tailwind</li>
                      <li>Accessible with Radix UI primitives</li>
                      <li>Type-safe with TypeScript</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Integration notes */}
        <Card className="bg-accent/5 border-accent/20">
          <CardHeader>
            <CardTitle className="text-accent">Integration Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong className="text-accent">Activity Feed:</strong>{" "}
              <span className="text-muted-foreground">
                Uses <code className="text-xs bg-muted px-1 py-0.5 rounded">useQuery(api.queries.getJoanActivity)</code> to subscribe to real-time updates.
                Activities are automatically sorted by timestamp (newest first).
              </span>
            </div>
            <div>
              <strong className="text-accent">Settings:</strong>{" "}
              <span className="text-muted-foreground">
                Currently stores state locally. To persist settings, add a mutation:
                <code className="text-xs bg-muted px-1 py-0.5 rounded ml-1">api.mutations.updateJoanSettings</code>
              </span>
            </div>
            <div>
              <strong className="text-accent">Icons:</strong>{" "}
              <span className="text-muted-foreground">
                Uses Lucide React icons throughout. Each action type has a unique icon and color.
              </span>
            </div>
            <div>
              <strong className="text-accent">Personality:</strong>{" "}
              <span className="text-muted-foreground">
                Professional but approachable. Uses accent colors (green) to stand out while maintaining
                the TrueVoice design system. The avatar pulse effect gives a sense of active monitoring.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
